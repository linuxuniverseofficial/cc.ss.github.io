'use strict';
/* Coastal Chaos · js/33-sinuca-skate-dados.js — Sinuca, skate, minigames, agiota, dado mentiroso.
   Script clássico (não é módulo): todos os js/NN-*.js dividem o mesmo escopo global e entram na ordem do index.html. */
/* ================= v79r5 · SINUCA "CASTIGADO" NO CASSINO =================
   Mano a mano contra o Seu Zé (máquina). 15 bolas: a 1 é o CASTIGO e fica longe do triângulo; as outras 14 no triângulo.
   Pares (2,4…14) contra ímpares (3,5…15): a primeira bola encaçapada sem falta define o grupo de quem tacou.
   Quem derrubar todas as suas tem que derrubar o castigo. Bater primeiro no castigo antes da hora = desce a menor bola do adversário.
   Matar o castigo antes da hora (ou junto com a branca) = entrega o jogo. Branca na caçapa = passa a vez e a branca volta pra marca.
   Física 2D própria (bola×bola elástica, tabelas, 6 caçapas), subpassos fixos. Vistas: 3D atrás da branca (só gira pros lados) e de cima. */
var POOL={on:false,built:false,view:'3d',aim:0,pow:.6,balls:[],turn:0,groups:[null,null],phase:'aim',msg:'',aiT:0,aiAim:0,bet:50,npc:null,cashier:null,drag:null,keys:{},cam:null,first:null,potted:[],cuePot:false,end:null,hudT:0,save:null};
const POOL_R=.0286,POOL_COL={1:'#f2c21a',2:'#1e4fb8',3:'#d42a2a',4:'#5a2a8a',5:'#f07818',6:'#1e8a3a',7:'#7a1a1a',8:'#111114'},POOL_NAME='SEU ZÉ';
function poolCol(n){return n===0?'#f4f2ea':POOL_COL[n>8?n-8:n]}
function poolPar(n){return n%2===0?'par':'impar'}
function poolTab(){return CAS.pool}
function poolPockets(){const t=poolTab();return[[-t.hw,-t.hl,.07],[t.hw,-t.hl,.07],[-t.hw,0,.062],[t.hw,0,.062],[-t.hw,t.hl,.07],[t.hw,t.hl,.07]]}
function poolTex(n){const c=cv(256,128),g=c.getContext('2d'),col=poolCol(n);
 if(n===0){g.fillStyle=col;g.fillRect(0,0,256,128);g.fillStyle='#c82020';for(const u of[64,192]){g.beginPath();g.arc(u,64,5,0,7);g.fill()}}
 else{const st=n>8;g.fillStyle=st?'#f4f2ea':col;g.fillRect(0,0,256,128);if(st){g.fillStyle=col;g.fillRect(0,36,256,56)}
  for(const u of[64,192]){g.fillStyle='#f8f6ee';g.beginPath();g.ellipse(u,64,22,26,0,0,7);g.fill();g.fillStyle='#111';g.font='900 '+(n>9?26:30)+'px Arial Black, Arial, sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(String(n),u,66);if(n===6||n===9){g.fillRect(u-8,80,16,3)}}}
 const t=new THREE.CanvasTexture(c);t.anisotropy=4;return t}
function poolMatcap(){const c=cv(128,128),g=c.getContext('2d'),gr=g.createRadialGradient(44,38,2,64,64,66);gr.addColorStop(0,'#ffffff');gr.addColorStop(.12,'#f4f4f4');gr.addColorStop(.55,'#a8a8a8');gr.addColorStop(1,'#404040');g.fillStyle=gr;g.fillRect(0,0,128,128);return new THREE.CanvasTexture(c)}
function poolBuild(){if(POOL.built)return;const t=poolTab(),grp=new THREE.Group();(CAS.casinoScene||CAS.grp).add(grp);POOL.grp=grp;const geo=new THREE.SphereGeometry(POOL_R,32,20),mc=poolMatcap();POOL.mesh=[];
 for(let n=0;n<=15;n++){const m=new THREE.Mesh(geo,new THREE.MeshMatcapMaterial({map:poolTex(n),matcap:mc}));grp.add(m);POOL.mesh[n]=m}
 const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(12),3));POOL.line=new THREE.LineSegments(lg,new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.85,depthTest:false}));POOL.line.renderOrder=6;POOL.line.frustumCulled=false;grp.add(POOL.line);
 POOL.ghost=new THREE.Mesh(new THREE.RingGeometry(POOL_R*.86,POOL_R,24),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.8,depthTest:false,side:THREE.DoubleSide}));POOL.ghost.rotation.x=-Math.PI/2;POOL.ghost.renderOrder=6;grp.add(POOL.ghost);
 const cg=new THREE.CylinderGeometry(.0055,.0115,1.42,10);cg.translate(0,-.71,0);cg.rotateX(Math.PI/2);/* ponta no (0,0,0), cabo pra −z */
 POOL.cue=new THREE.Group();const cm=new THREE.Mesh(cg,new THREE.MeshBasicMaterial({color:0xc8a070}));const tip=new THREE.Mesh(new THREE.CylinderGeometry(.0057,.0057,.012,10),new THREE.MeshBasicMaterial({color:0x2a5aa8}));tip.rotation.x=Math.PI/2;tip.position.z=-.006;const butt=new THREE.Mesh(new THREE.CylinderGeometry(.0118,.0118,.36,10),new THREE.MeshBasicMaterial({color:0x2a1a12}));butt.rotation.x=Math.PI/2;butt.position.z=-1.24;POOL.cue.add(cm,tip,butt);grp.add(POOL.cue);
 POOL.built=true}
function poolW(x,z){const t=poolTab();return[t.x+x,t.z+z]}
function poolRack(){const t=poolTab(),B=[],d=POOL_R*2*1.003,apex=t.hl*.5,slots=[];for(let k=0;k<5;k++)for(let i=0;i<=k;i++){if(k===2&&i===1)continue;slots.push([(i-k/2)*d,apex+k*d*.866])}
 const nums=[2,3,4,5,6,7,8,9,10,11,12,13,14,15];for(let i=nums.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[nums[i],nums[j]]=[nums[j],nums[i]]}
 B.push({n:0,x:0,z:-t.hl*.5,vx:0,vz:0,in:false});B.push({n:1,x:-t.hw*.62,z:-t.hl*.8,vx:0,vz:0,in:false});slots.forEach((s,i)=>B.push({n:nums[i],x:s[0]+(Math.random()-.5)*.0006,z:s[1],vx:0,vz:0,in:false}));
 POOL.balls=B;for(const b of B){const m=POOL.mesh[b.n];m.visible=true;m.quaternion.setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2);m.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.random()*6.28))}}
function poolBall(n){return POOL.balls.find(b=>b.n===n)}
function poolLeft(g){return POOL.balls.filter(b=>!b.in&&b.n>1&&poolPar(b.n)===g)}
function poolOnCast(s){const g=POOL.groups[s];return !!g&&poolLeft(g).length===0}
function poolMoving(){return POOL.balls.some(b=>!b.in&&(Math.abs(b.vx)>.004||Math.abs(b.vz)>.004))}
function poolStep(h){const t=poolTab(),R=POOL_R,B=POOL.balls,P=poolPockets();
 for(const b of B){if(b.in)continue;b.x+=b.vx*h;b.z+=b.vz*h;const sp=Math.hypot(b.vx,b.vz);if(sp>0){const ns=Math.max(0,sp-.62*h-sp*.06*h);b.vx*=ns/sp;b.vz*=ns/sp}}
 for(let i=0;i<B.length;i++){const a=B[i];if(a.in)continue;for(let j=i+1;j<B.length;j++){const c=B[j];if(c.in)continue;const dx=c.x-a.x,dz=c.z-a.z,d2=dx*dx+dz*dz;if(d2>=4*R*R||d2===0)continue;const d=Math.sqrt(d2),nx=dx/d,nz=dz/d,ov=2*R-d;a.x-=nx*ov/2;a.z-=nz*ov/2;c.x+=nx*ov/2;c.z+=nz*ov/2;
   const vn=(a.vx-c.vx)*nx+(a.vz-c.vz)*nz;if(vn>0){const im=vn*.97;a.vx-=im*nx;a.vz-=im*nz;c.vx+=im*nx;c.vz+=im*nz;if(POOL.first===null){if(a.n===0)POOL.first=c.n;else if(c.n===0)POOL.first=a.n}if(vn>.3){POOL.clack=Math.max(POOL.clack||0,Math.min(1,vn/3));try{poolClack(Math.min(1,vn/3)*.6)}catch(e){}}}}}
 for(const b of B){if(b.in)continue;
  for(const p of P){if(Math.hypot(b.x-p[0],b.z-p[1])<p[2]){b.in=true;b.vx=b.vz=0;if(b.n===0)POOL.cuePot=true;else POOL.potted.push(b.n);break}}if(b.in)continue;
  const mouthX=Math.abs(b.z)<.068||Math.abs(b.z)>t.hl-.09,mouthZ=Math.abs(b.x)>t.hw-.09;
  if(b.x<-t.hw+R&&!mouthX){b.x=-t.hw+R;if(b.vx<0)b.vx=-b.vx*.76}if(b.x>t.hw-R&&!mouthX){b.x=t.hw-R;if(b.vx>0)b.vx=-b.vx*.76}
  if(b.z<-t.hl+R&&!mouthZ){b.z=-t.hl+R;if(b.vz<0)b.vz=-b.vz*.76}if(b.z>t.hl-R&&!mouthZ){b.z=t.hl-R;if(b.vz>0)b.vz=-b.vz*.76}
  if(Math.abs(b.x)>t.hw+.05||Math.abs(b.z)>t.hl+.05){let best=null,bd=1e9;for(const p of P){const d=Math.hypot(b.x-p[0],b.z-p[1]);if(d<bd){bd=d;best=p}}b.in=true;b.vx=b.vz=0;if(b.n===0)POOL.cuePot=true;else POOL.potted.push(b.n)}}}
/* previsão: da branca até o 1º contato (bola ou tabela); devolve ponto da branca no contato e a bola atingida */
function poolCast(ox,oz,dx,dz,skip){const t=poolTab(),R=POOL_R;let best=1e9,hit=null;
 for(const b of POOL.balls){if(b.in||b.n===0||b===skip)continue;const fx=ox-b.x,fz=oz-b.z,bb=fx*dx+fz*dz,cc=fx*fx+fz*fz-4*R*R,disc=bb*bb-cc;if(disc<0)continue;const s=-bb-Math.sqrt(disc);if(s>1e-4&&s<best){best=s;hit=b}}
 for(const [v,lim] of [[dx,t.hw-R],[dz,t.hl-R]]){if(Math.abs(v)<1e-6)continue;const o=v===dx?ox:oz,s=((v>0?lim:-lim)-o)/v;if(s>0&&s<best){best=s;hit=null}}
 return{s:best,x:ox+dx*best,z:oz+dz*best,ball:hit}}
function poolShoot(aim,pow){const c=poolBall(0);if(!c||c.in||POOL.phase!=='aim')return;const sp=.35+pow*4.3;c.vx=Math.sin(aim)*sp;c.vz=Math.cos(aim)*sp;POOL.first=null;POOL.potted=[];POOL.cuePot=false;POOL.castAt=poolOnCast(POOL.turn);POOL.phase='roll';POOL.cue.visible=false;POOL.line.visible=false;POOL.ghost.visible=false;try{poolClack(.55+pow*.45)}catch(e){}}
function poolSpot(c){const t=poolTab();c.in=false;c.vx=c.vz=0;c.x=0;c.z=-t.hl*.5;for(let k=0;k<40&&POOL.balls.some(b=>b!==c&&!b.in&&Math.hypot(b.x-c.x,b.z-c.z)<POOL_R*2.05);k++)c.x=((k%2)?1:-1)*Math.ceil(k/2+1)*POOL_R*2.2}
function poolName(s){return s===0?translatePlain('VOCÊ'):POOL_NAME}
function poolResolve(){const s=POOL.turn,o=1-s,cast=POOL.castAt!=null?POOL.castAt:poolOnCast(s),pot=POOL.potted,fh=POOL.first,cue=POOL.cuePot;let foul=null,msg='';
 if(pot.includes(1)){const win=cast&&fh===1&&!cue;return poolEnd(win?s:o,win?poolName(s)+' '+translatePlain('MATOU O CASTIGO E VENCEU!'):poolName(s)+' '+translatePlain('MATOU O CASTIGO FORA DA HORA · ENTREGOU O JOGO'))}
 if(fh===null)foul=translatePlain('não acertou nenhuma bola');
 else if(fh===1&&!cast)foul=translatePlain('bateu no castigo');
 else if(cast&&fh!==1)foul=translatePlain('tinha que bater no castigo');
 else if(POOL.groups[s]&&!cast&&poolPar(fh)!==POOL.groups[s])foul=translatePlain('bateu primeiro na bola do adversário');
 if(cue){foul=foul||translatePlain('branca na caçapa');poolSpot(poolBall(0))}
 if(foul){
  const group=POOL.groups[o];
  const candidates=group?poolLeft(group):POOL.balls.filter(ball=>!ball.in&&ball.n>1);
  const lowest=candidates.sort((a,b)=>a.n-b.n)[0];
  if(lowest){
   lowest.in=true;
   msg=' · '+translatePlain('desce a bola')+' '+lowest.n+' '+translatePlain('do adversário');
   if(!group){
    POOL.groups[o]=poolPar(lowest.n);
    POOL.groups[s]=POOL.groups[o]==='par'?'impar':'par';
    msg+=' · '+poolName(o)+' '+translatePlain('fica com as')+' '+translatePlain(POOL.groups[o]==='par'?'PARES':'ÍMPARES');
   }
  }
 }
 if(!POOL.groups[s]&&!foul){const f=pot.find(n=>n>1);if(f){POOL.groups[s]=poolPar(f);POOL.groups[o]=POOL.groups[s]==='par'?'impar':'par';msg+=' · '+poolName(s)+' '+translatePlain('fica com as')+' '+translatePlain(POOL.groups[s]==='par'?'PARES':'ÍMPARES')}}
 const own=POOL.groups[s]?pot.filter(n=>n>1&&poolPar(n)===POOL.groups[s]).length:0;const cont=!foul&&own>0;
 POOL.msg=(foul?translatePlain('FALTA')+': '+foul:own?poolName(s)+' '+translatePlain('encaçapou')+' '+pot.filter(n=>n>1).join(', ')+' · '+translatePlain('joga de novo'):poolName(s)+' '+translatePlain('não encaçapou'))+msg+(cont?'':' · '+translatePlain('vez de')+' '+poolName(o));
 POOL.turn=cont?s:o;POOL.phase='aim';POOL.aiT=1.3;if(POOL.turn===1)POOL.aiAim=null;
 if(POOL.turn===0){const c=poolBall(0),tg=poolTargets(0)[0];if(c&&tg&&!POOL.keepAim)POOL.aim=Math.atan2(tg.x-c.x,tg.z-c.z)}
 if(POOL.npc&&peds.includes(POOL.npc)){if(foul&&s===0)say(POOL.npc,'Falta! Minha vez.',2);else if(foul&&s===1)say(POOL.npc,'Ih, vacilei…',2);else if(cont&&s===1)say(POOL.npc,'Essa é minha!',1.6)}}
function poolTargets(s){if(poolOnCast(s))return POOL.balls.filter(b=>b.n===1&&!b.in);const g=POOL.groups[s];return POOL.balls.filter(b=>!b.in&&b.n>1&&(!g||poolPar(b.n)===g))}
function poolEnd(w,txt){POOL.phase='end';POOL.end={w,txt};if(w===0){money(POOL.bet*2,'SINUCA · +$'+POOL.bet*2)}poolHud(true);if(POOL.npc&&peds.includes(POOL.npc))say(POOL.npc,w===0?'Bem jogado! Outra?':'Hoje não, parceiro!',2.6)}
function poolClear(ax,az,bx,bz,ex){const R=POOL_R,dx=bx-ax,dz=bz-az,L=Math.hypot(dx,dz)||1;for(const b of POOL.balls){if(b.in||ex.includes(b))continue;const t=clamp(((b.x-ax)*dx+(b.z-az)*dz)/(L*L),0,1),px=ax+dx*t-b.x,pz=az+dz*t-b.z;if(px*px+pz*pz<4*R*R*1.05)return false}return true}
function poolAI(){const c=poolBall(0),T=poolTargets(1),P=poolPockets(),R=POOL_R;let best=null;
 for(const b of T)for(const p of P){const px=p[0]*.97,pz=p[1]*.985,tx=px-b.x,tz=pz-b.z,tl=Math.hypot(tx,tz),ux=tx/tl,uz=tz/tl,gx=b.x-ux*2*R,gz=b.z-uz*2*R,cx=gx-c.x,cz=gz-c.z,cl=Math.hypot(cx,cz);if(cl<1e-4)continue;
  const cosc=(cx*ux+cz*uz)/cl;if(cosc<.3)continue;const cast=poolOnCast(1);
  if(!poolClear(c.x,c.z,gx,gz,[c,b])||!poolClear(b.x,b.z,px,pz,[b]))continue;
  const hit=poolCast(c.x,c.z,cx/cl,cz/cl);if(hit.ball&&hit.ball!==b)continue;if(!cast&&hit.ball&&hit.ball.n===1)continue;
  const sc=cosc*2.2-(cl+tl)*.55-(Math.abs(p[1])<.01?.25:0);if(!best||sc>best.sc)best={sc,aim:Math.atan2(cx,cz),pow:clamp(.2+(cl+tl*1.3)*.2/Math.max(.35,cosc),.25,.85)}}
 if(!best){let nb=null,nd=1e9;for(const b of T){const d=Math.hypot(b.x-c.x,b.z-c.z);if(d<nd){nd=d;nb=b}}if(nb)best={aim:Math.atan2(nb.x-c.x,nb.z-c.z),pow:.45};else best={aim:Math.random()*6.28,pow:.4}}
 const good=Math.random()<.46,err=good?(Math.random()-.5)*.012:(Math.random()<.5?-1:1)*(.035+Math.random()*.07);return{aim:best.aim+err,pow:best.pow*(good?1:.85+Math.random()*.3)}} /* v79r7: Seu Zé acerta ~40% (antes quase tudo) */
function poolOpen(){if(POOL.on||PL.inside!=='casino'||PL.car||PL.dead)return;if((PL.money||0)<POOL.bet){toast(translatePlain('SINUCA')+' · '+translatePlain('PRECISA DE')+' $'+POOL.bet);clang(.1);return}
 POOL.on=true;for(const k in keys)keys[k]=false;GUN.firing=false;if(document.pointerLockElement)document.exitPointerLock();POOL.save={fov:camera.fov,near:camera.near,pv:PL.sp.visible,sv:PL.sh.visible};PL.sp.visible=false;PL.sh.visible=false;
 $('#pool').hidden=false;document.body.classList.add('pool-mode');$('#plLoad').hidden=false;$('#plEnd').hidden=true;POOL.view=POOL.view||'3d';
 setTimeout(()=>{try{poolBuild();POOL.grp.visible=true;poolNew()}catch(e){console.error(e);poolClose();return}$('#plLoad').hidden=true},60)}
function poolNew(){if((PL.money||0)<POOL.bet){toast(translatePlain('PRECISA DE')+' $'+POOL.bet);poolClose();return}gambleCharge(POOL.bet,'SINUCA · −'+betFmt(POOL.bet));poolRack();POOL.turn=0;POOL.groups=[null,null];POOL.phase='aim';POOL.end=null;POOL.msg=translatePlain('Sua vez: abra o jogo! Pares contra ímpares · a bola 1 é o castigo.');POOL.aim=0;POOL.pow=.8;POOL.cam=null;POOL.look=null;POOL.zoom=POOL.zoom??.45;$('#plPow').value=80;$('#plEnd').hidden=true;
 if(POOL.npc&&peds.includes(POOL.npc))say(POOL.npc,'Bora! Você abre.',2);poolHud(true)}
function poolClose(){if(!POOL.on)return;POOL.on=false;if(POOL.grp)POOL.grp.visible=false;$('#pool').hidden=true;document.body.classList.remove('pool-mode');camera.up.set(0,1,0);camera.clearViewOffset();if(POOL.save){camera.fov=POOL.save.fov;camera.near=POOL.save.near;camera.updateProjectionMatrix();PL.sp.visible=POOL.save.pv;PL.sh.visible=POOL.save.sv}POOL.drag=null;POOL.keys={};if(POOL.npc&&POOL.npc.sp){POOL.npc.sp.visible=true;POOL.npc.sh.visible=true}
 if(POOL.phase!=='end'&&POOL.balls.length&&POOL.end===null&&POOL.phase!=='idle')toast(translatePlain('SINUCA')+' · '+translatePlain('aposta perdida por abandonar'));POOL.phase='idle';const t=poolTab();if(t){PL.x=t.x+.95;PL.z=t.z;PL.face=[-1,0];camT.x=PL.x;camT.z=PL.z}}
function poolView(){POOL.view=POOL.view==='3d'?'top':'3d';POOL.cam=null;poolHud(true)}
function poolTick(dt){if(!POOL.built||!POOL.balls.length)return;const c=poolBall(0);
 if(POOL.phase==='aim'&&POOL.turn===0){const K=POOL.keys,rate=(K.fine?.22:1.1)*dt;if(K.l)POOL.aim+=rate;if(K.r)POOL.aim-=rate;if(K.u)POOL.pow=clamp(POOL.pow+dt*.6,.05,1);if(K.d)POOL.pow=clamp(POOL.pow-dt*.6,.05,1);if(K.u||K.d)$('#plPow').value=Math.round(POOL.pow*100)}
 if(POOL.phase==='aim'&&POOL.turn===1){if(POOL.aiAim===null){const a=poolAI();POOL.aiAim=a.aim;POOL.aiPow=a.pow;POOL.aiFrom=POOL.aim;POOL.aiT=2.8}POOL.aiT-=dt;const k=clamp(1-POOL.aiT/2.8,0,1); /* v79r7: mira do Zé na metade da velocidade */let d=POOL.aiAim-POOL.aiFrom;d=Math.atan2(Math.sin(d),Math.cos(d));POOL.aim=POOL.aiFrom+d*Math.min(1,k*1.6);POOL.pow=POOL.aiPow*Math.min(1,k*1.3);if(POOL.aiT<=0)poolShoot(POOL.aiAim,POOL.aiPow)}
 if(POOL.phase==='roll'){const n=Math.max(1,Math.ceil(dt/(1/720)));for(let i=0;i<n;i++)poolStep(dt/n);if(!poolMoving()){for(const b of POOL.balls){b.vx=b.vz=0}poolResolve()}}
 const t=poolTab(),y=t.y+POOL_R,ax=new THREE.Vector3(),q=new THREE.Quaternion();
 for(const b of POOL.balls){const m=POOL.mesh[b.n];if(b.in){m.visible=false;continue}m.visible=true;const w=poolW(b.x,b.z);const px=m.position.x,pz=m.position.z;m.position.set(w[0],y,w[1]);const dx=w[0]-px,dz=w[1]-pz,l=Math.hypot(dx,dz);if(l>1e-6&&l<.5){ax.set(dz/l,0,-dx/l);q.setFromAxisAngle(ax,l/POOL_R);m.quaternion.premultiply(q)}}
 const aiming=POOL.phase==='aim'&&c&&!c.in;POOL.cue.visible=aiming;POOL.line.visible=aiming&&POOL.turn===0;POOL.ghost.visible=false;
 if(aiming){const dx=Math.sin(POOL.aim),dz=Math.cos(POOL.aim),cw=poolW(c.x,c.z),back=.035+POOL.pow*.22+(POOL.turn===1?Math.sin(simT*3)*.02:0);POOL.cue.position.set(cw[0]-dx*back,y+.012,cw[1]-dz*back);POOL.cue.lookAt(cw[0]+dx,y-.06,cw[1]+dz);
  if(POOL.turn===0){const h=poolCast(c.x,c.z,dx,dz),A=POOL.line.geometry.attributes.position,gw=poolW(h.x,h.z),yy=t.y+.004;A.setXYZ(0,cw[0],yy,cw[1]);A.setXYZ(1,gw[0],yy,gw[1]);if(h.ball){const nx=h.ball.x-h.x,nz=h.ball.z-h.z,nl=Math.hypot(nx,nz)||1,bw=poolW(h.ball.x,h.ball.z);A.setXYZ(2,bw[0],yy,bw[1]);A.setXYZ(3,bw[0]+nx/nl*.22,yy,bw[1]+nz/nl*.22);POOL.ghost.visible=true;POOL.ghost.position.set(gw[0],yy,gw[1]);POOL.aimBall=h.ball.n}else{A.setXYZ(2,gw[0],yy,gw[1]);A.setXYZ(3,gw[0],yy,gw[1]);POOL.aimBall=null}A.needsUpdate=true}}
 POOL.hudT-=dt;if(POOL.hudT<=0){POOL.hudT=.15;poolHud()}}
function poolCam(dt){const t=poolTab(),c=poolBall(0);if(!t)return;camera.near=.02;if(POOL.view==='top'){const asp=innerWidth/innerHeight,f=Math.tan(THREE.MathUtils.degToRad(46)/2),bd=hudBand('#pool .pl-top','#pool .pl-bot'),bf=bd?Math.max(.3,bd.f):1,hx=t.hl+.28,hz=t.hw+.3,h=Math.min(2.6,Math.max(hz/f,hx/(f*asp))*1.06),tn=Math.max(hz/(h*bf),hx/(h*asp))*1.06,z=POOL.tz||0,fz=Math.min(100,2*Math.atan(Math.max(f,tn)/(1+z*2.5))*180/Math.PI),cw=c&&!c.in?poolW(c.x,c.z):[t.x,t.z],m=Math.min(1,z*1.4),px=t.x+(cw[0]-t.x)*m,pz=t.z+(cw[1]-t.z)*m;camera.fov=fz; /* altura presa abaixo do teto do cassino (2,75); cabe na faixa abrindo a lente e o zoom fecha a lente */camera.up.set(1,0,0);camera.position.set(px,t.y+h,pz);camera.lookAt(px,t.y,pz);
  if(bd){const W=innerWidth,H=innerHeight;camera.setViewOffset(W,H,0,Math.round(H/2-bd.c),W,H)}} /* v79r35: cabe na faixa livre entre os painéis; o zoom aproxima e segue a branca */
 else{/* v79r8: como nos jogos de sinuca 3D — zoom contínuo entre "na tacada" (baixo, colado na branca) e "em pé" (alto, vendo a mesa); depois da tacada a câmera sobe e acompanha as bolas em movimento */
  const ref=c&&!c.in?poolW(c.x,c.z):[t.x,t.z],dx=Math.sin(POOL.aim),dz=Math.cos(POOL.aim),zm=POOL.zoom??.45,dist=.62+zm*1.35,hy=.14+zm*zm*1.05+zm*.12,want=new THREE.Vector3(ref[0]-dx*dist,t.y+hy,ref[1]-dz*dist),look=new THREE.Vector3(ref[0]+dx*(.45+zm*.5),t.y+.01,ref[1]+dz*(.45+zm*.5));
  if(POOL.phase==='roll'){let sx=0,sz=0,sw=0;for(const b of POOL.balls){if(b.in)continue;const v=Math.hypot(b.vx,b.vz);if(v<.02)continue;const w=poolW(b.x,b.z);sx+=w[0]*v;sz+=w[1]*v;sw+=v}const fx=sw?sx/sw:t.x,fz=sw?sz/sw:t.z,mx=(t.x+fx)/2,mz=(t.z+fz)/2;want.set(mx-dx*1.6,t.y+1.45,mz-dz*1.6);look.set(mx,t.y,mz)} /* do mesmo lado da tacada, alto, mirando entre o centro da mesa e as bolas em movimento — sem trocar de lado */
  camera.clearViewOffset();if(!POOL.cam){POOL.cam=want.clone();POOL.look=look.clone()}else{const k=Math.min(1,dt*(POOL.phase==='roll'?1.6:7));POOL.cam.lerp(want,k);(POOL.look||(POOL.look=look.clone())).lerp(look,k)}camera.fov=55;camera.up.set(0,1,0);camera.position.copy(POOL.cam);camera.lookAt(POOL.look)}
 camera.updateProjectionMatrix();if(typeof sky!=='undefined'&&sky)sky.position.copy(camera.position);if(POOL.npc&&POOL.npc.sp){POOL.npc.sp.visible=false;POOL.npc.sh.visible=false}} /* o adversário some durante a partida (sprite grande colado na mesa tampava a vista) */
function poolChip(n){return '<i class="plb" style="background:'+poolCol(n)+(n>8?';box-shadow:inset 0 0 0 3px #f4f2ea':'')+'">'+n+'</i>'}
function poolHud(force){if(!POOL.on)return;const side=s=>{const g=POOL.groups[s],L=g?poolLeft(g).map(b=>b.n).sort((a,b)=>a-b):[],cast=poolOnCast(s);return '<b>'+poolName(s)+'</b> <span>'+(g?translatePlain(g==='par'?'PARES':'ÍMPARES'):'—')+'</span><div>'+(g?(cast?translatePlain('no castigo')+' '+poolChip(1):L.map(poolChip).join('')):'')+'</div>'};
 const p0=$('#plP0'),p1=$('#plP1');p0.innerHTML=side(0);p1.innerHTML=side(1);p0.classList.toggle('on',POOL.turn===0&&POOL.phase!=='end');p1.classList.toggle('on',POOL.turn===1&&POOL.phase!=='end');
 $('#plMsg').textContent=POOL.phase==='end'?'':(POOL.turn===1&&POOL.phase==='aim'?POOL_NAME+' '+translatePlain('está mirando…'):POOL.phase==='roll'?'…':POOL.msg||translatePlain('Sua vez'));
 const ab=POOL.aimBall;$('#plAim').innerHTML=POOL.turn===0&&POOL.phase==='aim'?(ab?translatePlain('MIRA')+': '+poolChip(ab)+' '+translatePlain('bola')+' '+ab+(ab===1?' · '+translatePlain('CASTIGO'):' · '+translatePlain(poolPar(ab)==='par'?'par':'ímpar')):translatePlain('MIRA')+': '+translatePlain('tabela')):'';
 $('#plView').textContent=translatePlain(POOL.view==='3d'?'VER DE CIMA':'VER EM 3D');tzSync('#plZoom',POOL.view==='top'?(POOL.tz||0):1-(POOL.zoom??.45));$('#plShot').disabled=!(POOL.phase==='aim'&&POOL.turn===0);
 if(POOL.phase==='end'&&POOL.end){const e=$('#plEnd');if(e.hidden||force){e.hidden=false;$('#plEndT').textContent=POOL.end.w===0?translatePlain('VOCÊ VENCEU!')+' +$'+POOL.bet*2:translatePlain('VOCÊ PERDEU');$('#plEndS').textContent=POOL.end.txt;plStepRender()}}}
function plStepRender(){POOL.bet=betFix(POOL.bet);betStepUI('plStep',POOL.bet,d=>{POOL.bet=betNext(POOL.bet,d);plStepRender()});$('#plAgain').textContent=translatePlain('JOGAR DE NOVO')+' · '+betFmt(POOL.bet);$('#plAgain').disabled=(PL.money||0)<POOL.bet}
const POOL_PTR=new Map();
function poolPointer(e,kind){if(!POOL.on)return false;const el=renderer.domElement;if(e.target!==el&&kind!=='up')return false;
 if(kind==='down')POOL_PTR.set(e.pointerId,{x:e.clientX,y:e.clientY});else if(kind==='move'&&POOL_PTR.has(e.pointerId))POOL_PTR.set(e.pointerId,{x:e.clientX,y:e.clientY});else if(kind==='up')POOL_PTR.delete(e.pointerId);
 if(POOL_PTR.size>=2){const [a,b]=[...POOL_PTR.values()],d=Math.hypot(a.x-b.x,a.y-b.y);if(POOL.pinch&&POOL.view==='3d')POOL.zoom=clamp(POOL.pinch.z-(d-POOL.pinch.d)/300,0,1);else if(POOL.pinch&&POOL.view==='top'){POOL.tz=clamp(POOL.pinch.t+(d-POOL.pinch.d)/300,0,1);$('#plZoom input').value=Math.round(POOL.tz*100)}else POOL.pinch={d,z:POOL.zoom??.45,t:POOL.tz||0};POOL.drag=null;return true}POOL.pinch=null; /* v79r8: pinça = zoom da câmera 3D */
 if(e.target!==el)return false;if(POOL.phase!=='aim'||POOL.turn!==0)return true;
 if(kind==='down')POOL.drag={x:e.clientX,a:POOL.aim,id:e.pointerId,moved:false};
 if(POOL.view==='top'&&(kind==='down'||(kind==='move'&&(POOL.drag||e.pointerType==='mouse')))){const r=el.getBoundingClientRect(),v=new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),rc=new THREE.Raycaster();rc.setFromCamera(v,camera);const t=poolTab(),o=rc.ray.origin,d=rc.ray.direction;if(Math.abs(d.y)>1e-4){const k=(t.y-o.y)/d.y,px=o.x+d.x*k-t.x,pz=o.z+d.z*k-t.z,c=poolBall(0);if(c&&Math.hypot(px-c.x,pz-c.z)>.02)POOL.aim=Math.atan2(px-c.x,pz-c.z)}}
 else if(kind==='move'&&POOL.drag){const dx=e.clientX-POOL.drag.x;if(Math.abs(dx)>3)POOL.drag.moved=true;POOL.aim=POOL.drag.a-dx*(e.pointerType==='mouse'?.0035:.005)}
 if(kind==='up')POOL.drag=null;return true}
addEventListener('pointerdown',e=>{if(poolPointer(e,'down')){e.preventDefault();e.stopImmediatePropagation()}},true);
addEventListener('pointermove',e=>{if(POOL.on&&e.target===renderer.domElement){poolPointer(e,'move');e.stopImmediatePropagation()}},true);
addEventListener('pointerup',e=>{if(POOL.on){poolPointer(e,'up')}},true);
/* r30: toque na mesa que vira 'pointercancel' (gesto do navegador) deixava um dedo-fantasma no POOL_PTR → o próximo toque virava pinça e o zoom brigava com o slider */
addEventListener('pointercancel',e=>{if(POOL.on)poolPointer(e,'up')},true);
addEventListener('touchend',e=>{if(POOL.on&&!e.touches.length){POOL_PTR.clear();POOL.pinch=null}},true);addEventListener('touchcancel',e=>{if(POOL.on&&!e.touches.length){POOL_PTR.clear();POOL.pinch=null}},true);
for(const ev of ['mousedown','click','touchstart','touchmove','wheel','contextmenu'])addEventListener(ev,e=>{if(POOL.on&&e.target===renderer.domElement){if(ev==='wheel'&&POOL.view==='3d'){POOL.zoom=clamp((POOL.zoom??.45)+(e.deltaY>0?.08:-.08),0,1);e.preventDefault()}if(ev==='wheel'&&POOL.view==='top'){tzBump('#plZoom',POOL,'tz',e.deltaY>0?-.08:.08);e.preventDefault()}e.stopImmediatePropagation();if(ev!=='touchstart'&&ev!=='touchmove'&&ev!=='wheel')e.preventDefault()}},{capture:true,passive:false});
function poolKey(e,down){if(!POOL.on)return;const c=e.code,K=POOL.keys;if(document.activeElement&&document.activeElement.id==='plPow'&&(c==='ArrowLeft'||c==='ArrowRight'))document.activeElement.blur();
 if(c==='ArrowLeft'||c==='KeyA')K.l=down;else if(c==='ArrowRight'||c==='KeyD')K.r=down;else if(c==='ArrowUp'||c==='KeyW')K.u=down;else if(c==='ArrowDown'||c==='KeyS')K.d=down;else if(c==='ShiftLeft'||c==='ShiftRight')K.fine=down;
 else if(down&&!e.repeat&&(c==='Space'||c==='Enter')){if(POOL.phase==='end')poolNew();else if(POOL.turn===0)poolShoot(POOL.aim,POOL.pow)}
 else if(down&&!e.repeat&&(c==='KeyV'||c==='KeyC'||c==='Tab'))poolView();
 else if(down&&(c==='KeyQ'||c==='PageUp'||c==='Equal'||c==='NumpadAdd'))POOL.zoom=clamp((POOL.zoom??.45)-.08,0,1);else if(down&&(c==='KeyE'||c==='PageDown'||c==='Minus'||c==='NumpadSubtract'))POOL.zoom=clamp((POOL.zoom??.45)+.08,0,1);
 else if(down&&!e.repeat&&c==='Escape')poolClose();
 e.preventDefault();e.stopImmediatePropagation()}
addEventListener('keydown',e=>poolKey(e,true),true);addEventListener('keyup',e=>poolKey(e,false),true);
function poolPad(pr,dt){if(POOL.phase==='aim'&&POOL.turn===0){const lx=PAD.lx||0;if(Math.abs(lx)>.15)POOL.aim-=lx*1.1*dt*(Math.abs(lx)<.6?.35:1);const pw=((PAD.r2||0)-(PAD.l2||0))+(Math.abs(PAD.ry||0)>.25?-PAD.ry:0);if(Math.abs(pw)>.12){POOL.pow=clamp(POOL.pow+pw*dt*.7,.05,1);$('#plPow').value=Math.round(POOL.pow*100)}if(pr(14))POOL.aim+=.004;if(pr(15))POOL.aim-=.004;if(pr(12))POOL.zoom=clamp((POOL.zoom??.45)-.1,0,1);if(pr(13))POOL.zoom=clamp((POOL.zoom??.45)+.1,0,1)}
 if(pr(0)){if(POOL.phase==='end')poolNew();else if(POOL.phase==='aim'&&POOL.turn===0)poolShoot(POOL.aim,POOL.pow)}if(pr(3))poolView();if(pr(1)||pr(9))poolClose()}
function casPedsSpawn(){casPedsClear();const K=CAS.casinoBase;if(!K)return;const X=K.x,Z=K.z;
 const a=spawnPed(null,{x:X+8.95,z:Z+2.75,vx:0,vz:0,pal:{...CLERK_PAL,cap:null,capDark:null,shirt:'#f4f0e8',stripe:'#7a1a2a'}});if(a){a.state='clerk';a.fixed=true;a.at={x:X+8.95,z:Z+2.75};a.mx=-1;a.mz=0;a.timer=0;POOL.cashier=a}
 const b=spawnPed(null,{x:X-18.3,z:Z+2.4,vx:0,vz:0,pal:{...pick2(PED_PALS),shirt:'#2a4a3a',cap:'#1b1b1b'}});if(b){b.state='clerk';b.fixed=true;b.at={x:X-18.3,z:Z+2.4};b.mx=.76;b.mz=-.65;b.timer=0;POOL.npc=b}}
function casPedsClear(){for(const q of [POOL.cashier,POOL.npc])if(q&&peds.includes(q))removePed(q);POOL.cashier=POOL.npc=null}
/* ================= v79r14 · SKATE =================
   Fica no mundo como pickup (prancha no chão). F perto dele = sobe; F de novo = desce e ele fica ali.
   Andando: "desliza durinho" — W empurra, S freia, A/D faz a curva com uma leve inclinação; Espaço = pulo (ollie). Sem manobras.
   Bateu em qualquer coisa com velocidade = cai deitado e o skate sai do pé, parando ao lado como pickup.
   Deixado na garagem de casa fica salvo. Na oficina dá pra trocar cores/estampa; o shopping (2º piso) tem a SKATE SHOP. */
var SKATE={items:[],ride:null,g:null,tex:new Map(),near:null,ui:null,seeded:{},tuneLock:false,taught:false};
const SK_DECK=['#e8282a','#1e6ad6','#2ab36a','#f2c21a','#ff4fa0','#7a4ad6','#1a1a1e','#f4f2ea','#ff8a1a','#2ac8c8'],SK_WHEEL=['#f4f2ea','#f2c21a','#e8282a','#2ac8c8','#1a1a1e','#ff4fa0'],SK_PRINT=['LISA','CHAMAS','LISTRAS','ESTRELAS','XADREZ','RAIO','PALMEIRA','OLHO','EMOJI','TEXTO'],SK_EMO=3,SK_EMO_RND=['😎','🔥','💀','⚡','🌴','👽','🍕','🌈','👾','🦈','🤘','💯'];
const SK_SCL=[1.69,2.25,2.25],SK_PRICE=120,SK_TUNE=40,SK_UP=.145,SK_VMAX=38,SK_TOP=31.6,SK_TRADE=50,SK_TXT=6;
function skTxtClean(t){return [...String(t||'').toUpperCase()].filter(shirtGlyphOk).slice(0,SK_TXT).join('')}
function skLookDefault(){return{deck:'#e8282a',wheel:'#f4f2ea',print:'RAIO'}}
function skLookOk(L){return !!L&&SK_DECK.includes(L.deck)&&SK_WHEEL.includes(L.wheel)&&SK_PRINT.includes(L.print)&&(L.text==null||(typeof L.text==='string'&&skTxtClean(L.text)===L.text))&&(L.emo==null||(Array.isArray(L.emo)&&L.emo.length<=SK_EMO&&L.emo.every(emoOk)))}
function skTex(L){const k=L.deck+L.print+(L.print==='TEXTO'?'|'+(L.text||''):'')+(L.print==='EMOJI'?'|'+(L.emo||[]).join(','):'');if(SKATE.tex.has(k))return SKATE.tex.get(k);const c=cv(256,96),g=c.getContext('2d'),base=L.deck,ink=(['#1a1a1e','#7a4ad6','#1e6ad6','#e8282a'].includes(base))?'#f4f2ea':'#1a1a1e',r=mulberry32(k.length*131+k.charCodeAt(1)*7);
 g.fillStyle=base;g.fillRect(0,0,256,96);g.fillStyle=ink;g.strokeStyle=ink;
 const P=L.print;if(P==='CHAMAS'){g.fillStyle=base==='#ff8a1a'?'#e8282a':'#ff8a1a';for(let i=0;i<6;i++){const y=12+i*14;g.beginPath();g.moveTo(0,y-6);g.quadraticCurveTo(80,y-14,130+i*9,y);g.quadraticCurveTo(80,y+10,0,y+8);g.fill()}g.fillStyle='#f2c21a';for(let i=0;i<5;i++){const y=18+i*15;g.beginPath();g.moveTo(0,y-3);g.quadraticCurveTo(40,y-8,75+i*5,y);g.quadraticCurveTo(40,y+6,0,y+4);g.fill()}}
 else if(P==='LISTRAS'){for(let x=-96;x<256;x+=36){g.beginPath();g.moveTo(x,96);g.lineTo(x+16,96);g.lineTo(x+112,0);g.lineTo(x+96,0);g.fill()}}
 else if(P==='ESTRELAS'){const st=(x,y,rr)=>{g.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,q=i%2?rr*.45:rr;g.lineTo(x+Math.cos(a)*q,y+Math.sin(a)*q)}g.closePath();g.fill()};[[40,30,16],[100,64,12],[150,28,18],[210,62,14],[70,74,8],[188,20,8]].forEach(a=>st(...a))}
 else if(P==='XADREZ'){for(let x=0;x<256;x+=16)for(let y=0;y<96;y+=16)if(((x+y)/16)%2)g.fillRect(x,y,16,16)}
 else if(P==='RAIO'){g.beginPath();g.moveTo(30,50);g.lineTo(120,30);g.lineTo(114,45);g.lineTo(226,38);g.lineTo(136,68);g.lineTo(142,53);g.closePath();g.fill()}
 else if(P==='PALMEIRA'){g.lineCap='round';g.lineWidth=8;g.beginPath();g.moveTo(70,86);g.quadraticCurveTo(115,74,150,42);g.stroke();g.lineWidth=6;for(const a of[-2.6,-1.9,-1.2,-.4,.4]){g.beginPath();g.moveTo(150,42);g.quadraticCurveTo(150+Math.cos(a)*36,42+Math.sin(a)*26-12,150+Math.cos(a)*60,42+Math.sin(a)*30+8);g.stroke()}g.beginPath();g.arc(214,68,13,0,7);g.fillStyle='#ff8a1a';g.fill()}
 else if(P==='OLHO'){g.fillStyle='#f4f2ea';g.beginPath();g.ellipse(128,48,58,30,0,0,7);g.fill();g.lineWidth=4;g.strokeStyle='#1a1a1e';g.stroke();g.fillStyle='#2ab36a';g.beginPath();g.arc(128,48,20,0,7);g.fill();g.fillStyle='#1a1a1e';g.beginPath();g.arc(128,48,9,0,7);g.fill()}
 else if(P==='EMOJI'&&Array.isArray(L.emo)&&L.emo.length){const es=L.emo.filter(emoOk).slice(0,SK_EMO),n=es.length,sz=n===1?88:n===2?82:74; /* v3r2: até 3 emojis coloridos espalhados no shape */
  g.save();g.shadowColor='rgba(0,0,0,.35)';g.shadowOffsetX=g.shadowOffsetY=3;es.forEach((e,i)=>{const x=256*(i+.5)/n;g.save();g.translate(x,48);g.rotate(n>1?(i%2?.12:-.12):0);g.drawImage(emoCanvas(e,128),-sz/2,-sz/2,sz,sz);g.restore()});g.restore()}
 else if(P==='TEXTO'&&L.text){const ch=[...L.text],cols=ch.length*4-1,cs=Math.floor(Math.min(232/cols,72/5)),x0=Math.round((256-cols*cs)/2),y0=Math.round((96-5*cs)/2);
  for(const [dx,dy,col] of [[2,2,'rgba(0,0,0,.35)'],[0,0,ink]]){g.fillStyle=col;ch.forEach((c,i)=>{const b=SHIRT_FONT[c];if(!b)return;for(let y=0;y<5;y++)for(let x=0;x<3;x++)if(b[y*3+x]==='1')g.fillRect(x0+(i*4+x)*cs+dx,y0+y*cs+dy,cs,cs)})}}
 g.fillStyle='rgba(0,0,0,.16)';for(let i=0;i<50;i++)g.fillRect(r()*256,r()*96,2,2);
 const t=new THREE.CanvasTexture(c);t.anisotropy=4;SKATE.tex.set(k,t);return t}
/* prancha 3D: deck com bicos levantados (nose/tail arredondados), lixa estampada em cima, trucks e 4 rodinhas */
function skBoard(L){const g=new THREE.Group(),d=COL(L.deck),top=new THREE.MeshLambertMaterial({map:skTex(L)}),side=new THREE.MeshLambertMaterial({color:d.clone().multiplyScalar(.6)}),grey=new THREE.MeshLambertMaterial({color:0x9aa0a8}),wh=new THREE.MeshLambertMaterial({color:COL(L.wheel)});
 const deck=new THREE.Mesh(new THREE.BoxGeometry(.62,.022,.21),[side,side,top,side,side,side]);deck.position.y=.085;g.add(deck);
 for(const s of[-1,1]){const kick=new THREE.Mesh(new THREE.BoxGeometry(.13,.022,.21),[side,side,top,side,side,side]);kick.position.set(s*.37,.1,0);kick.rotation.z=s*.3;g.add(kick);
  const nose=new THREE.Mesh(new THREE.CylinderGeometry(.105,.105,.022,12,1,false,0,Math.PI),side);nose.position.set(s*.43,.118,0);nose.rotation.y=s>0?0:Math.PI;nose.rotation.z=s*.3;g.add(nose);
  const tr=new THREE.Mesh(new THREE.BoxGeometry(.05,.03,.17),grey);tr.position.set(s*.22,.058,0);g.add(tr);for(const z of[-1,1]){const w=new THREE.Mesh(new THREE.CylinderGeometry(.027,.027,.032,12),wh);w.rotation.x=Math.PI/2;w.position.set(s*.22,.028,z*.1);g.add(w)}}
 g.scale.set(SK_SCL[0],SK_SCL[1],SK_SCL[2]);g.position.set(0,-9999,0); /* v79r18: 3× maior e comprimento a 75% (2,25× no comprimento, 3× na largura e na altura) */
 g.traverse(o=>{if(o.isMesh)o.castShadow=true});g.userData.skate=true;return g}
function skDisposeG(g){if(!g)return;if(g.parent)g.parent.remove(g);g.traverse(o=>{if(o.isMesh)o.geometry.dispose()})}
function skAdd(x,z,a,look,quiet){const it={x,z,a,look:{...look},seed:S.seed,style:S.style,g:skBoard(look)};it.g.position.set(x,groundY(x,z)+.005,z);it.g.rotation.y=-a;scene.add(it.g);SKATE.items.push(it);if(!quiet)try{clang(.08)}catch(e){}return it}
function skRemove(it){skDisposeG(it.g);const i=SKATE.items.indexOf(it);if(i>=0)SKATE.items.splice(i,1)}
function skNear(){if(PL.car||PL.inside||PL.dead||PL.down>0||SKATE.ride||PL.heli||!storyOK('safe'))return null;let b=null,bd=1.5;for(const it of SKATE.items){if(it.seed!==S.seed||it.style!==S.style)continue;const d=Math.hypot(it.x-PL.x,it.z-PL.z);if(d<bd){bd=d;b=it}}return b}
function skMount(it){if(!it)return false;SKATE.ride={look:{...it.look},a:it.a,v:0,lean:0,crash:0,dry:{x:it.x,z:it.z},who:typeof CHAR!=='undefined'?CHAR.cur:0};
 {const f=PL.face||[1,0];if(Math.cos(it.a)*f[0]+Math.sin(it.a)*f[1]<0)SKATE.ride.a=it.a+Math.PI} /* sobe virado pro lado que o personagem olha */
 skRemove(it);SKATE.g=skBoard(SKATE.ride.look);scene.add(SKATE.g);PL.x=it.x;PL.z=it.z;PL.vx=PL.vz=0;PL.face=[-Math.sin(SKATE.ride.a),Math.cos(SKATE.ride.a)];
 if(!SKATE.taught){SKATE.taught=true;const tc=!!(typeof TOUCH!=='undefined'&&TOUCH.on); /* dev r2.4: no celular a dica fala dos botões da tela, não do teclado */
   toast('SKATE<br><small style="font-size:11px;color:#fff">'+(tc?'Analógico: frente empurra, trás freia, lados curvam · ↑ pula · SAIR desce':'W empurra · S freia · A/D curva · Espaço pula · F desce')+'</small><br><small style="font-size:11px;color:#ffd23a">'+(tc?'na velocidade máxima, SEGURE ↑ no pulo: kickflip (solte a tempo de alinhar antes do pouso)':'na velocidade máxima, SEGURE Espaço no pulo: kickflip (solte a tempo de alinhar antes do pouso)')+'</small>')}try{clang(.12)}catch(e){}return true}
function skDrop(R,x,z,a){const o={x,z};circleVsWorld(o,.3);if(inWater(o.x,o.z)){o.x=R.dry.x;o.z=R.dry.z}const it=skAdd(o.x,o.z,a,R.look,true);it.mine=true;return it} /* v79r40: mine = largado pelo jogador (volta pra garagem se ele morrer) */
function skDismount(crash){const R=SKATE.ride;if(!R)return;skDisposeG(SKATE.g);SKATE.g=null;SKATE.ride=null;
 if(crash){const sd=Math.random()<.5?1:-1,a=R.a+sd*(1.1+Math.random()*.6),k=1.0+Math.min(1.5,R.v*.12);skDrop(R,PL.x+Math.cos(a)*k,PL.z+Math.sin(a)*k,R.a+sd*.9+(Math.random()-.5))}
 else{skDrop(R,PL.x+Math.cos(R.a+Math.PI/2)*.45,PL.z+Math.sin(R.a+Math.PI/2)*.45,R.a);PL.vx=PL.vz=0}}
function skCrash(){const R=SKATE.ride;if(!R)return;const v=R.v,ca=Math.cos(R.a),sa=Math.sin(R.a);skDismount(true);PL.jy=Math.max(0,PL.jy);PL.jv=0;PL.down=1.6;PL.rot=Math.PI/2;PL.vx=ca*v*.5;PL.vz=sa*v*.5;
 if(v>5.5){PL.hp-=armorHit(Math.round((v-5.5)*3));try{rumble(.6,.6,240)}catch(e){}}try{thud(Math.max(3,v))}catch(e){}
 if(PL.hp<=0&&!PL.dead){NEWS.cause='SKATE';if(!storyMissionFail('VOCÊ MORREU')){PL.hp=0;PL.dead=true;PL.deadT=5;$('#ko').hidden=false}}}
function skBlocked(){const R=SKATE.ride,ca=Math.cos(R.a),sa=Math.sin(R.a);
 for(const c of carsNearTmp(PL.x,PL.z,7)){if(!c.t||c.display)continue;const dx=PL.x-c.x,dz=PL.z-c.z,cc=Math.cos(c.a),ss=Math.sin(c.a),lx=dx*cc+dz*ss,lz=-dx*ss+dz*cc;if(Math.abs(lx)<c.t.L/2+.32&&Math.abs(lz)<c.t.W/2+.32&&PL.jy<c.t.H-.3&&(c.x-PL.x)*ca+(c.z-PL.z)*sa>0)return true}
 for(const p of peds){if(p.state==='dead'||p.state==='down'||p.inCar||p.hidden)continue;const dx=p.x-PL.x,dz=p.z-PL.z;if(Math.abs(dx)<.6&&Math.abs(dz)<.6&&Math.hypot(dx,dz)<.55&&dx*ca+dz*sa>0&&PL.jy<.9)return true}
 return false}
/* chamado no lugar da caminhada (updatePlayer) */
function skMove(dt){const R=SKATE.ride;let thr=((keys.KeyW||keys.ArrowUp)?1:0)-((keys.KeyS||keys.ArrowDown)?1:0),st=((keys.KeyD||keys.ArrowRight)?1:0)-((keys.KeyA||keys.ArrowLeft)?1:0);
 if(PAD.on){thr=clamp(thr+(PAD.r2||0)-(PAD.l2||0)-(Math.abs(PAD.ly)>.3?PAD.ly:0),-1,1);if(Math.abs(PAD.lx)>.12)st=clamp(st+PAD.lx,-1,1)}
 const air=PL.jy>.03;
 if(!air){
  const u=outDist(PL.x,PL.z);
  const sand=u>SAND0&&u<=SHORE+.4&&coastGround(PL.x,PL.z)!==null&&
    !(city.lh&&lhLand(PL.x,PL.z))&&pierY(PL.x,PL.z)===null;
  const scale=sand?.25:1,limit=SK_VMAX*scale;
  if(sand&&!R.onSand)R.v*=scale;
  R.onSand=sand;
  if(thr>0)R.v+=8.4*scale*thr*dt*Math.max(0,1-R.v/limit);
  else if(thr<0)R.v-=12*dt*(-thr);
  R.v-=(.3*scale+R.v*.035)*dt;
  R.v=clamp(R.v,0,limit);
 }
 skFlipTick(R,air,dt);if(!SKATE.ride)return;
 R.a+=SK_TURN*st*(1.9-Math.min(1.05,R.v*.11))*dt*(R.v>.2?1:.45)*(air?.35:1);
 R.lean+=((st*Math.min(1,R.v/4.5))*.2-R.lean)*Math.min(1,dt*6);
 const ca=Math.cos(R.a),sa=Math.sin(R.a);PL.vx=ca*R.v;PL.vz=sa*R.v;plFace(-sa,ca);PL.anim=0; /* v79r24: de lado na prancha (peito virado pra direita do movimento) */
 if(camMode!=='top'){const ty=Math.atan2(-ca,-sa);let d=ty-PL.yaw;d=Math.atan2(Math.sin(d),Math.cos(d));PL.yaw+=d*Math.min(1,dt*3.2)}
 const bx=PL.x,bz=PL.z,ex=PL.vx*dt,ez=PL.vz*dt;PL.x+=ex;PL.z+=ez;circleVsWorld(PL,.4);shipPlayerVsContainers(PL,.38);
 if(!air&&!PL.inside){
  const j=dbRampExit(bx,bz,PL.x,PL.z,PL.vx,PL.vz);
  if(j){R.dbFlight=true;PL.gy=SK_UP;PL.jy=j.height;PL.jv=j.impulse}
 }
 bumpBeachSkater(bx,bz);
 const want=Math.hypot(ex,ez),got=Math.hypot(PL.x-bx,PL.z-bz);
 if(R.v>2.2&&want>1e-4&&got<want*.5){R.crash+=dt;if(R.crash>.03){skCrash();return}}else{R.crash=0;if(got<want*.9)R.v*=Math.max(.6,1-dt*2)} /* raspou de lado na parede: perde velocidade, não cai */
 if(R.v>2.2&&skBlocked()){skCrash();return}
 if(!inWater(PL.x,PL.z))R.dry={x:PL.x,z:PL.z};else if(!R.dbFlight&&!maskOn()){skCrash();return}}
var SK_TURN=1;
function skJump(){if(PL.jy>.03||PL.jv>0||PL.down>0)return;const R=SKATE.ride,top=!!R&&R.v>=SK_TOP*.88;PL.jv=top?6.2:5.4;PL.jy=.001;if(R){R.flip=0;R.fv=0;R.trick=top;R.air=false}try{clang(.05)}catch(e){}}
/* v79r39: KICKFLIP — na velocidade máxima, SEGURAR o pulo gira a prancha no eixo do comprimento; soltou, ela termina a volta sozinha.
   Pousou com a prancha fora do ângulo (ainda girando ou torta) = tombo. Bater em algo no ar já derruba pelas regras normais. */
function skHold(){return !!(keys.Space||(PAD.on&&PAD.prev&&PAD.prev[PAD.scheme==='modern'?0:2]))}
function skFlipTick(R,air,dt){const TAU=Math.PI*2;
 if(air){R.air=true;if(R.trick&&skHold())R.fv=13;else if(R.fv>0){const nxt=Math.ceil(R.flip/TAU-1e-4)*TAU;if(R.flip+R.fv*dt>=nxt){R.flip=nxt;R.fv=0}}if(R.fv>0)R.flip+=R.fv*dt;return}
 if(!R.air)return;R.air=false;const f=R.flip||0,rem=((f%TAU)+TAU)%TAU,bad=R.fv>0||(rem>.3&&rem<TAU-.3);R.fv=0;R.flip=0;R.trick=false;
 if(bad){toast(translatePlain('PRANCHA TORTA NO POUSO · CAIU'));skCrash();return}
 const n=Math.round(f/TAU);if(n>=1){toast(n===1?'KICKFLIP!':n===2?'DOUBLE KICKFLIP!':'KICKFLIP ×'+n+'!');try{clang(.18)}catch(e){}}}
function skTick(dt){const vis=!PL.inside;for(const it of SKATE.items){const on=vis&&it.seed===S.seed&&it.style===S.style;if(it.g.visible!==on)it.g.visible=on;if(on&&!it.g.parent)scene.add(it.g)}
 const wk=S.seed+'|'+S.style;if(!SKATE.seeded[wk]&&played&&S.style!=='inverted'&&!city.haze&&city.safe&&city.safe.slots&&city.safe.slots[0]){SKATE.seeded[wk]=true;if(!SKATE.items.some(it=>it.seed===S.seed&&it.style===S.style))skGaragePlace(skLookDefault())} /* skate de boas-vindas na garagem de casa */
 const R=SKATE.ride;if(R&&typeof CHAR!=='undefined'&&R.who!==CHAR.cur){skDisposeG(SKATE.g);SKATE.g=null;SKATE.ride=null;skAdd(R.dry.x,R.dry.z,R.a,R.look,true)} /* trocou de personagem: o skate fica onde o outro estava */
 else if(R&&PL.down>0&&!PL.dead){skDismount(true)} /* atropelado/derrubado: o skate sai do pé */
 else if(R){if(PL.car||PL.dead||PL.inside||PARA.active||PL.heli||TVM.on||PL.taxi){skDisposeG(SKATE.g);SKATE.g=null;SKATE.ride=null;
   const f=PL.inside&&DOOR.from&&DOOR.from.seed===S.seed?DOOR.from:PL.inside==='mall'&&MALL.out?MALL.out:PL.inside==='shop'&&SHOP.st&&SHOP.st.out?SHOP.st.out:null;
   if(PL.dead&&city.safe)skGaragePlace(R.look);else if(f)skDrop(R,f.x+(f.nx||0)*1.2,f.z+(f.nz||0)*1.2,R.a);else if(PL.inside&&city.safe)skGaragePlace(R.look);else skDrop(R,PL.x+.8,PL.z,R.a)} /* v79r40: morreu = o skate vai direto pra garagem */
  else if(SKATE.g){if(!SKATE.g.parent)scene.add(SKATE.g);const G=SKATE.g,fl=R.flip||0;G.position.set(PL.x,PL.gy-SK_UP+Math.max(0,PL.jy),PL.z);G.rotation.set(0,-R.a,0);G.rotateX(R.lean);if(PL.jy>.03)G.rotateZ(clamp(PL.jv*.06,-.2,.35));
   if(fl){G.rotateX(fl);const h=.09*SK_SCL[1],v=new THREE.Vector3(0,h,0).applyQuaternion(G.quaternion);G.position.x-=v.x;G.position.z-=v.z;G.position.y+=h-v.y-.12*Math.abs(Math.sin(fl/2))}}} /* v79r39: gira em torno do meio da prancha e desce um pouco pra passar sob os pés */
 SKATE.near=skNear();
 /* oficina: andar de skate até a vaga da oficina abre a customização */
 const ts=city.tuneSpot;if(ts){const d=Math.hypot(PL.x-ts.x,PL.z-ts.z);if(d>4.5)SKATE.tuneLock=false;if(SKATE.ride&&!SKATE.ui&&!SKATE.tuneLock&&d<3.2){SKATE.tuneLock=true;if(storyOK('tune'))skUiOpen('tune');else storyLocked('OFICINA FECHADA')}}}
function skInGarage(it){const s=city.safe;if(!s||!s.slots)return false;return s.slots.some(sl=>sl&&Math.hypot(it.x-sl.x,it.z-sl.z)<4.6)}
function skSave(){const home=SKATE.items.filter(it=>it.seed===S.seed&&it.style===S.style&&skInGarage(it)).map(it=>({x:+it.x.toFixed(2),z:+it.z.toFixed(2),a:+it.a.toFixed(2),look:{...it.look}}));
 const R=SKATE.ride;if(R&&skInGarage({x:PL.x,z:PL.z}))home.push({x:+PL.x.toFixed(2),z:+PL.z.toFixed(2),a:+R.a.toFixed(2),look:{...R.look}});return{home}}
function skLoad(d){for(const it of SKATE.items.slice())skRemove(it);if(SKATE.g){skDisposeG(SKATE.g);SKATE.g=null}SKATE.ride=null;if(!d)return;SKATE.seeded[S.seed+'|'+S.style]=true;
 if(Array.isArray(d.home))for(const h of d.home.slice(0,12))if(h&&skLookOk(h.look)&&isFinite(h.x)&&isFinite(h.z))skAdd(h.x,h.z,+h.a||0,h.look,true)}
/* vaga da garagem: encostado na parede do fundo, atrás dos carros */
function skGaragePlace(look){const s=city.safe,sl=s&&s.slots;if(!sl||!sl[0])return skAdd(PL.x+1,PL.z,0,look,true);
 if(sl[0]&&sl[1]){const q=sl[0],mx=(sl[0].x+sl[1].x)/2,mz=(sl[0].z+sl[1].z)/2,ca=Math.cos(q.a),sa=Math.sin(q.a); /* v79r23: skates no corredor entre as duas vagas, em fila a partir da parede do fundo (antes um atrás de cada carro, parecia ocupar as vagas) */
  for(let k=0;k<6;k++){const x=mx+ca*(2.9-k*1.15),z=mz+sa*(2.9-k*1.15);if(SKATE.items.some(it=>Math.hypot(it.x-x,it.z-z)<.6))continue;return skAdd(x,z,q.a,look,true)}}
 for(const lat of[0,-1.15,1.15,-.6,.6])for(const q of sl){if(!q)continue;const ca=Math.cos(q.a),sa=Math.sin(q.a),x=q.x+ca*2.85-sa*lat,z=q.z+sa*2.85+ca*lat;if(SKATE.items.some(it=>Math.hypot(it.x-x,it.z-z)<.5))continue;return skAdd(x,z,q.a+Math.PI/2,look,true)}
 const q=sl[0];return skAdd(q.x,q.z,q.a+Math.PI/2,look,true)}
/* ---------- loja (shopping) e oficina ---------- */
function skOwned(){return SKATE.items.filter(it=>it.seed===S.seed&&it.style===S.style&&skInGarage(it))}
function skUiOpen(mode){if(SKATE.ui)return;const cur=mode==='tune'&&SKATE.ride?{text:'',...SKATE.ride.look}:{...skLookDefault(),text:''};cur.emo=Array.isArray(cur.emo)?[...cur.emo]:[];SKATE.ui={mode,look:cur,orig:{...cur,emo:[...cur.emo]},trade:false};$('#skText').value=cur.text||'';$('#skTrade').checked=false;for(const k in keys)keys[k]=false;if(document.pointerLockElement)document.exitPointerLock();if(SKATE.ride)SKATE.ride.v=0;PL.vx=PL.vz=0;$('#skShop').hidden=false;skUiRender();try{if(padActive()){document.body.classList.add('padnav');$('#skBuy').focus()}}catch(e){}}
function skUiClose(){SKATE.ui=null;$('#skShop').hidden=true;for(const k in keys)keys[k]=false}
function skPrev(L){const c=$('#skPrev'),g=c.getContext('2d'),W=c.width,H=c.height;g.clearRect(0,0,W,H);const t=skTex(L).image;g.save();g.translate(W/2,H/2);const w=W*.86,h=H*.46;
 const path=()=>{g.beginPath();g.moveTo(-w/2+h/2,-h/2);g.lineTo(w/2-h/2,-h/2);g.arc(w/2-h/2,0,h/2,-Math.PI/2,Math.PI/2);g.lineTo(-w/2+h/2,h/2);g.arc(-w/2+h/2,0,h/2,Math.PI/2,Math.PI*1.5);g.closePath()};
 g.fillStyle=L.wheel;g.strokeStyle='#000';g.lineWidth=3;for(const sx of[-1,1])for(const sy of[-1,1]){g.beginPath();g.ellipse(sx*w*.3,sy*(h/2+4),11,7,0,0,7);g.fill();g.stroke()}
 path();g.save();g.clip();g.drawImage(t,-w/2,-h/2,w,h);g.restore();path();g.lineWidth=4;g.stroke();g.restore()}
const SK_EN={LISA:'PLAIN',CHAMAS:'FLAMES',LISTRAS:'STRIPES',ESTRELAS:'STARS',XADREZ:'CHECKER',RAIO:'BOLT',PALMEIRA:'PALM',OLHO:'EYE',SHAPE:'DECK',RODAS:'WHEELS',ESTAMPA:'PRINT',SAIR:'EXIT',COMPRAR:'BUY',APLICAR:'APPLY',TEXTO:'TEXT'};
function skT(v){return S.lang==='en'&&SK_EN[v]?SK_EN[v]:v}
const SK_GMAX=1;
function skFull(){return skOwned().length>=SK_GMAX} /* v79r38: garagem guarda 1 skate (fora das vagas de carro, nos dois modos) */
function skUiPrice(U){return U.mode==='tune'?SK_TUNE:SK_PRICE-((U.trade||skFull())&&skOwned().length?SK_TRADE:0)}
function skUiRender(){const U=SKATE.ui;if(!U)return;{const lb=document.querySelectorAll('#skShop .sk-lb');['SHAPE','RODAS','ESTAMPA'].forEach((t,i)=>{if(lb[i])lb[i].textContent=skT(t)});$('#skCancel').textContent=skT('SAIR')}const L=U.look,row=(id,arr,key,txt)=>{const el=$(id);el.innerHTML='';for(const v of arr){const b=document.createElement('button');b.type='button';b.className='sw'+(L[key]===v?' on':'')+(txt?' tx':'');if(txt)b.textContent=skT(v);else b.style.background=v;b.addEventListener('click',()=>{L[key]=v;skUiRender()});el.appendChild(b)}};
 row('#skDeck',SK_DECK,'deck');row('#skWheel',SK_WHEEL,'wheel');row('#skPrint',SK_PRINT,'print',true);skPrev(L);
 $('#skTxtRow').hidden=L.print!=='TEXTO';$('#skEmoRow').hidden=L.print!=='EMOJI';if(L.print==='EMOJI'){const el=$('#skEmoList');el.innerHTML='';(L.emo||[]).forEach((e,i)=>{const b=document.createElement('button');b.type='button';b.textContent=e;b.title=translatePlain('tirar este emoji');b.addEventListener('click',()=>{L.emo=L.emo.filter((x,j)=>j!==i);skUiRender()});el.appendChild(b)});$('#skEmoAdd').disabled=(L.emo||[]).length>=SK_EMO;$('#skEmoHint').textContent=translatePlain('até 3 emojis · toque para tirar')}{const own=skOwned().length,full=skFull();$('#skTradeRow').hidden=U.mode==='tune'||!own;$('#skTrade').checked=full||U.trade;$('#skTrade').disabled=full;$('#skTradeTx').textContent=full?translatePlain('a garagem guarda 1 skate · o seu vai na troca')+' · −$'+SK_TRADE:translatePlain('dar 1 skate da garagem na troca')+' · −$'+SK_TRADE+' ('+own+')'}
 const tune=U.mode==='tune',ch=JSON.stringify(L)!==JSON.stringify(U.orig),price=skUiPrice(U);$('#skTitle').textContent=translatePlain(tune?'OFICINA · SKATE':'SKATE SHOP');
 const b=$('#skBuy');b.textContent=tune?(ch?skT('APLICAR')+' · $'+price:translatePlain('SEM MUDANÇAS')):skT('COMPRAR')+' · $'+price;b.disabled=tune&&!ch;
 $('#skNote').textContent=translatePlain(tune?'troque as cores e a estampa do seu skate':'o skate novo vai pra garagem da sua casa')+' · $'+Math.round(PL.money||0)}
$('#skX').addEventListener('click',skUiClose);$('#skCancel').addEventListener('click',skUiClose);$('#skBuy').addEventListener('click',skUiBuy);
$('#skText').addEventListener('input',e=>{const U=SKATE.ui;if(!U)return;const v=skTxtClean(e.target.value);if(e.target.value!==v)e.target.value=v;U.look.text=v;skPrev(U.look);skUiRender()});
$('#skText').addEventListener('keydown',e=>{if(e.code!=='Escape'&&e.code!=='Enter')e.stopPropagation()});
$('#skEmoAdd').addEventListener('click',()=>{const U=SKATE.ui;if(!U||(U.look.emo||[]).length>=SK_EMO)return;emoKbOpen(e=>{const V=SKATE.ui;if(!V)return;V.look.emo=[...(V.look.emo||[]),e].slice(0,SK_EMO);skUiRender()})});
$('#skTrade').addEventListener('change',e=>{if(SKATE.ui){SKATE.ui.trade=e.target.checked;skUiRender()}});
/* v3 r28 · SKATE SHOP no controle: direcional/analógico navega (shape, rodas, estampa, emojis, texto, troca),
   ✕ escolhe (no campo de texto abre o teclado na tela), △ compra, ○ sai. A tela redesenha os botões ao escolher:
   o foco volta para o mesmo lugar (mesma fileira, mesma posição). */
function skUiPad(pr,dt){const el=$('#skShop');if(pr(1)){skUiClose();return}if(pr(3)){skUiBuy();return}
 document.body.classList.add('padnav');const ae=document.activeElement,inD=ae&&el.contains(ae)&&ae.offsetParent!==null;
 PAD.navT=(PAD.navT||0)-dt;let sv=0,sh=0;if(PAD.navT<=0){if(PAD.ly>.6)sv=1;else if(PAD.ly<-.6)sv=-1;if(PAD.lx>.6)sh=1;else if(PAD.lx<-.6)sh=-1;if(sv||sh)PAD.navT=.2}else if(Math.abs(PAD.ly)<.3&&Math.abs(PAD.lx)<.3)PAD.navT=0;
 const d=pr(13)||sv>0,u=pr(12)||sv<0,r=pr(15)||sh>0,l=pr(14)||sh<0;
 if(!inD){if(d||u||r||l||pr(0))try{$('#skBuy').focus()}catch(e){}return}
 if(d)padNavFocus(el,1,[0,1]);else if(u)padNavFocus(el,-1,[0,-1]);else if(r)padNavFocus(el,1,[1,0]);else if(l)padNavFocus(el,-1,[-1,0]);
 else if(pr(0)){if(padIsText(ae)){padTextKey(ae);return}const par=ae.parentElement,pid=par&&par.id,ix=par?[...par.children].indexOf(ae):-1,id=ae.id;ae.click();
  if(pid==='skPrint'&&SKATE.ui){const nx=SKATE.ui.look.print==='TEXTO'?$('#skText'):SKATE.ui.look.print==='EMOJI'?$('#skEmoAdd'):null;if(nx&&!nx.disabled&&nx.offsetParent!==null){nx.focus();return}} /* escolher TEXTO/EMOJI já leva ao campo/botão */
  if(!EMOKB.open&&!ae.isConnected){const p2=pid&&document.getElementById(pid),n=id?document.getElementById(id):p2&&p2.children[Math.min(ix,p2.children.length-1)];if(n&&n.focus&&!n.disabled)n.focus();else try{$('#skBuy').focus()}catch(e){}}}}
function skUiBuy(){const U=SKATE.ui;if(!U)return;const tune=U.mode==='tune',price=skUiPrice(U);U.look.text=U.look.print==='TEXTO'?skTxtClean(U.look.text):'';U.look.emo=U.look.print==='EMOJI'?(U.look.emo||[]).filter(emoOk).slice(0,SK_EMO):[];if(U.look.print==='EMOJI'&&!U.look.emo.length){toast(translatePlain('ESCOLHA UM EMOJI'));return}if(tune&&JSON.stringify(U.look)===JSON.stringify(U.orig))return;if((PL.money||0)<price){toast('DINHEIRO INSUFICIENTE · $'+price);try{clang(.1)}catch(e){}return}money(-price);
 if(tune&&SKATE.ride){SKATE.ride.look={...U.look};skDisposeG(SKATE.g);SKATE.g=skBoard(SKATE.ride.look);scene.add(SKATE.g);toast('SKATE CUSTOMIZADO · −$'+price)}
 else{const old=U.trade||skFull()?skOwned().pop():null;if(old)skRemove(old);skGaragePlace(U.look);toast((old?'SKATE TROCADO':'SKATE COMPRADO')+' · −$'+price+'<br><small style="font-size:11px;color:#fff">está na garagem da sua casa</small>');const q=peds.find(p=>p.mallClerk==='skate');if(q)try{say(q,SAY.thanks)}catch(e){}}
 try{clang(.3)}catch(e){}skUiClose()}
/* ================= v79r24 · MINIGAMES (atalho no menu de pausa) =================
   Joga os jogos do cassino sem dirigir até lá (pensado pro celular): entra no Sunset Royale direto na mesa/máquina e,
   ao fechar o jogo, volta pro lugar onde estava. Usa o dinheiro da conta; mesmas travas da porta (história, procurado, eventos). Não é cheat. */
var MG={active:false,opened:false,back:null,t:0};
const MG_LIST=[['bj','BLACKJACK',10],['poker','VÍDEO PÔQUER',10],['roul','ROLETA',10],['slot','CAÇA-NÍQUEL',10],['pool','SINUCA (CASTIGADO)',50],['dice',"LIAR'S DICE",50]];
function mgRender(){const el=$('#mgList');el.innerHTML='';const cash=Math.round(PL.money||0);$('#mgCash').textContent='$'+cash;
 {const b=$('#mgLoan');if(!LOAN.state)b.innerHTML=translatePlain('PEGAR EMPRÉSTIMO')+'<small>$10.000 · '+translatePlain('prazo de 10 horas')+'</small>';else b.innerHTML=(cash>=LOAN_V?translatePlain('PAGAR O AGIOTA'):translatePlain('DÍVIDA COM O AGIOTA'))+'<small>$10.000 · '+(LOAN.state==='on'?translatePlain('vence em')+' '+loanFmt(LOAN.t):translatePlain('VENCIDA · cobradores na rua'))+'</small>'}
 for(const [k,name,min] of MG_LIST){const b=document.createElement('button');b.type='button';b.className='btn mg-it';b.disabled=cash<min;b.innerHTML='<span>'+translatePlain(name)+'</span><small>'+translatePlain('aposta mínima')+' $'+min+'</small>';b.addEventListener('click',()=>mgGo(k));el.appendChild(b)}}
function mgOpenPanel(){if(!played||storyOn())return;if(POL.wanted){mgModeSync();const mb=$('#mgBtn'),mn=$('#mgLockNote');if(mb){mb.classList.remove('deny');void mb.offsetWidth;mb.classList.add('deny')}if(mn){mn.hidden=false;mn.classList.remove('pulse');void mn.offsetWidth;mn.classList.add('pulse')}if(!menuOpen)toast('MINIGAMES BLOQUEADOS · EM PERSEGUIÇÃO POLICIAL');return}mgRender();$('#mgPanel').hidden=false}
function mgClosePanel(){$('#mgPanel').hidden=true}
function mgSpot(k){if(k==='slot'){const m=CAS.machines&&CAS.machines[0];return m?{x:m.x,z:m.z,i:0}:null}const t=(CAS.tables||[]).find(q=>q.kind===k);return t?{x:t.x,z:t.z}:null}
function mgGo(k){if(storyOn())return;const min=(MG_LIST.find(q=>q[0]===k)||[])[2]||10;
 if(PL.dead){toast('AGORA NÃO DÁ');return}if((PL.money||0)<min){toast(translatePlain('DINHEIRO INSUFICIENTE')+' · $'+min);return}
 if(!storyOK('casino')){storyLocked('CASSINO FECHADO');return}if(POL.wanted){toast('NÃO DÁ PRA ENTRAR PROCURADO');return}
 {const ev=eventLock();if(ev){toast('MINIGAMES BLOQUEADOS · '+ev);return}}
 if(PL.inside&&PL.inside!=='casino'){toast('SAIA DO INTERIOR PRIMEIRO');return}
 mgClosePanel();closeMenu();
 if(PL.inside!=='casino'){if(SKATE.ride)skDismount(false);if(PL.car)enterExit();if(PL.car)return;
  const back={x:PL.x,z:PL.z,nx:(PL.face||[0,1])[0],nz:(PL.face||[0,1])[1]};casinoEnter('casino');if(PL.inside!=='casino')return;
  if(DOOR.from)Object.assign(DOOR.from,back);MG.back=back}
 const sp=mgSpot(k);if(sp){const o={x:sp.x+(k==='slot'?0:0),z:sp.z+(k==='slot'?1.0:1.9)};circleVsWorld(o,.4);PL.x=o.x;PL.z=o.z;PL.vx=PL.vz=0;camT.x=PL.x;camT.z=PL.z}
 MG.active=!!MG.back;MG.opened=false;MG.t=0;
 setTimeout(()=>{try{if(k==='slot')slotOpen();else tableGameOpen(k)}catch(e){console.error(e)}},60)}
/* fechou o jogo aberto pelo menu → sai do cassino e volta pro lugar de antes */
function mgTick(dt){if(!MG.active)return;if(PL.inside!=='casino'){MG.active=false;MG.back=null;return}const on=POOL.on||DICE.on||SLOT.open||TABLE_GAME.open;if(on){MG.opened=true;MG.t=0;return}
 MG.t+=dt;if((MG.opened&&MG.t>.25)||(!MG.opened&&MG.t>1.5)){MG.active=false;MG.back=null;casinoExit('casino')}}
setInterval(()=>{try{if(!menuOpen)mgTick(.1)}catch(e){}},100);
$('#mgBtn').addEventListener('click',e=>{e.stopPropagation();mgOpenPanel()});
$('#mgClose').addEventListener('click',mgClosePanel);
/* ================= v79r27 · EMPRÉSTIMO DO AGIOTA (menu MINIGAMES) =================
   $10.000 na hora; prazo de 10 h de jogo (30 min reais desde a v3 r23). No vencimento: com $10.000 ou mais, paga sozinho (só os 10 mil).
   Sem o valor: a cada 5 h (15 min) o agiota manda 3 carros que perseguem e chegam atirando (descem atirando quando você está a pé).
   Não para nem se você morrer: só quando o saldo cobre a dívida (aí quita na hora). Fica no save (d.loan). */
var LOAN={state:null,t:0,next:0,cars:[],crew:{gang:[]},waveT:0};
const LOAN_V=10000,LOAN_DUE=600*GMIN,LOAN_EVERY=300*GMIN; /* v3 r23: horas de jogo */
const LOAN_TYPES=['sedan','van','pickup','sports','sedan','van'],LOAN_COL=['#1b1b1f','#2a2a30','#3a0e14','#141820'];
function loanFmt(sec){sec=Math.max(0,Math.ceil(sec/GMIN));const h=Math.floor(sec/60),m=sec%60;return h+'h'+String(m).padStart(2,'0')}
function loanPopup(title,text,btns){const el=$('#loanDlg');$('#loanT').textContent=translatePlain(title);$('#loanX').textContent=translatePlain(text);const B=$('#loanBtns');B.innerHTML='';
 for(const [lb,cls,fn] of btns){const b=document.createElement('button');b.type='button';b.className='btn '+(cls||'');b.textContent=S.lang==='en'?({CANCELAR:'CANCEL',ASSINAR:'SIGN',PAGAR:'PAY'}[lb]||lb):lb;b.addEventListener('click',()=>{el.hidden=true;if(fn)fn()});B.appendChild(b)}el.hidden=false}
function loanAsk(){if(storyOn())return;if(LOAN.state==='neg'){toast(translatePlain('DÍVIDA DE APOSTA')+' · '+betFmt(LOAN.debt||0));return}if(LOAN.state){if(LOAN.state&&(PL.money||0)>=LOAN_V)loanPopup('PAGAR O AGIOTA?','Quitar agora os $10.000 da dívida.',[['CANCELAR','',null],['PAGAR','loan-red',()=>loanPay(true)]]);return}
 if(typeof PROLOGUE!=='undefined'&&PROLOGUE.active){toast('AGORA NÃO');return}
 loanPopup('EMPRÉSTIMO · $10.000','Você tem 10 horas para pagar o que deve ao agiota, ou ele mandará seus associados lhe fazerem uma visita para cobrar a dívida de uma maneira.... dolorosa.',[['CANCELAR','',null],['ASSINAR','loan-red',loanSign]])}
function loanSign(){if(LOAN.state)return;LOAN.state='on';LOAN.t=LOAN_DUE;LOAN.next=0;money(LOAN_V,'EMPRÉSTIMO · +$10.000');try{clang(.3)}catch(e){}try{mgRender()}catch(e){}}
function loanPay(early){money(-LOAN_V,'AGIOTA · −$10.000');const late=LOAN.state==='late';LOAN.state=null;LOAN.t=0;LOAN.next=0;loanCallOff();try{mgRender()}catch(e){}
 loanPopup(late?'DÍVIDA QUITADA':'EMPRÉSTIMO PAGO',late?'O agiota recebeu os $10.000. Os associados dele foram embora.':'O agiota recebeu os $10.000. Negócio fechado.',[['OK','',null]])}
function loanCallOff(){for(const c of LOAN.cars)if(c&&vehicles.includes(c)){c.chase=false;c.loan=false;c.hand=true;c.thr=0}LOAN.cars=[];for(const q of LOAN.crew.gang)if(q&&peds.includes(q))removePed(q);LOAN.crew.gang=[]}
function loanClear(){LOAN.state=null;LOAN.t=0;LOAN.next=0;LOAN.debt=0;loanCallOff()}
function loanSave(){return LOAN.state?{state:LOAN.state,t:Math.round(LOAN.t),next:Math.round(LOAN.next),debt:LOAN.debt||0}:null}
function loanNegDebt(v){if(!(v>0))return;if(LOAN.state==='on'||LOAN.state==='late'){LOAN.debt=(LOAN.debt||0)+v;return}LOAN.state='neg';LOAN.debt=(LOAN.debt||0)+v;LOAN.next=0;loanPopup('SALDO NEGATIVO','Faltou dinheiro na aposta. Os associados do agiota vão atrás de você até você cobrir a diferença.',[['OK','loan-red',null]])}
function loanLoad(d){loanCallOff();if(d&&(d.state==='on'||d.state==='late'||d.state==='neg')){LOAN.state=d.state;LOAN.t=+d.t||0;LOAN.next=+d.next||0;LOAN.debt=+d.debt||0}else{LOAN.state=null;LOAN.t=0;LOAN.next=0;LOAN.debt=0}}
/* 1×/s: relógio da dívida (anda até dentro de interiores) */
function loanSecond(){document.body.classList.toggle('story-on',!!played&&storyOn()); /* v79r27: MINIGAMES e empréstimo só no Modo Livre */
 if(!LOAN.state||!played||menuOpen||storyOn())return;
 if(LOAN.state==='on'){LOAN.t-=1;if(LOAN.t===5*GHOUR)toast('AGIOTA · faltam 5 horas pra pagar');if(LOAN.t===GHOUR)toast('AGIOTA · falta 1 hora pra pagar');
  if(LOAN.t<=0){if((PL.money||0)>=LOAN_V)loanPay(false);else{LOAN.state='late';LOAN.next=0;loanPopup('O AGIOTA NÃO ESPEROU','Você não tem os $10.000. Os associados dele estão chegando — e vão continuar vindo até a dívida ser paga.',[['OK','loan-red',null]])}}return}
 if(LOAN.state==='neg'){if((PL.money||0)>=(LOAN.debt||0)){money(-(LOAN.debt||0),'AGIOTA · −'+betFmt(LOAN.debt||0));LOAN.state=null;LOAN.debt=0;LOAN.next=0;loanCallOff();loanPopup('DÍVIDA QUITADA','Os associados do agiota foram embora.',[['OK','',null]]);return}}
 else if((PL.money||0)>=LOAN_V){loanPay(false);return}
 LOAN.next-=1;if(LOAN.next<=0&&!PL.inside&&!PL.dead&&!PARA.active){if(loanWave())LOAN.next=LOAN_EVERY;else LOAN.next=5}}
function loanWave(){loanCallOff();const p=PL.car||PL,N=city.N;let made=0;
 for(let k=0;k<80&&made<3;k++){const kx=clamp(Math.round(p.x/P)+Math.floor(Math.random()*5)-2,0,N),kz=clamp(Math.round(p.z/P)+Math.floor(Math.random()*5)-2,0,N),d=Math.floor(Math.random()*4);if(!segExists(kx,kz,d))continue;
  const s=20+Math.random()*(P-40),q=lanePt(kx,kz,d,0,s),dist=Math.hypot(q[0]-p.x,q[1]-p.z);if(dist<55||dist>170||inWater(q[0],q[1]))continue;if(LOAN.cars.some(c=>Math.hypot(c.x-q[0],c.z-q[1])<10))continue;
  const c=makeVehicle(LOAN_TYPES[Math.floor(Math.random()*LOAN_TYPES.length)],q[0],q[1],Math.atan2(D[d][1],D[d][0]),LOAN_COL[Math.floor(Math.random()*LOAN_COL.length)]);if(!c)continue;
  c.loan=true;c.keep=true;c.boom=false;c.legal=true;c.nextDeploy=1e12;c.loanShootT=1+Math.random()*1.5;c.loanOut=false;c.hp=Math.max(c.hp||100,140);startChase(c);LOAN.cars.push(c);made++}
 if(made){LOAN.waveT=0;toast('<span style="color:#ff4a4a">COBRADORES DO AGIOTA</span><br><small style="font-size:11px;color:#fff">'+made+' '+translatePlain('carros atrás de você · junte $10.000 pra quitar')+'</small>');try{rumble(.4,.7,260)}catch(e){}}
 return made>0}
/* por quadro: tiro de dentro do carro e descida dos capangas */
function loanTick(dt){if(!LOAN.cars.length&&!LOAN.crew.gang.length)return;LOAN.waveT+=dt;
 if(PL.dead||PL.inside){if(PL.dead)loanCallOff();return}
 const tgt=PL.car||PL;
 for(const c of LOAN.cars){if(!c.alive||!vehicles.includes(c)||c.loanOut)continue;const dx=tgt.x-c.x,dz=tgt.z-c.z,d=Math.hypot(dx,dz);
  if(!PL.car&&d<13&&Math.abs(c.fwd)<6){c.loanOut=true;c.chase=false;c.thr=0;c.hand=true;const ca=Math.cos(c.a),sa=Math.sin(c.a);
   for(let i=0;i<2;i++){const sd=i?1:-1,x=c.x-sa*sd*1.6,z=c.z+ca*sd*1.6,o={x,z};circleVsWorld(o,.35);const q=spawnPed(null,{x:o.x,z:o.z,vx:0,vz:0,pal:{...GANG_PAL}});if(!q)continue;q.state='clerk';q.fixed=true;q.at={x:o.x,z:o.z};q.gang=true;q.loan=true;q.hp=3;q.wpn=Math.random()<.5?'smg':'pistol';q.shootT=.6+Math.random()*.8;q.hitT=0;q.mx=dx;q.mz=dz;LOAN.crew.gang.push(q)}continue}
  if(d<30){c.loanShootT-=dt;if(c.loanShootT<=0){c.loanShootT=.55+Math.random()*.6;const hit=Math.random()<.24,o=new THREE.Vector3(c.x,1.4,c.z),e2=new THREE.Vector3(tgt.x+(hit?0:(Math.random()-.5)*3),1.2,tgt.z+(hit?0:(Math.random()-.5)*3));try{tracer(o,e2,0xffb070);gunSound(.6,.95)}catch(e){}
   if(hit){if(PL.car&&PL.car.alive){PL.car.hp-=6;if(PL.car.hp<=0)setOnFire(PL.car)}else if(!CHEAT.hp){PL.hp-=armorHit(6);try{rumble(.3,.6,120)}catch(e){}if(PL.hp<=0){killPlayer('COBRADO PELO AGIOTA');return}}}}}}
 LOAN.crew.gang=LOAN.crew.gang.filter(q=>peds.includes(q));if(LOAN.crew.gang.length)empGangTick(LOAN.crew,dt);
 if(LOAN.waveT>240)loanCallOff()}
setInterval(()=>{try{loanSecond()}catch(e){console.error(e)}},1000);
$('#mgLoan').addEventListener('click',e=>{e.stopPropagation();loanAsk()});
/* ================= v79r13 · LIAR'S DICE (DADO MENTIROSO) NA ALA LESTE DO CASSINO =================
   Você contra Dona Cida e Tonhão. Cada um com 5 dados num copo. Todos chacoalham e viram o copo (física de verdade: dados rolam e quicam dentro do copo).
   Na sua vez: aumente a aposta (quantidade × face, faces de 1 a 6, sem coringa · regra do RDR1) ou diga DUVIDO.
   Duvidou: abre tudo e conta só a face apostada. Se tiver PELO MENOS o apostado (5 de 4 com 6 dados 4 na mesa vale), quem duvidou perde 1 dado; senão, quem apostou perde.
   v79r34: antes da 1ª aposta da rodada dá pra remexer o próprio copo uma vez; dados perdidos ficam na mesa, na frente do copo, apagados.
   Quem fica sem dados sai. Último com dados vence. Aposta $50, vitória paga $150. */
var DICE={reshook:false,reshake:false,on:false,built:false,view:'3d',players:[],turn:0,bid:null,phase:'idle',msg:'',t:0,aiT:0,q:1,f:2,bet:50,cam:null,look:null,rolling:false,reveal:0,loser:null,end:null,hudT:0,keys:{},save:null,npcs:[]};
const DICE_S=.045,DICE_H=DICE_S/2,DICE_NAMES=['VOCÊ','DONA CIDA','TONHÃO'],DICE_FACE=[2,5,1,6,3,4]; /* faces do BoxGeometry: +x −x +y −y +z −z */
function diceTab(){return CAS.dice}
function dn(p){return translatePlain(DICE_NAMES[p])}
function dicePipTex(n){const c=cv(64,64),g=c.getContext('2d');g.fillStyle='#f6f2e6';g.fillRect(0,0,64,64);g.strokeStyle='#d8d0bc';g.lineWidth=4;g.strokeRect(2,2,60,60);g.fillStyle=n===1?'#c81e2a':'#1a1a20';
 const P={1:[[32,32]],2:[[18,18],[46,46]],3:[[16,16],[32,32],[48,48]],4:[[18,18],[46,18],[18,46],[46,46]],5:[[16,16],[48,16],[32,32],[16,48],[48,48]],6:[[18,14],[46,14],[18,32],[46,32],[18,50],[46,50]]}[n];for(const[x,y] of P){g.beginPath();g.arc(x,y,n===1?9:6,0,7);g.fill()}const t=new THREE.CanvasTexture(c);t.anisotropy=4;return t}
function diceBuild(){if(DICE.built)return;const T=diceTab(),grp=new THREE.Group();(CAS.casinoScene||CAS.grp).add(grp);DICE.grp=grp;
 const mats=DICE_FACE.map(v=>new THREE.MeshBasicMaterial({map:dicePipTex(v)})),geo=new THREE.BoxGeometry(DICE_S,DICE_S,DICE_S);DICE.dm=[];
 for(let p=0;p<3;p++)for(let k=0;k<5;k++){const m=new THREE.Mesh(geo,mats);grp.add(m);DICE.dm.push(m)}
 const lmats=DICE_FACE.map(v=>new THREE.MeshBasicMaterial({map:dicePipTex(v),color:0x8a8478}));DICE.lost=[];for(let i=0;i<15;i++){const m=new THREE.Mesh(geo,lmats);m.visible=false;grp.add(m);DICE.lost.push(m)} /* v79r34: dados perdidos, apagados, na frente do copo */
 const cupG=new THREE.CylinderGeometry(.1,.118,.15,24,1,true),capG=new THREE.CircleGeometry(.1,24);DICE.cups=[];
 for(let p=0;p<3;p++){const c=new THREE.Group(),col=[0x5a2a18,0x2a3a5a,0x3a5a2a][p],mat=new THREE.MeshBasicMaterial({color:col,side:THREE.DoubleSide,transparent:p===0,opacity:1}),wall=new THREE.Mesh(cupG,mat),cap=new THREE.Mesh(capG,mat);cap.rotation.x=-Math.PI/2;cap.position.y=.075;const rim=new THREE.Mesh(new THREE.TorusGeometry(.118,.007,6,24),new THREE.MeshBasicMaterial({color:0xc59d56}));rim.rotation.x=Math.PI/2;rim.position.y=-.072;c.add(wall,cap,rim);c.userData.mat=mat;grp.add(c);DICE.cups.push(c)}
 DICE.built=true}
function diceSeat(p){const T=diceTab(),a=Math.PI+p*2*Math.PI/3;return{x:T.x+Math.cos(a)*.5,z:T.z+Math.sin(a)*.5,a}}
/* ---------- física dos dados (corpo rígido de cubo: contatos por vértice com o pano e a parede do copo) ---------- */
const DV=[[-1,-1,-1],[1,-1,-1],[-1,1,-1],[1,1,-1],[-1,-1,1],[1,-1,1],[-1,1,1],[1,1,1]].map(v=>new THREE.Vector3(v[0]*DICE_H,v[1]*DICE_H,v[2]*DICE_H));
const _dv=new THREE.Vector3(),_dr=new THREE.Vector3(),_dvc=new THREE.Vector3(),_dn=new THREE.Vector3(),_dt=new THREE.Vector3(),_dq=new THREE.Quaternion(),_dw=new THREE.Vector3();
function diceImpulse(d,r,n,pen,e,mu){const v=_dvc.copy(d.w).cross(r).add(d.v),vn=v.dot(n);if(vn>=0)return;const rn=_dr.copy(r).cross(n),k=1+rn.lengthSq()/d.I,j=-(1+e)*vn/k;d.v.addScaledVector(n,j);d.w.addScaledVector(rn,j/d.I);
 const vt=_dt.copy(v).addScaledVector(n,-vn),vtl=vt.length();if(vtl>1e-5){vt.multiplyScalar(1/vtl);const rt=_dr.copy(r).cross(vt),kt=1+rt.lengthSq()/d.I,jt=Math.min(vtl/kt,mu*j);d.v.addScaledVector(vt,-jt);d.w.addScaledVector(rt,-jt/d.I)}}
function diceStep(d,h,cx,cz,R,y0){if(d.sleep)return;d.v.y-=9.8*h;d.p.addScaledVector(d.v,h);const wl=d.w.length();if(wl>1e-6){_dq.setFromAxisAngle(_dw.copy(d.w).multiplyScalar(1/wl),wl*h);d.q.premultiply(_dq).normalize()}
 let lowPen=0;for(const lv of DV){const r=_dv.copy(lv).applyQuaternion(d.q),wy=d.p.y+r.y;if(wy<y0){const pen=y0-wy;if(pen>lowPen)lowPen=pen;diceImpulse(d,r.clone(),_dn.set(0,1,0),pen,.32,.5)}
  const wx=d.p.x+r.x-cx,wz=d.p.z+r.z-cz,rr=Math.hypot(wx,wz);if(R&&rr>R){const n=new THREE.Vector3(-wx/rr,0,-wz/rr);diceImpulse(d,r.clone(),n,rr-R,.35,.3);d.p.x+=n.x*(rr-R)*.5;d.p.z+=n.z*(rr-R)*.5}}
 if(lowPen>0)d.p.y+=lowPen*.8;d.v.multiplyScalar(1-.6*h);d.w.multiplyScalar(1-2.2*h)}
function diceCollidePair(a,b){if(a.sleep||b.sleep)return;const dx=b.p.x-a.p.x,dy=b.p.y-a.p.y,dz=b.p.z-a.p.z,dd=Math.hypot(dx,dy,dz),m=DICE_S*1.02;if(dd>=m||dd<1e-6)return;const nx=dx/dd,ny=dy/dd,nz=dz/dd,ov=(m-dd)/2;a.p.x-=nx*ov;a.p.y-=ny*ov;a.p.z-=nz*ov;b.p.x+=nx*ov;b.p.y+=ny*ov;b.p.z+=nz*ov;
 const vn=(a.v.x-b.v.x)*nx+(a.v.y-b.v.y)*ny+(a.v.z-b.v.z)*nz;if(vn>0){const j=vn*.8;a.v.x-=nx*j;a.v.y-=ny*j;a.v.z-=nz*j;b.v.x+=nx*j;b.v.y+=ny*j;b.v.z+=nz*j;a.w.multiplyScalar(.9);b.w.multiplyScalar(.9)}}
function diceUp(d){let best=-2,face=1;const ax=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];ax.forEach((a,i)=>{const y=_dv.set(...a).applyQuaternion(d.q).y;if(y>best){best=y;face=DICE_FACE[i]}});return face}
function diceSnap(d){/* assenta: gira o mínimo até a face de cima ficar plana */const ax=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];let bi=0,best=-2;ax.forEach((a,i)=>{const y=_dv.set(...a).applyQuaternion(d.q).y;if(y>best){best=y;bi=i}});const up=_dv.set(...ax[bi]).applyQuaternion(d.q).normalize();_dq.setFromUnitVectors(up,new THREE.Vector3(0,1,0));d.qT=d.q.clone().premultiply(_dq)}
function diceThrow(p){const pl=DICE.players[p],s=diceSeat(p),T=diceTab();pl.dice=[];for(let k=0;k<pl.n;k++){const a=Math.random()*6.28,r=Math.random()*.045;pl.dice.push({p:new THREE.Vector3(s.x+Math.cos(a)*r,T.y+.05+Math.random()*.06,s.z+Math.sin(a)*r),v:new THREE.Vector3((Math.random()-.5)*1.2,-.4-Math.random()*.6,(Math.random()-.5)*1.2),w:new THREE.Vector3((Math.random()-.5)*40,(Math.random()-.5)*40,(Math.random()-.5)*40),q:new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.random()*6.28,Math.random()*6.28,Math.random()*6.28)),I:DICE_S*DICE_S/6,sleep:false,still:0,val:0})}}
function diceSim(dt){const T=diceTab(),n=Math.max(1,Math.ceil(dt/(1/900))),h=dt/n;let moving=false;
 for(let it=0;it<n;it++)for(let p=0;p<3;p++){const pl=DICE.players[p];if(!pl.dice)continue;const s=diceSeat(p);for(const d of pl.dice)diceStep(d,h,s.x,s.z,.09,T.y);for(let i=0;i<pl.dice.length;i++)for(let j=i+1;j<pl.dice.length;j++)diceCollidePair(pl.dice[i],pl.dice[j])}
 for(const pl of DICE.players){if(!pl.dice)continue;for(const d of pl.dice){if(d.sleep){if(d.qT){d.q.slerp(d.qT,Math.min(1,dt*10));if(d.q.angleTo(d.qT)<.01||DICE.t>5.5){d.q.copy(d.qT);d.qT=null}}continue}const sp=d.v.length()+d.w.length()*DICE_H;if(sp<.035||DICE.t>4.5)d.still+=dt;else d.still=0;if(d.still>.25){d.sleep=true;d.v.set(0,0,0);d.w.set(0,0,0);if(d.p.y<T.y+DICE_H*1.6)d.p.y=T.y+DICE_H;diceSnap(d)}else moving=true}}
 return moving||DICE.players.some(pl=>pl.dice&&pl.dice.some(d=>d.qT))}
/* ---------- regras ---------- */
function diceCount(f){let c=0;for(const pl of DICE.players)if(pl.dice)for(const d of pl.dice){if(diceUp(d)===f)c++}return c}
function diceTotal(){return DICE.players.reduce((a,pl)=>a+pl.n,0)}
function diceAlive(p){return DICE.players[p].n>0}
function diceNext(p){for(let k=1;k<=3;k++){const q=(p+k)%3;if(diceAlive(q))return q}return p}
function diceValid(q,f,b){if(f<1||f>6||q<1||q>diceTotal())return false;if(!b)return true;return q>b.q||(q===b.q&&f>b.f)}
function diceBinomEq(n,k,pr){if(k<0||k>n)return 0;let c=1;for(let j=0;j<k;j++)c=c*(n-j)/(j+1);return c*Math.pow(pr,k)*Math.pow(1-pr,n-k)}
function diceBinom(n,k,pr){if(k<=0)return 1;if(k>n)return 0;let s=0;for(let i=k;i<=n;i++){let c=1;for(let j=0;j<i;j++)c=c*(n-j)/(j+1);s+=c*Math.pow(pr,i)*Math.pow(1-pr,n-i)}return s}
function diceProb(p,q,f){const pl=DICE.players[p];let mine=0;for(const d of pl.dice)if(d.val===f)mine++;return diceBinom(diceTotal()-pl.n,q-mine,1/6)}
function diceAI(p){const b=DICE.bid,pl=DICE.players[p],bluff=p===2?.18:.08;
 if(b){let mine=0;for(const d of pl.dice)if(d.val===b.f)mine++;const pe=diceBinomEq(diceTotal()-pl.n,b.q-mine,1/6);if(pe>.34&&Math.random()<.55)return{spot:true};const pt=diceProb(p,b.q,b.f);if(pt<.28+Math.random()*.12)return{call:true}} /* v79r34b: na mosca quando a conta exata é provável */
 let best=null;const qs=b?[b.q,b.q+1,b.q+2]:[1,2,Math.max(1,Math.round(diceTotal()/6))];for(const q of qs)for(let f=1;f<=6;f++){if(!diceValid(q,f,b))continue;let sc=diceProb(p,q,f)-(q-(b?b.q:0))*.04+(Math.random()-.5)*bluff*2;if(!best||sc>best.sc)best={q,f,sc}}
 if(!best||best.sc<.1)return b?{call:true}:{q:1,f:6};return{q:best.q,f:best.f}}
function diceSay(p,txt,d=2){const q=DICE.npcs[p-1];if(q&&peds.includes(q))say(q,txt,d)}
function diceFaceTxt(f){return['','⚀','⚁','⚂','⚃','⚄','⚅'][f]}
function diceBidTxt(b){return b.q+' × '+diceFaceTxt(b.f)+' ('+b.q+' '+translatePlain(b.q>1?'dados de':'dado de')+' '+b.f+')'}
function diceStartRound(first){DICE.reshook=false;DICE.reshake=false;DICE.bid=null;DICE.phase='roll';DICE.t=0;DICE.reveal=0;DICE.cupLift=1;for(let p=0;p<3;p++){if(diceAlive(p))diceThrow(p);else DICE.players[p].dice=[]}DICE.turn=first;DICE.q=1;DICE.f=2;DICE.msg=translatePlain('Chacoalhando os copos…');try{clang(.12)}catch(e){}}
function diceCanShake(){return DICE.on&&DICE.phase==='bid'&&!DICE.bid&&!DICE.reshook&&diceAlive(0)}
function diceShake(){if(!diceCanShake())return;DICE.reshook=true;DICE.reshake=true;DICE.phase='roll';DICE.t=0;DICE.cupLift=1;diceThrow(0);DICE.msg=translatePlain('Remexendo o copo…');try{clang(.12)}catch(e){}diceHud(true)} /* v79r34: só o seu copo, uma vez, antes da 1ª aposta da rodada */
function diceAfterRoll(){const rs=DICE.reshake;DICE.reshake=false;for(const pl of DICE.players)if(pl.dice)for(const d of pl.dice)d.val=diceUp(d);DICE.phase='bid';DICE.aiT=(rs?1.2:1.6)+Math.random();DICE.msg=DICE.turn===0?translatePlain('Sua vez: faça a primeira aposta.'):dn(DICE.turn)+' '+translatePlain('está pensando…');diceHud(true)}
function diceDoBid(p,q,f){if(!diceValid(q,f,DICE.bid))return false;DICE.bid={q,f,p};DICE.msg=dn(p)+': '+diceBidTxt(DICE.bid);if(p>0)diceSay(p,q+' '+translatePlain(q>1?'dados de':'dado de')+' '+f+'!',2);DICE.turn=diceNext(p);DICE.aiT=1.8+Math.random()*1.2;if(DICE.turn===0){DICE.q=q;DICE.f=f;diceBump()}diceHud(true);return true}
function diceBump(){/* sugere o menor aumento válido */const b=DICE.bid;if(!b)return;if(b.f<6){DICE.q=b.q;DICE.f=b.f+1}else{DICE.q=b.q+1;DICE.f=1}}
function diceCall(p,spot){const b=DICE.bid;if(!b)return;DICE.phase='reveal';DICE.t=0;DICE.caller=p;DICE.spot=!!spot;const c=diceCount(b.f);
 if(spot){const hit=c===b.q;DICE.spotHit=hit;DICE.losers=hit?[0,1,2].filter(q=>q!==p&&diceAlive(q)):[p];DICE.loser=DICE.losers[0];
  DICE.msg=dn(p)+' '+translatePlain('NA MOSCA!')+' · '+translatePlain('tem')+' '+c+' × '+diceFaceTxt(b.f)+' · '+(hit?translatePlain('acertou em cheio')+' → '+translatePlain('todos os outros perdem um dado'):translatePlain('errou a conta exata')+' → '+dn(p)+' '+translatePlain('perde um dado'));if(p>0)diceSay(p,'Na mosca!',1.8)}
 else{const ok=c>=b.q;DICE.spotHit=false;DICE.loser=ok?p:b.p;DICE.losers=[DICE.loser];
  DICE.msg=dn(p)+' '+translatePlain('DUVIDOU!')+' · '+translatePlain('tem')+' '+c+' × '+diceFaceTxt(b.f)+' · '+(ok?translatePlain('a aposta valia'):translatePlain('era blefe'))+' → '+dn(DICE.loser)+' '+translatePlain('perde um dado');if(p>0)diceSay(p,'Duvido!',1.8)}
 diceHud(true)} /* v79r34b: NA MOSCA (RDR1) — conta exata: quem chamou fica salvo e todos os outros perdem 1 dado; errou: só quem chamou perde */
function diceAfterReveal(){const Ls=DICE.losers||[DICE.loser],L=DICE.spotHit?DICE.caller:Ls[0];for(const q of Ls){const pl=DICE.players[q];pl.n=Math.max(0,pl.n-1);if(q>0&&pl.n===0)diceSay(q,'Tô fora…',2)}
 const alive=[0,1,2].filter(diceAlive);if(!diceAlive(0))return diceEnd(false);if(alive.length===1)return diceEnd(true);if(!alive.length)return diceEnd(false);diceStartRound(diceAlive(L)?L:diceNext(L))}
function diceEnd(win){DICE.phase='end';DICE.end={win};if(win)money(DICE.bet*3,'DADOS · +$'+DICE.bet*3);diceSay(1,win?'Você é bom nisso!':'Hoje é nosso dia!',2.4);diceHud(true)}
/* ---------- abrir / fechar ---------- */
function diceOpen(){if(DICE.on||PL.inside!=='casino'||PL.car||PL.dead)return;if((PL.money||0)<DICE.bet){toast(translatePlain('DADOS')+' · '+translatePlain('PRECISA DE')+' $'+DICE.bet);return}
 DICE.on=true;for(const k in keys)keys[k]=false;if(document.pointerLockElement)document.exitPointerLock();DICE.save={fov:camera.fov,near:camera.near,pv:PL.sp.visible,sv:PL.sh.visible};PL.sp.visible=false;PL.sh.visible=false;document.body.classList.add('pool-mode');
 $('#dice').hidden=false;$('#dcLoad').hidden=false;$('#dcEnd').hidden=true;setTimeout(()=>{try{diceBuild();DICE.grp.visible=true;diceNew()}catch(e){console.error(e);diceClose();return}$('#dcLoad').hidden=true},60)}
function diceNew(){if((PL.money||0)<DICE.bet){toast(translatePlain('PRECISA DE')+' $'+DICE.bet);diceClose();return}gambleCharge(DICE.bet,'DADOS · −'+betFmt(DICE.bet));DICE.players=[0,1,2].map(i=>({n:5,dice:[]}));DICE.end=null;$('#dcEnd').hidden=true;DICE.cam=null;diceStartRound(0);diceSay(2,'Bora, cada um no seu copo!',2)}
function diceClose(){if(!DICE.on)return;DICE.on=false;if(DICE.grp)DICE.grp.visible=false;$('#dice').hidden=true;document.body.classList.remove('pool-mode');camera.up.set(0,1,0);camera.clearViewOffset();if(DICE.save){camera.fov=DICE.save.fov;camera.near=DICE.save.near;camera.updateProjectionMatrix();PL.sp.visible=DICE.save.pv;PL.sh.visible=DICE.save.sv}
 if(DICE.phase!=='end'&&DICE.phase!=='idle')toast(translatePlain('DADOS')+' · '+translatePlain('aposta perdida por abandonar'));DICE.phase='idle';const T=diceTab();if(T){PL.x=T.x-1.5;PL.z=T.z;PL.face=[1,0];camT.x=PL.x;camT.z=PL.z}}
function hudBand(topSel,botSel){const H=innerHeight,top=$(topSel),bot=$(botSel);if(!top||!bot||!H)return null;const a=top.getBoundingClientRect().bottom,b=bot.getBoundingClientRect().top;if(!(b>a+20))return null;return{c:(a+b)/2,f:(b-a)/H}}
/* v1r24: slider vertical (range girado -90°) não respondia ao toque no celular (o navegador lia o arrasto na horizontal e o
   tzSync devolvia o valor). Agora a caixa .tz-zoom trata o ponteiro: posição vertical → valor, dispara 'input'. */
function tzDragInit(){for(const box of document.querySelectorAll('.tz-zoom')){const inp=box.querySelector('input');if(!inp||box._tzd)continue;box._tzd=1;
 const set=e=>{const r=inp.getBoundingClientRect(),v=clamp((r.bottom-e.clientY)/(r.height||1),0,1),nv=Math.round(v*100);if(+inp.value!==nv){inp.value=nv;inp.dispatchEvent(new Event('input',{bubbles:true}))}};
 box.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();box._drag=e.pointerId;try{box.setPointerCapture(e.pointerId)}catch(_){}set(e)});
 box.addEventListener('pointermove',e=>{if(box._drag!==e.pointerId)return;e.preventDefault();e.stopPropagation();set(e)});
 const up=e=>{if(box._drag===e.pointerId)box._drag=null};box.addEventListener('pointerup',up);box.addEventListener('pointercancel',up);
 for(const ev of['touchstart','touchmove'])box.addEventListener(ev,e=>{e.stopPropagation();if(e.cancelable)e.preventDefault()},{passive:false})}}
function tzSync(id,v){const el=$(id+' input');if(el&&document.activeElement!==el&&el.parentNode._drag==null)el.value=Math.round(clamp(v,0,1)*100)} /* v79r36: o slider vale nas duas vistas; cada vista guarda o seu zoom (0 = longe, 1 = perto) */
function tzBump(id,obj,key,d){obj[key]=clamp((obj[key]||0)+d,0,1);tzSync(id,obj[key])}
function diceFreeBand(){/* v79r34: faixa livre entre o placar de cima e o painel de baixo (no celular ela é estreita) */const H=innerHeight,top=$('#dice .dc-top'),bot=$('#dice .dc-bot');if(!top||!bot||!H)return null;const a=top.getBoundingClientRect().bottom,b=bot.getBoundingClientRect().top;if(!(b>a+20))return null;return{c:(a+b)/2,f:(b-a)/H}}
function diceView(){DICE.view=DICE.view==='3d'?'top':'3d';DICE.cam=null;diceHud(true)}
/* ---------- quadro a quadro ---------- */
function diceTick(dt){if(!DICE.built)return;const T=diceTab();DICE.t+=dt;
 if(DICE.phase==='roll'){DICE.cupLift=Math.max(0,DICE.cupLift-dt*5);if(DICE.cupLift<=0){const mv=diceSim(Math.min(dt,1/30));if(!mv&&DICE.t>.9)diceAfterRoll()}}
 else if(DICE.phase==='bid'&&DICE.turn!==0){DICE.aiT-=dt;if(DICE.aiT<=0){const a=diceAI(DICE.turn);if(a.spot&&DICE.bid)diceCall(DICE.turn,true);else if(a.call&&DICE.bid)diceCall(DICE.turn);else if(!diceDoBid(DICE.turn,a.q,a.f)){const b=DICE.bid;diceDoBid(DICE.turn,b.f<6?b.q:b.q+1,b.f<6?b.f+1:1)}}}
 else if(DICE.phase==='reveal'){DICE.reveal=Math.min(1,DICE.reveal+dt*2.5);if(DICE.t>4.2)diceAfterReveal()}
 /* malhas */let di=0;for(let p=0;p<3;p++){const pl=DICE.players[p]||{dice:[]},s=diceSeat(p);for(let k=0;k<5;k++){const m=DICE.dm[di++],d=pl.dice&&pl.dice[k];if(!d){m.visible=false;continue}m.visible=true;m.position.copy(d.p);m.quaternion.copy(d.q);
   const hit=DICE.phase==='reveal'&&DICE.bid&&d.val===DICE.bid.f;m.scale.setScalar(hit?1+.12*Math.abs(Math.sin(DICE.t*6)):1)}
  {const lost=5-(pl.n==null?5:pl.n),T2=diceTab(),ux=T2.x-s.x,uz=T2.z-s.z,ul=Math.hypot(ux,uz)||1,nx=ux/ul,nz=uz/ul,px=-nz,pz=nx;for(let k=0;k<5;k++){const m=DICE.lost[p*5+k];if(k>=lost){m.visible=false;continue}const o=(k-(lost-1)/2)*DICE_S*1.35;m.visible=true;m.position.set(s.x+nx*.17+px*o,T2.y+DICE_H,s.z+nz*.17+pz*o);m.rotation.set(0,-s.a+k*.35,0)}}
  const c=DICE.cups[p];c.visible=diceAlive(p)||DICE.phase==='reveal';const lift=DICE.phase==='reveal'?DICE.reveal*.22:DICE.phase==='roll'&&(!DICE.reshake||p===0)?DICE.cupLift*.18:0;c.position.set(s.x,T.y+.075+lift,s.z);c.rotation.z=DICE.phase==='reveal'?DICE.reveal*.5:0;if(p===0)c.userData.mat.opacity=DICE.phase==='bid'||DICE.phase==='reveal'?.18:1}
 DICE.hudT-=dt;if(DICE.hudT<=0){DICE.hudT=.2;diceHud()}}
function diceCam(dt){const T=diceTab();if(!T)return;camera.near=.02;let want,look;
 if(DICE.view==='top'){camera.up.set(1,0,0);const z=DICE.tz??.35,cx=T.x-.3-z*.2,h=2.1/(1+z*2.6);want=new THREE.Vector3(cx,T.y+h,T.z);look=new THREE.Vector3(cx,T.y,T.z);camera.fov=50} /* v79r35: zoom aproxima e puxa pro seu copo */
 else{camera.up.set(0,1,0);const s=diceSeat(0);want=new THREE.Vector3(T.x-1.25,T.y+.62,T.z);look=new THREE.Vector3(T.x+.1,T.y-.08,T.z);if(DICE.phase==='bid'&&DICE.turn===0){want.set(T.x-1.05,T.y+.5,T.z);look.set(T.x-.1,T.y-.12,T.z)}camera.fov=55} /* v79r13: seu copo fica no terço de baixo, acima do painel */
 if(DICE.view!=='top'){const z3=DICE.z3||0;want.lerp(look,z3*.35);look.x+=(T.x-.5-look.x)*z3*.45} /* v79r36: zoom 3D aproxima e mira no seu copo */
 const fr=diceFreeBand();if(fr&&DICE.view!=='top'){const k=Math.max(1,.62/fr.f);if(k>1.01){const L=want.clone().sub(look),t0=Math.tan(camera.fov*Math.PI/360),fov=Math.min(72,2*Math.atan(t0*k)*180/Math.PI),t1=Math.tan(fov*Math.PI/360);camera.fov=fov;want.copy(look).addScaledVector(L,Math.max(1,t0*k/t1))}}
 if(!DICE.cam){DICE.cam=want.clone();DICE.look=look.clone()}else{const k=Math.min(1,dt*4);DICE.cam.lerp(want,k);DICE.look.lerp(look,k)}camera.position.copy(DICE.cam);camera.lookAt(DICE.look);
 if(fr){const W=innerWidth,H=innerHeight;camera.setViewOffset(W,H,0,Math.round(H/2-fr.c),W,H)}else camera.clearViewOffset();camera.updateProjectionMatrix();if(typeof sky!=='undefined'&&sky)sky.position.copy(camera.position)}
function diceHud(force){if(!DICE.on)return;const pls=DICE.players;$('#dcPl').innerHTML=pls.map((pl,i)=>'<div class="dc-p'+(DICE.turn===i&&DICE.phase==='bid'?' on':'')+(pl.n?'':' out')+'"><b>'+translatePlain(dn(i))+'</b><span>'+'🎲'.repeat(pl.n)+'</span></div>').join('');
 $('#dcMsg').textContent=DICE.msg;const b=DICE.bid;$('#dcBid').innerHTML=b?translatePlain('Aposta na mesa')+': <b>'+diceBidTxt(b)+'</b> · '+translatePlain(dn(b.p)):translatePlain(DICE.reshook||!diceAlive(0)?'Sem aposta ainda':'Sem aposta ainda · dá pra remexer o copo');
 const mine=DICE.phase==='bid'&&DICE.turn===0;$('#dcCtl').classList.toggle('off',!mine);$('#dcQ').textContent=DICE.q;$('#dcF').textContent=diceFaceTxt(DICE.f)+' '+DICE.f;$('#dcBidBtn').disabled=!mine||!diceValid(DICE.q,DICE.f,b);$('#dcCall').disabled=!mine||!b;$('#dcSpot').disabled=!mine||!b;
 const my=(pls[0]&&pls[0].dice||[]).map(d=>d.val).filter(Boolean).sort();$('#dcMine').textContent=DICE.phase==='bid'||DICE.phase==='reveal'?translatePlain('Seus dados')+': '+my.map(diceFaceTxt).join(' '):'';
 $('#dcView').textContent=translatePlain(DICE.view==='3d'?'VER DE CIMA':'VER EM 3D');$('#dcShake').hidden=!diceCanShake();tzSync('#dcZoom',DICE.view==='top'?(DICE.tz??.35):(DICE.z3||0)); /* v79r34: o botão mostra a vista para onde vai, não a atual */
 if(DICE.phase==='end'&&DICE.end){const e=$('#dcEnd');if(e.hidden||force){e.hidden=false;$('#dcEndT').textContent=DICE.end.win?translatePlain('VOCÊ VENCEU!')+' +$'+DICE.bet*3:translatePlain('VOCÊ PERDEU');dcStepRender()}}}
function dcStepRender(){DICE.bet=betFix(DICE.bet);betStepUI('dcStep',DICE.bet,d=>{DICE.bet=betNext(DICE.bet,d);dcStepRender()});$('#dcAgain').textContent=translatePlain('JOGAR DE NOVO')+' · '+betFmt(DICE.bet);$('#dcAgain').disabled=(PL.money||0)<DICE.bet}
function diceAdj(dq,df){if(!(DICE.phase==='bid'&&DICE.turn===0))return;DICE.q=clamp(DICE.q+dq,1,diceTotal());let f=DICE.f+df;if(f>6)f=1;if(f<1)f=6;DICE.f=f;diceHud()}
function diceKey(e,down){if(!DICE.on)return;const c=e.code;if(down&&!e.repeat){if(c==='ArrowUp'||c==='KeyW')diceAdj(1,0);else if(c==='ArrowDown'||c==='KeyS')diceAdj(-1,0);else if(c==='ArrowRight'||c==='KeyD')diceAdj(0,1);else if(c==='ArrowLeft'||c==='KeyA')diceAdj(0,-1);
  else if(c==='Space'||c==='Enter'){if(DICE.phase==='end')diceNew();else if(DICE.phase==='bid'&&DICE.turn===0)diceDoBid(0,DICE.q,DICE.f)}else if(c==='KeyX'||c==='KeyL'){if(DICE.phase==='bid'&&DICE.turn===0&&DICE.bid)diceCall(0)}else if(c==='KeyM'){if(DICE.phase==='bid'&&DICE.turn===0&&DICE.bid)diceCall(0,true)}else if(c==='KeyR')diceShake();else if(c==='KeyV'||c==='Tab')diceView();else if(c==='Escape')diceClose()}
 e.preventDefault();e.stopImmediatePropagation()}
addEventListener('keydown',e=>diceKey(e,true),true);addEventListener('keyup',e=>diceKey(e,false),true);
for(const ev of ['mousedown','click','pointerdown','wheel','contextmenu'])addEventListener(ev,e=>{if(DICE.on&&e.target===renderer.domElement){if(ev==='wheel'){if(DICE.view==='top')tzBump('#dcZoom',DICE,'tz',e.deltaY>0?-.08:.08);else tzBump('#dcZoom',DICE,'z3',e.deltaY>0?-.08:.08)}e.stopImmediatePropagation();if(ev!=='wheel')e.preventDefault()}},{capture:true,passive:false});
function dicePad(pr){if(pr(12))diceAdj(1,0);if(pr(13))diceAdj(-1,0);if(pr(15))diceAdj(0,1);if(pr(14))diceAdj(0,-1);if(pr(0)){if(DICE.phase==='end')diceNew();else if(DICE.phase==='bid'&&DICE.turn===0)diceDoBid(0,DICE.q,DICE.f)}if(pr(2)&&DICE.phase==='bid'&&DICE.turn===0&&DICE.bid)diceCall(0);if(pr(3))diceView();if(pr(4))diceShake();if(pr(5)&&DICE.phase==='bid'&&DICE.turn===0&&DICE.bid)diceCall(0,true);if(pr(1)||pr(9))diceClose()}
function diceNpcsSpawn(){diceNpcsClear();const T=diceTab();if(!T)return;for(let p=1;p<3;p++){const s=diceSeat(p),dx=s.x-T.x,dz=s.z-T.z,l=Math.hypot(dx,dz),x=T.x+dx/l*1.3,z=T.z+dz/l*1.3,pal=p===1?{...pick2(PED_PALS),shirt:'#8a2a5a',hair:'#d8d8d8'}:{...pick2(PED_PALS),shirt:'#2a5a8a',cap:'#202020'};const q=spawnPed(null,{x,z,vx:0,vz:0,pal});if(q){q.state='clerk';q.fixed=true;q.at={x,z};q.mx=-dx/l;q.mz=-dz/l;q.timer=0;DICE.npcs[p-1]=q}}}
function diceNpcsClear(){for(const q of DICE.npcs)if(q&&peds.includes(q))removePed(q);DICE.npcs=[]}

$('#dcQm').addEventListener('click',()=>diceAdj(-1,0));$('#dcQp').addEventListener('click',()=>diceAdj(1,0));$('#dcFm').addEventListener('click',()=>diceAdj(0,-1));$('#dcFp').addEventListener('click',()=>diceAdj(0,1));$('#dcBidBtn').addEventListener('click',()=>{if(DICE.phase==='bid'&&DICE.turn===0)diceDoBid(0,DICE.q,DICE.f)});$('#dcCall').addEventListener('click',()=>{if(DICE.phase==='bid'&&DICE.turn===0&&DICE.bid)diceCall(0)});$('#dcView').addEventListener('click',diceView);$('#dcShake').addEventListener('click',diceShake);tzDragInit();$('#dcZoom input').addEventListener('input',e=>{const v=+e.target.value/100;if(DICE.view==='top')DICE.tz=v;else DICE.z3=v});$('#plZoom input').addEventListener('input',e=>{const v=+e.target.value/100;if(POOL.view==='top')POOL.tz=v;else POOL.zoom=1-v});$('#dcSpot').addEventListener('click',()=>{if(DICE.phase==='bid'&&DICE.turn===0&&DICE.bid)diceCall(0,true)});$('#dcQuit').addEventListener('click',diceClose);$('#dcExit').addEventListener('click',diceClose);$('#dcAgain').addEventListener('click',diceNew);
{const fine=(id,d,acc)=>{let t=null,n=0;const st=()=>{if(POOL.phase==='aim'&&POOL.turn===0){n++;POOL.aim+=d*(acc?Math.min(3,1+n*.12):1)}};const el=$(id);el.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();n=0;st();clearInterval(t);t=setInterval(st,acc?40:70)});for(const ev of ['pointerup','pointerleave','pointercancel'])el.addEventListener(ev,()=>clearInterval(t))};fine('#plFineL',.0035);fine('#plFineR',-.0035);fine('#plFastL',.02,true);fine('#plFastR',-.02,true)} /* v79r26: ⏪ ⏩ giram rápido (acelera segurando, até ~1,5 rad/s); ◀ ▶ continuam no ajuste fino */
$('#plShot').addEventListener('click',e=>{e.stopPropagation();if(POOL.phase==='aim'&&POOL.turn===0)poolShoot(POOL.aim,POOL.pow)});$('#plView').addEventListener('click',e=>{e.stopPropagation();poolView()});$('#plQuit').addEventListener('click',e=>{e.stopPropagation();poolClose()});$('#plExit').addEventListener('click',e=>{e.stopPropagation();poolClose()});$('#plAgain').addEventListener('click',e=>{e.stopPropagation();poolNew()});$('#plPow').addEventListener('input',e=>{POOL.pow=clamp(+e.target.value/100,.05,1)});

function tgFinish(payout,pt,en){const t=TABLE_GAME;if(payout>0)money(Math.round(payout));t.phase='done';t.msg=tgLocale(pt,en)+(payout>0?' · +$'+Math.round(payout).toLocaleString(S.lang==='en'?'en-US':'pt-BR'):'');t.wager=0;clang(payout>0?.32:.08);tableGameRender()}
function tableGameDeal(){const t=TABLE_GAME;if(!t.open||t.phase==='playing')return;if(t.kind==='roul'){roulSpin();return}const bet=Number($('#tgBet').value)||50;if((PL.money||0)<bet){t.msg=tgLocale('DINHEIRO INSUFICIENTE','NOT ENOUGH MONEY');tableGameRender();return}t.bet=bet;t.wager=bet;t.deck=tgDeck();t.player=[];t.dealer=[];t.holds.clear();gambleCharge(bet);t.phase='playing';t.msg=tgLocale('Boa sorte!','Good luck!');
 if(t.kind==='bj'){t.player.push(t.deck.pop());t.dealer.push(t.deck.pop());t.player.push(t.deck.pop());t.dealer.push(t.deck.pop());const pn=tgBlackScore(t.player)===21,dn=tgBlackScore(t.dealer)===21;if(pn||dn){if(pn&&dn)tgFinish(bet,'EMPATE · BLACKJACK DOS DOIS','PUSH · BOTH BLACKJACK');else if(pn)tgFinish(bet*2.5,'BLACKJACK!','BLACKJACK!');else tgFinish(0,'BANCA TEM BLACKJACK','DEALER BLACKJACK')}}
 else for(let i=0;i<5;i++)t.player.push(t.deck.pop());tableGameRender()}
function tableGameHit(){const t=TABLE_GAME;if(!t.open||t.kind!=='bj'||t.phase!=='playing')return;t.player.push(t.deck.pop());const v=tgBlackScore(t.player);if(v>21)tgFinish(0,'ESTOUROU · '+v,'BUST · '+v);else if(v===21)tableGameStand();else tableGameRender()}
function tableGameStand(){const t=TABLE_GAME;if(!t.open||t.kind!=='bj'||t.phase!=='playing')return;const p=tgBlackScore(t.player);while(tgBlackScore(t.dealer)<17)t.dealer.push(t.deck.pop());const d=tgBlackScore(t.dealer);if(d>21||p>d)tgFinish(t.wager*2,'VOCÊ VENCEU','YOU WIN');else if(p===d)tgFinish(t.wager,'EMPATE · APOSTA DEVOLVIDA','PUSH · BET RETURNED');else tgFinish(0,'BANCA VENCEU','DEALER WINS')}
function tableGameDouble(){const t=TABLE_GAME;if(!t.open||t.kind!=='bj'||t.phase!=='playing'||t.player.length!==2)return;if((PL.money||0)<t.wager){t.msg=tgLocale('DINHEIRO INSUFICIENTE PARA DOBRAR','NOT ENOUGH TO DOUBLE');tableGameRender();return}gambleCharge(t.wager);t.wager*=2;t.player.push(t.deck.pop());if(tgBlackScore(t.player)>21)tgFinish(0,'ESTOUROU · DOBRO PERDIDO','BUST · DOUBLE LOST');else tableGameStand()}
function tgPayTable(){const t=TABLE_GAME,el=$('#tgRules');if(t.kind!=='poker')return;const rows=[['ROYAL FLUSH',250],['STRAIGHT FLUSH',50],[tgLocale('QUADRA','FOUR OF A KIND'),25],['FULL HOUSE',9],['FLUSH',6],[tgLocale('SEQUÊNCIA','STRAIGHT'),4],[tgLocale('TRINCA','THREE OF A KIND'),3],[tgLocale('DOIS PARES','TWO PAIR'),2],[tgLocale('PAR DE VALETE+','JACKS OR BETTER'),1]];
 const cur=t.player.length===5?tgPokerResult(t.player).rank:0;el.innerHTML='<div class="tgPay">'+rows.map(([n,m])=>{const on=cur===m&&cur>0?' class="on"':'';return `<span${on}>${n}</span><span${on}>${m}×</span>`}).join('')+'</div>'}
function tableGameDraw(){const t=TABLE_GAME;if(!t.open||t.kind!=='poker'||t.phase!=='playing')return;for(let i=0;i<5;i++)if(!t.holds.has(i))t.player[i]=t.deck.pop();const result=tgPokerResult(t.player);tgFinish(t.wager*result.rank,result.pt,result.en)}
$('#tgDeal').addEventListener('click',tableGameDeal);$('#tgHit').addEventListener('click',tableGameHit);$('#tgStand').addEventListener('click',tableGameStand);$('#tgDouble').addEventListener('click',tableGameDouble);$('#tgDraw').addEventListener('click',tableGameDraw);$('#tgClose').addEventListener('click',tableGameClose);
$('#tgBet').addEventListener('change',()=>{if(TABLE_GAME.phase==='playing')return;TABLE_GAME.bet=Number($('#tgBet').value)||50;tableGameRender()});


/* v2 r2.1: APOSTAS — todo minigame de aposta tem o mesmo ajuste de valor (degraus de $10 a $25.000), nunca acima do saldo.
   gambleCharge cobra a aposta; se um dia uma cobrança passar do saldo, o que faltou vira dívida e os capangas do agiota
   vêm (LOAN.state 'neg') até o jogador ter o valor — money() nunca deixa o saldo negativo, então a dívida fica à parte. */
const BET_STEPS=[10,50,100,250,500,1000,2500,5000,10000,25000];
function betFmt(v){return '$'+Math.round(v).toLocaleString(S.lang==='en'?'en-US':'pt-BR')}
function betMax(){const m=PL.money||0;let b=BET_STEPS[0];for(const v of BET_STEPS)if(v<=m)b=v;return b}
function betFix(v){const mx=betMax();if(!BET_STEPS.includes(v))v=BET_STEPS.reduce((a,b)=>Math.abs(b-v)<Math.abs(a-v)?b:a);return Math.min(v,mx)}
function betNext(v,d){let i=BET_STEPS.indexOf(betFix(v));i=clamp(i+d,0,BET_STEPS.length-1);const n=BET_STEPS[i];return n>(PL.money||0)&&d>0?v:n}
function betStepUI(id,v,onChange){const el=$('#'+id);if(!el)return;el.querySelector('b').textContent=betFmt(v);const[mn,pl]=el.querySelectorAll('button');mn.disabled=BET_STEPS.indexOf(v)<=0;pl.disabled=betNext(v,1)===v;
 if(!el._wired){el._wired=true;el.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;e.stopPropagation();el._cb&&el._cb(+b.dataset.d)})}el._cb=onChange}
function gambleCharge(v,why){const m=PL.money||0;if(v<=m){money(-v,why);return}money(-m,why);loanNegDebt(v-m)}
const BETDLG={open:false,cb:null,v:50,pad:null};
function betAsk(title,text,v,cb){const el=$('#betDlg');BETDLG.open=true;BETDLG.cb=cb;BETDLG.v=betFix(v);$('#betT').textContent=translatePlain(title);$('#betX').textContent=translatePlain(text);
 $('#betNo').textContent=translatePlain('SAIR');const upd=()=>{betStepUI('betStep',BETDLG.v,d=>{BETDLG.v=betNext(BETDLG.v,d);upd()});$('#betGo').textContent=translatePlain('JOGAR')+' · '+betFmt(BETDLG.v);$('#betGo').disabled=(PL.money||0)<BETDLG.v};upd();BETDLG.upd=upd;
 for(const k in keys)keys[k]=false;if(document.pointerLockElement)document.exitPointerLock();el.hidden=false;$('#betGo').focus();betPadLoop()}
function betClose(go){const el=$('#betDlg');if(!BETDLG.open)return;BETDLG.open=false;el.hidden=true;const cb=BETDLG.cb;BETDLG.cb=null;if(go&&cb&&(PL.money||0)>=BETDLG.v)cb(BETDLG.v)}
function betPadLoop(){const prev={};const step=()=>{if(!BETDLG.open)return;const gp=(navigator.getGamepads?[...navigator.getGamepads()]:[]).find(g=>g&&g.connected);
  if(gp){const pr=i=>{const on=!!(gp.buttons[i]&&gp.buttons[i].pressed),e=on&&!prev[i];prev[i]=on;return e};if(pr(14)){BETDLG.v=betNext(BETDLG.v,-1);BETDLG.upd()}if(pr(15)){BETDLG.v=betNext(BETDLG.v,1);BETDLG.upd()}if(pr(0)){betClose(true);return}if(pr(1)){betClose(false);return}}
  requestAnimationFrame(step)};requestAnimationFrame(step)}
document.addEventListener('keydown',e=>{if(!BETDLG.open)return;const k=e.key;if(k==='ArrowLeft'||k==='a'||k==='A'){BETDLG.v=betNext(BETDLG.v,-1);BETDLG.upd()}else if(k==='ArrowRight'||k==='d'||k==='D'){BETDLG.v=betNext(BETDLG.v,1);BETDLG.upd()}else if(k==='Enter'){betClose(true)}else if(k==='Escape'){betClose(false)}else return;e.preventDefault();e.stopPropagation()},true);
$('#betGo').addEventListener('click',()=>betClose(true));$('#betNo').addEventListener('click',()=>betClose(false));
function slotStepRender(){SLOT.bet=betFix(SLOT.bet);betStepUI('slotStep',SLOT.bet,d=>{if(SLOT.spin)return;SLOT.bet=betNext(SLOT.bet,d);slotStepRender()});$('#slotPull').textContent=translatePlain('PUXAR A ALAVANCA')+' · '+betFmt(SLOT.bet);$('#slotSub').innerHTML=translatePlain('três iguais =')+' <b>'+betFmt(SLOT.bet*100)+'</b>'}
function slotOpen(){SLOT.open=true;SLOT.spin=false;for(const k in keys)keys[k]=false;if(document.pointerLockElement)document.exitPointerLock();$('#slot').hidden=false;$('#slotMsg').textContent='puxe a alavanca · saldo $'+Math.round(PL.money||0).toLocaleString(S.lang==='en'?'en-US':'pt-BR');[...$('#slot').querySelectorAll('.slR')].forEach(e=>e.classList.remove('win'));slotStepRender();$('#slotPull').focus()}
function slotClose(){if(!SLOT.open)return;if(SLOT.spin)return;SLOT.open=false;$('#slot').hidden=true}
function slotPull(){if(SLOT.spin)return;const bet=SLOT.bet||10;if((PL.money||0)<bet){$('#slotMsg').textContent=translatePlain('DINHEIRO INSUFICIENTE');clang(.1);return}SLOT.cur=bet;gambleCharge(bet);SLOT.spin=true;clang(.2);const win=Math.random()<1/25,R=[...$('#slot').querySelectorAll('.slR')];R.forEach(e=>e.classList.remove('win'));let res;if(win){const s0=SLOT_SYM[Math.floor(Math.random()*SLOT_SYM.length)];res=[s0,s0,s0]}else{do{res=[0,1,2].map(()=>SLOT_SYM[Math.floor(Math.random()*SLOT_SYM.length)])}while(res[0]===res[1]&&res[1]===res[2])}$('#slotMsg').textContent='girando…';const t0=performance.now(),stops=[900,1400,1900];const step=()=>{const t=performance.now()-t0;R.forEach((e,i)=>{if(t<stops[i])e.textContent=SLOT_SYM[Math.floor(Math.random()*SLOT_SYM.length)];else e.textContent=res[i]});if(t<stops[2]){requestAnimationFrame(step);return}SLOT.spin=false;if(win){R.forEach(e=>e.classList.add('win'));const jp=(SLOT.cur||10)*100;money(jp);$('#slotMsg').innerHTML='<span style="color:#ffd21a">JACKPOT! +'+betFmt(jp)+'</span>';rumble(.8,.8,400);toast('<span style="color:#ffd21a">JACKPOT!</span> · +'+betFmt(jp))}else{$('#slotMsg').textContent=translatePlain('não foi dessa vez · saldo')+' '+betFmt(PL.money||0)}slotStepRender()};requestAnimationFrame(step)}
$('#slotPull').addEventListener('click',()=>slotPull());$('#slotClose').addEventListener('click',()=>slotClose());
