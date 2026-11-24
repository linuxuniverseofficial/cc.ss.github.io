'use strict';
/* Coastal Chaos · js/14-clima-policia.js — Clima, raios, polícia, dia/noite, fogo e explosões.
   Script clássico (não é módulo): todos os js/NN-*.js dividem o mesmo escopo global e entram na ordem do index.html. */
/* ================= WEATHER ================= */
/* v3 r23: relógio do jogo = 3 s reais por minuto de jogo (antes 1 s). Tudo que é "hora de jogo" em segundos reais usa GMIN. */
const GMIN=3,GHOUR=60*GMIN;
const WX={storm:0,f:0,lights:[],lcol:[],t:0};for(let i=0;i<12;i++){WX.lights.push(new THREE.Vector4(0,-999,0,0));WX.lcol.push(new THREE.Color())}
const RAIN_N=9000,rainGeo=new THREE.BufferGeometry();
{const pos=new Float32Array(RAIN_N*6),seed=new Float32Array(RAIN_N*6),tip=new Float32Array(RAIN_N*2);
 for(let i=0;i<RAIN_N;i++){const x=Math.random()*130,y=Math.random()*34,z=Math.random()*130;for(let k=0;k<2;k++){seed[(i*2+k)*3]=x;seed[(i*2+k)*3+1]=y;seed[(i*2+k)*3+2]=z;tip[i*2+k]=k}}
 rainGeo.setAttribute('position',new THREE.BufferAttribute(pos,3));rainGeo.setAttribute('seed',new THREE.BufferAttribute(seed,3));rainGeo.setAttribute('tip',new THREE.BufferAttribute(tip,1))}
const rainMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,defines:{RAIN_LIGHTS:6},uniforms:{boxSize:{value:110},C:{value:CELLS_U},time:{value:0},ctr:{value:new THREE.Vector3()},L:{value:WX.lights},LC:{value:WX.lcol},base:{value:.2},col:{value:new THREE.Color(0xd2dbe8)},amt:{value:0}},
 vertexShader:`uniform vec4 C[6];float rf(vec2 q){float r=0.;for(int i=0;i<6;i++){vec4 k=C[i];if(k.w<=0.)continue;float d=length(q-k.xy)/k.z;r=max(r,k.w*smoothstep(.45,.7,k.w)*(1.-smoothstep(.55,1.,d)));}return r;}attribute vec3 seed;attribute float tip;uniform float time,base,amt;uniform vec3 ctr,col;uniform float boxSize;uniform vec4 L[12];uniform vec3 LC[12];varying float vA;varying vec3 vC;
 void main(){vec3 b=vec3(boxSize,34.,boxSize);vec3 p;p.xz=ctr.xz+mod(seed.xz-ctr.xz,b.xz)-b.xz*.5;p.y=mod(seed.y-time,b.y);
  p+=vec3(.32,1.15,.1)*tip;float lit=base;vec3 c=col*base;for(int i=0;i<RAIN_LIGHTS;i++){vec3 d=p-L[i].xyz;float w=L[i].w*exp(-dot(d,d)/48.);lit+=w;c+=LC[i]*w;}
  vC=c/max(lit,.001);vA=clamp(lit,0.,.9)*(1.-tip*.55)*step(fract(seed.x*7.13+seed.z*3.1),amt*rf(p.xz));gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);}`,
 fragmentShader:`varying float vA;varying vec3 vC;void main(){gl_FragColor=vec4(vC,vA);}`});
const rain=new THREE.LineSegments(rainGeo,rainMat);rain.frustumCulled=false;rain.visible=false;rain.renderOrder=5;scene.add(rain);
let rainG=null;
function rainAt(x,z){let r=0;for(const k of CELLS){const d=Math.hypot(x-k.x,z-k.z)/k.r;const e=d<=.55?1:d>=1?0:1-((d-.55)/.45)**2*(3-2*(d-.55)/.45);const t=Math.min(1,Math.max(0,(k.s-.45)/.25));r=Math.max(r,k.s*t*t*(3-2*t)*e)}return r}
function spawnCell(near,at,storm){const E=city.ext,pc=PL.car||PL;const big=!!storm;const r=big?E*.9+500:150+Math.random()*300;let x,z;
 if(at){x=at.x;z=at.z}else if(big){x=E/2;z=E/2}else if(near){const a=Math.atan2(-WX.wz,-WX.wx)+(Math.random()-.5)*.9,d=r+60+Math.random()*120;x=pc.x+Math.cos(a)*d;z=pc.z+Math.sin(a)*d}
 else{x=-100+Math.random()*(E+200);z=-100+Math.random()*(E+200)}
 const c={x,z,r:at?at.r:r,s:at?at.s:0,max:big?.95:.7+Math.random()*.3,life:(big?200+Math.random()*120:at?60+Math.random()*70:100+Math.random()*200)*GMIN,age:0,big,storm:big};if(big){CELLS.unshift(c);if(CELLS.length>6)CELLS.pop()}else{CELLS.push(c);if(CELLS.length>6){const i=CELLS.findIndex(k=>!k.storm);CELLS.splice(i<0?0:i,1)}}return c}
const DIRS=['NORTE','NORDESTE','LESTE','SUDESTE','SUL','SUDOESTE','OESTE','NOROESTE'];
function dirName(dx,dz){const a=(Math.atan2(dx,-dz)*180/Math.PI+360+22.5)%360;return DIRS[Math.floor(a/45)]}
// A frente já atravessou metade do céu quando cover chega a zero.
// Concluir o escurecimento antes da borda alcançar o horizonte oposto, sem atraso adicional.
function stormGloomTarget(cover,active,fading,strength){if(!active)return 0;if(fading)return clamp(strength,0,1);const t=clamp(cover/.65,0,1);return t*t*(3-2*t)}
function stepCells(dt){if(!city.ext)return;
 if(S.rain&&!WX.freeze&&!WX.stormCell&&WX.stormEta==null&&WX.calm==null&&WX.postClear==null&&!netWxFollow()){WX.cellT=(WX.cellT||60*GMIN)-dt;if(WX.cellT<=0){WX.cellT=(35+Math.random()*75)*GMIN;if(CELLS.length<4&&Math.random()<(WX.chance===undefined?.25:WX.chance)){const c=spawnCell(false);c.wait=(15+Math.random()*25)*GMIN}}}
 for(const c of CELLS){if(!c.big){c.x+=WX.wx*dt/GMIN;c.z+=WX.wz*dt/GMIN}if(c.wait>0){c.wait-=dt;if(!S.rain){c.wait=0;c.dead=true}continue}if(c.storm&&!c.fading&&(WX.cover||0)<.9)continue;c.age+=dt;if(!S.rain&&!c.storm)c.life=Math.min(c.life,c.age);if(c.dead){c.s=0;continue}
  if(c.age<c.life)c.s=Math.min(c.max,c.s+dt/((c.storm?55:40)*GMIN)*c.max);
  else{if(c.storm&&!c.fading){c.fading=true;if(played)wxToast('PREVISÃO DO TEMPO','a tempestade está perdendo força')}
   c.s-=dt/(40*GMIN)*c.max}}
 for(let i=CELLS.length-1;i>=0;i--)if((CELLS[i].s<=0&&CELLS[i].age>1&&!(CELLS[i].wait>0))||CELLS[i].dead){if(CELLS[i].storm&&WX.stormCell===CELLS[i]){WX.stormCell=null;WX.freeze=true;WX.postClear=30*GMIN;WX.cellT=30*GMIN;WX.fair=0;WX.fairTg=0;WX.calm=null;WX.stormRoll=(300+Math.random()*600)*GMIN;if(WX.cheatStorm){WX.cheatStorm=false;if(played)wxToast('PREVISÃO DO TEMPO','a tempestade passou')}}CELLS.splice(i,1)}
 for(let i=0;i<6;i++){const c=CELLS[i];if(c)CELLS_U[i].set(c.x,c.z,c.r,c.s);else CELLS_U[i].set(0,0,1,0)}}
// v78: som da chuva separado do updateWeather: os interiores com palco (ROOM_STAGE) não rodam o clima,
// então o volume ficava congelado no valor de fora. Agora o loop chama rainAudioSet também dentro deles.
function rainAudioSet(f){if(AC){if(!rainG){const s=AC.createBufferSource();s.buffer=AC._noise;s.loop=true;const hp=AC.createBiquadFilter();hp.type='highpass';hp.frequency.value=900;const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=7000;rainG=AC.createGain();rainG.gain.value=0;rainG._lp=lp;s.connect(hp);hp.connect(lp);lp.connect(rainG);rainG.connect(master);s.start()}
  // v78: em qualquer interior (PL.inside: casa = true, demais = string) a chuva fica abafada pela parede:
  // 10% do volume e sem agudos (passa-baixa 7 kHz → 1,1 kHz), com transição suave ao entrar/sair.
  // Dentro, WX.f vai a zero na casa (updateWeather) e congela nos palcos; usa a chuva de fora guardada na entrada.
  const inside=!!PL.inside;if(!inside)WX.fOut=f;const amt=inside?(WX.fOut||0):f;
  rainG._lp.frequency.setTargetAtTime(inside?1100:7000,AC.currentTime,.25);
  rainG.gain.setTargetAtTime(menuOpen?0:amt*(PL.car?.05:.12)*(1+.7*WX.storm)*(inside?.1:1),AC.currentTime,.3)}}
/* v2 r2: clima próprio do Upside Down — céu fechado de nuvem preta (como antes da tempestade) com buracos que deixam ver o vermelho,
   horizonte livre, SEM chuva caindo e chão seco; raios vermelhos de vez em quando (invertLightningTick). Céu e hora não mudam. */
function invertWeather(dt){const st=STYLES[S.style],U=skyMat.uniforms;CELLS.length=0;for(let i=0;i<6;i++)CELLS_U[i].set(0,0,1,0);
 WX.f=0;WX.wet=false;WX.pre=0;WX.storm=0;WX.stormAmt=0;WX.stormCell=null;WX.stormEta=null;WX.cover=0;WX.coverMsg=false;WX.gloom=.35;rain.visible=false;
 U.stormK.value.set(1,0,2,0);U.stormB.value.set(2,0,0,0);U.sunDim.value=.6;U.camP.value.copy(camera.position);U.time.value=simT;U.fair.value=.5+.08*Math.sin(simT*.013); /* r22: nuvens fofas também aqui (cor do estilo via csTint) */
 /* cobertura respira devagar entre ~.8 e ~.88: abaixo disso abre demais, acima fecha como a tempestade */
 U.cloud.value=.84+.03*Math.sin(simT*.021)+.015*Math.sin(simT*.0071+1.3);U.cloudCol.value.setRGB(.045,.022,.026);
 if(scene.fog){scene.fog.near=st.fogNear*.72;scene.fog.far=st.fogFar*.8;captureDrawFogBase()}
 if(city.groundMat){city.groundMat.roughness=.95;city.groundMat.metalness=0;city.groundMat.color.setScalar(1)}if(city.M){city.M.mark.roughness=.8;city.M.lglow.color.copy(city.M.lglowBase)}
 rainAudioSet(0)}
const WX_LP={arr:[],pool:[],n:0};
function wxLp(a,b,c,d,e,f,g,h){const P=WX_LP;let q=P.pool[P.n];if(!q)q=P.pool[P.n]=[0,0,0,0,0,0,0,0];q[0]=a;q[1]=b;q[2]=c;q[3]=d;q[4]=e;q[5]=f;q[6]=g;q[7]=h;P.arr[P.n++]=q}
/* ordena por [0] (inserção; dezenas de itens, sem closure nem área temporária do sort) */
function laneSortD0(a){for(let i=1;i<a.length;i++){const v=a[i],s=v[0];let j=i-1;while(j>=0&&a[j][0]>s){a[j+1]=a[j];j--}a[j+1]=v}}
function updateWeather(dt){const st=STYLES[S.style];if(S.style==='inverted'){invertWeather(dt);return}
 if(st.noWeather){CELLS.length=0;WX.f=0;WX.wet=false;WX.pre=0;WX.gloom=0;skyMat.uniforms.sunDim.value=1;WX.storm=0;WX.stormAmt=0;WX.stormCell=null;WX.stormEta=null;WX.cover=0;WX.coverMsg=false;rain.visible=false;
  WX.wx=.18;WX.wz=.08;skyMat.uniforms.camP.value.copy(camera.position);skyMat.uniforms.cloud.value=.16;skyMat.uniforms.time.value=simT;skyMat.uniforms.fair.value=.08;skyMat.uniforms.cloudCol.value.setRGB(.52,.52,.56);
  if(scene.fog){scene.fog.near=st.fogNear*.7;scene.fog.far=st.fogFar*.82;captureDrawFogBase()}if(city.groundMat){city.groundMat.roughness=.98;city.groundMat.metalness=0;city.groundMat.color.setScalar(.9)}if(city.M){city.M.mark.roughness=.88;city.M.lglow.color.copy(city.M.lglowBase).multiplyScalar(.15)}
  if(AC&&rainG)rainG.gain.setTargetAtTime(0,AC.currentTime,.1);return}
 if(S.rain!==WX.lastOpt){WX.lastOpt=S.rain;if(S.rain&&city.ext){const a=Math.random()*6.283,w=3+Math.random()*4;WX.wx=Math.cos(a)*w;WX.wz=Math.sin(a)*w;
  // clima da cidade: cada seed tem a sua chance de chuva (0% a 100%); o momento de cada chuva continua aleatório
  {const sr=mulberry32((S.seed^0x7a1b2c3d)>>>0);sr();WX.chance=city.haze?1:Math.pow(sr(),1.15)}WX.cellT=city.haze?4:(20+Math.random()*60)*GMIN;
  if(Math.random()<WX.chance){
   const count=1+Math.floor(Math.random()*3);
   for(let i=0;i<count;i++){
    const cell=spawnCell(false);
    cell.max=.7+Math.random()*.3;cell.s=cell.max*(.35+Math.random()*.65);
    cell.wait=0;cell.life=(90+Math.random()*180)*GMIN;
   }
  }}}
 // tempestade agendada: previsão 1h de jogo (GHOUR = 3 min reais) antes
 stormTick(dt);
 if(WX.stormNext!=null&&S.storm){WX.stormNext-=dt;if(WX.stormNext<=0){WX.stormNext=null;WX.stormReq=true}}
 if(WX.stormReq&&played&&!menuOpen&&city.ext){WX.stormReq=false;if(!WX.stormCell&&!netWxFollow()){WX.stormEta=GHOUR;WX.stormMsg=GHOUR;WX.stormDir=Math.random()*6.283;wxToast('PREVISÃO DO TEMPO: TEMPESTADE EM 1H','vindo do '+dirName(Math.cos(WX.stormDir),Math.sin(WX.stormDir)).toLowerCase()+'')}}
 if(WX.stormEta!=null&&city.ext){WX.stormEta-=dt;const e=WX.stormEta;
  if(e<=30*GMIN&&WX.stormMsg>30*GMIN){WX.stormMsg=30*GMIN;wxToast('PREVISÃO DO TEMPO: TEMPESTADE EM 30 MIN','nuvens escuras já aparecem no horizonte, ao '+dirName(Math.cos(WX.stormDir),Math.sin(WX.stormDir)).toLowerCase())}
  else if(e<=10*GMIN&&WX.stormMsg>10*GMIN){WX.stormMsg=10*GMIN;wxToast('TEMPESTADE EM 10 MIN','procure abrigo')}
  if(e<=0){WX.stormEta=null;WX.coverMsg=false;if(WX.stormDir==null)WX.stormDir=Math.random()*6.283;const E=city.ext;WX.stormCell=spawnCell(false,null,true);WX.stormCell.x=E/2;WX.stormCell.z=E/2;WX.cover=0}
  if(e>0&&e<=35*GMIN){WX.pre=Math.min(1,(35*GMIN-e)/(35*GMIN))}}else WX.pre=Math.max(0,(WX.pre||0)-dt/(20*GMIN));
 stepCells(dt);stepWet(dt);
 {const sc=WX.stormCell,u=skyMat.uniforms.stormK.value,ub=skyMat.uniforms.stormB.value,dd=WX.stormDir||0,pr=WX.pre||0;
  // frente da tempestade: começa no horizonte do lado de onde ela vem e avança; o lado oposto fica claro.
  // ao enfraquecer, a borda de trás (céu limpando) entra pelo mesmo lado e atravessa o céu.
  let front=1.6,back=1.6,amt=0;const k=sc?clamp(sc.s/sc.max,0,1):0;
  if(sc&&!sc.fading){WX.cover=Math.min(1,(WX.cover||0)+dt/(28*GMIN));front=-1.7*WX.cover;amt=1;if(WX.cover>=1)WX.coverMsg=true}else if(sc&&sc.fading){front=-1.7;back=-1.7+3.4*k;amt=1}
  else if(pr>0){front=1.4-1.4*pr;amt=.35+.65*pr}
  u.set(Math.cos(dd),Math.sin(dd),front,amt);ub.set(back,0,sc?1:0,0);WX.stormAmt=sc?Math.max(k,WX.cover||0):pr*.5;{const tg=stormGloomTarget(WX.cover||0,!!sc,!!sc?.fading,k);WX.gloom=sc&&!sc.fading?tg:(WX.gloom||0)+(tg-(WX.gloom||0))*Math.min(1,dt*.8/GMIN);skyMat.uniforms.sunDim.value=1-.77*WX.gloom}}
 const c0=camMode==='top'?camT:{x:camera.position.x,z:camera.position.z};
 WX.f+=(((PL.inside&&!TVM.on)?0:rainAt(c0.x,c0.z))-WX.f)*Math.min(1,dt*.7);const f=WX.f;
 if(played&&!menuOpen&&simT>(WX.msgT||0)){if(f>.45&&!WX.wet){WX.wet=true;WX.msgT=simT+20}else if(f<.12&&WX.wet){WX.wet=false;WX.msgT=simT+20}}
 rainMat.uniforms.boxSize.value=MOB_LITE?84:110;rainGeo.setDrawRange(0,2*Math.round((MOB_LITE?3200:6000)*(.6+.4*Math.max(WX.f,WX.storm||0))));
 let _anyRain=false,_bigRain=false;for(let i=0;i<CELLS.length;i++){const k=CELLS[i];if(k.s>.02)_anyRain=true;if(k.big&&k.s>.55)_bigRain=true}
 rain.visible=_anyRain&&!NAV.open&&(!PL.inside||TVM.on);WX.storm+=((_bigRain?1:0)-(WX.storm||0))*Math.min(1,dt*.4);rainMat.uniforms.amt.value=.6+.4*WX.storm;WX.rainPhase=(WX.rainPhase||0)+dt*(24+rainMat.uniforms.amt.value*12);
 rainMat.uniforms.time.value=WX.rainPhase;skyMat.uniforms.camP.value.copy(camera.position);
 const c=camMode==='top'?camT:{x:camera.position.x,z:camera.position.z};rainMat.uniforms.ctr.value.set(c.x,0,c.z);
 const nf=DN.nightF;rainMat.uniforms.base.value=.03+.26*(1-nf);rainMat.uniforms.col.value.setRGB(.5,.53,.6).lerp(_c3.setRGB(.82,.86,.92),1-nf);
 WX.t-=dt;if(WX.t<=0&&(rain.visible||WET.max>.02)){WX.t=.2;const arr=WX_LP.arr;WX_LP.n=0; /* v3 r5: luzes da chuva em entradas reaproveitadas */
  for(const ch of city.chunks.values())for(const l of ch.lamps)if(l.on&&!l.broken){const d=Math.hypot(l.x-c.x,l.z-c.z);if(d<75)wxLp(d,l.x+l.dx*1.6,4.6,l.z+l.dz*1.6,1.1,1,.66,.3)}
  if(nf>.35)for(const v of carsNearTmp(c.x,c.z,45)){const ca=Math.cos(v.a),sa=Math.sin(v.a);wxLp(Math.hypot(v.x-c.x,v.z-c.z)+6,v.x+ca*(v.t.L/2+2.5),.9,v.z+sa*(v.t.L/2+2.5),.8,1,.95,.8);if(v.police&&!v.lightsOff)wxLp(Math.hypot(v.x-c.x,v.z-c.z)+4,v.x,2,v.z,1.2,Math.floor(simT*7)%2?1:.15,.1,Math.floor(simT*7)%2?.15:1)}
  if(nf>.35)for(const ch of city.chunks.values())if(ch.tls)for(const l of ch.tls){const d=Math.hypot(l.hx-c.x,l.hz-c.z);if(d<55){const k=sig(l.kx,l.kz,l.d);if(k<0)continue;const cc=TLC[k];wxLp(d+8,l.hx,5.4,l.hz,.8,cc.r,cc.g,cc.b)}}
  arr.length=WX_LP.n;laneSortD0(arr);for(let i=0;i<12;i++){const a=arr[i];if(a){WX.lights[i].set(a[1],a[2],a[3],a[4]);WX.lcol[i].setRGB(a[5],a[6],a[7])}else WX.lights[i].set(0,-999,0,0)}}
 WX.ind=(WX.ind||0)+(((PL.inside?0:indAt(c0.x,c0.z)))-(WX.ind||0))*Math.min(1,dt*.6);const ind=WX.ind;
 const U=skyMat.uniforms;U.cloud.value=Math.max(ind,city.haze?.7:0)*.86;U.time.value=simT;if(WX.fair===undefined){WX.fair=.35+Math.random()*.5;WX.fairTg=WX.fair;WX.fairT=simT+200*GMIN}if((simT>WX.fairT||simT<WX.fairT-2000*GMIN)&&!netWxFollow()){WX.fairT=simT+(240+Math.random()*600)*GMIN;WX.fairTg=Math.random()<.25?0:.3+.7*Math.pow(Math.random(),1.2)}WX.fair+=(WX.fairTg-WX.fair)*Math.min(1,dt*.012/GMIN);U.fair.value=WX.fair;
 if(st.night)U.cloudCol.value.setRGB(.3,.13,.36);else U.cloudCol.value.setRGB(1,1,1).lerp(U.hor.value,.35).multiplyScalar(1-.86*nf);U.cloudCol.value.multiplyScalar(1-.45*f*(1-.6*(WX.stormAmt||0)));U.cloudCol.value.lerp(_c3.setRGB(.55,.55,.56).multiplyScalar(1-.8*DN.nightF),ind*.6);
 worldCemWx(dt);if(scene.fog){const cf=WLD.cem.f*(camMode==='top'?.5:1);scene.fog.near=st.fogNear*(1-.45*f)*(1-.35*ind)*(1-.8*cf);scene.fog.far=st.fogFar*(1-.28*f)*(1-.25*ind)*(1-.7*cf);captureDrawFogBase()}
 if(city.groundMat){city.groundMat.roughness=.95-.62*f;city.groundMat.metalness=.28*f;city.groundMat.color.setScalar(1-.38*f)}
 if(city.M){city.M.mark.roughness=.8-.5*f;city.M.lglow.color.copy(city.M.lglowBase).multiplyScalar(1+.9*f)}
 rainAudioSet(f);}

/* ================= LIGHTNING ================= */
const LT={t:6,flash:0,seq:[],bolts:[]};
function thunderSound(dist){if(dist<420)setTimeout(()=>rumble(clamp(.8-dist/520,.1,.8),.05,700),Math.min(1500,dist*2.6));if(!AC||!AC._noise)return;const t=AC.currentTime,vol=clamp(1.1-dist/900,.15,1);
 const s=AC.createBufferSource();s.buffer=AC._noise;s.loop=true;s.playbackRate.value=.35;const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.setValueAtTime(dist<250?900:420,t);lp.frequency.exponentialRampToValueAtTime(90,t+2.8);
 const g=AC.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.75*vol,t+.08);for(let k=1;k<5;k++)g.gain.setTargetAtTime(.75*vol*(1-k*.17)*(.6+Math.random()*.6),t+k*.35,.12);g.gain.setTargetAtTime(0,t+1.9,.9);
 s.connect(lp);lp.connect(g);g.connect(master);s.start(t,Math.random()*2);s.stop(t+5.5);
 const o=AC.createOscillator();o.type='sine';o.frequency.setValueAtTime(55,t);o.frequency.exponentialRampToValueAtTime(28,t+2.5);const g2=AC.createGain();g2.gain.setValueAtTime(.5*vol,t);g2.gain.exponentialRampToValueAtTime(.001,t+3);o.connect(g2);g2.connect(master);o.start(t);o.stop(t+3.1)}
function strike(){const inv=S.style==='inverted',cp=camera.position,a=Math.random()*6.283,d=120+Math.random()*520,x=cp.x+Math.cos(a)*d,z=cp.z+Math.sin(a)*d;
 const pts=[];let px=x,pz=z;for(let y=170;y>0;y-=8+Math.random()*10){pts.push(px,y,pz);px+=(Math.random()-.5)*14;pz+=(Math.random()-.5)*14}pts.push(px,0,pz);
 const grp=new THREE.Group();for(const w of [0,.9,-.9]){const g=new THREE.BufferGeometry();const arr=pts.slice();for(let i=0;i<arr.length;i+=3){arr[i]+=w;arr[i+2]+=w*.5}g.setAttribute('position',new THREE.Float32BufferAttribute(arr,3));grp.add(new THREE.Line(g,new THREE.LineBasicMaterial({color:inv?(w?0xff2a3a:0xffd8dc):(w?0xb8c8ff:0xffffff),transparent:true,opacity:w?.55:1,fog:false})))}
 for(let k=0;k<2;k++){const i=3*(2+Math.floor(Math.random()*(pts.length/3-4)));const br=[pts[i],pts[i+1],pts[i+2]];let bx=pts[i],by=pts[i+1],bz=pts[i+2];for(let s=0;s<4;s++){bx+=(Math.random()-.5)*16;by-=10+Math.random()*8;bz+=(Math.random()-.5)*16;br.push(bx,by,bz)}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(br,3));grp.add(new THREE.Line(g,new THREE.LineBasicMaterial({color:inv?0xff4a5a:0xd8e0ff,transparent:true,opacity:.7,fog:false})))}
 scene.add(grp);LT.bolts.push({g:grp,t:.32});LT.seq=[0,.07,.15,.24].map(q=>simT+q);{const broadcast=TVM.on?TVM.saved:null,channel=TVM.kind;setTimeout(()=>{if(broadcast&&(TVM.saved!==broadcast||TVM.kind!==channel))return;thunderSound(d)},Math.min(2600,d/340*1000))}}
function updateLightning(dt){const f=WX.f||0,heavy=WX.storm||0;
 /* v2 r2: Upside Down: raio sem chuva, 1 a 5 por minuto (intervalo 12–60 s, sorteado a cada raio) */
 if(S.style==='inverted'){if(running&&!menuOpen&&!PL.inside&&!INVERT.switching){LT.it=(LT.it==null?8+Math.random()*20:LT.it)-dt;if(LT.it<=0){LT.it=12+Math.random()*48;strike()}}}
 else if(running&&!menuOpen&&(!PL.inside||TVM.on)&&f>.35&&heavy>.3){LT.t-=dt*(.5+heavy);if(LT.t<=0){LT.t=4+Math.random()*9;strike()}}
 let fl=0;for(const q of LT.seq){const d=simT-q;if(d>=0&&d<.06)fl=1}LT.flash+=(fl-LT.flash)*Math.min(1,dt*30);
 for(const b of LT.bolts.slice()){b.t-=dt;b.g.visible=Math.floor(b.t*28)%3!==0;if(b.t<=0){scene.remove(b.g);b.g.traverse(o=>{if(o.geometry&&!o.isSprite)o.geometry.dispose();if(o.material)o.material.dispose()});LT.bolts.splice(LT.bolts.indexOf(b),1)}}
 if(dt>0&&LT.flash>.01){const inv=S.style==='inverted';hemi.intensity+=LT.flash*(inv?.7:1.4);skyMat.uniforms.cloudCol.value.lerp(inv?_c3.setRGB(.9,.22,.24):_c3.setRGB(.95,.95,1),LT.flash*.8)}}

/* ================= POLICE ================= */
const POL={level:0,boomW:0,kills:0,truce:0,wanted:false,escT:0,bustT:0,spawnT:0,seeR:22,escD:500,escTime:0,siren:null};
// Uma viatura estacionada não é testemunha; só policiais patrulhando no trânsito ou a pé.
function policeTrafficCar(c){return !!(c&&c.police&&c.alive&&!c.stationParked&&(c.mode==='rail'||c.ai||c.chase||c.zonePatrol))}
function policeWitness(other){if(other&&other.crim)return;if(MIS.type==='cop'&&other&&!other.police)return;
 if(other&&policeTrafficCar(other)){startWanted();return}
 if(POL.wanted)return;const pc=PL.car||PL;for(const c of vehicles)if(c!==PL.car&&policeTrafficCar(c)&&Math.hypot(c.x-pc.x,c.z-pc.z)<POL.seeR){startWanted();return}}
// Somente policiais efetivamente patrulhando e agentes a pé testemunham crimes.
function copSees(x,z,ignore=null){const R=P/2;for(const c of vehicles)if(c!==ignore&&c!==PL.car&&policeTrafficCar(c)&&Math.hypot(c.x-x,c.z-z)<R)return true;for(const q of peds)if(q.cop&&q.state!=='dead'&&Math.hypot(q.x-x,q.z-z)<R)return true;return false}
function startWanted(force){if(RAMP.on||ONLINE.on)return;if(!force&&simT<POL.truce)return;const wasW=POL.wanted,fz=wasW?null:wzFadeHit();if(!POL.wanted){const pc=PL.car||PL;let best=null,bd=90;for(const c of vehicles)if(c!==PL.car&&policeTrafficCar(c)){const d=Math.hypot(c.x-pc.x,c.z-pc.z);if(d<bd){bd=d;best=c}}for(const q of peds)if(q.cop&&q.state!=='dead'){const d=Math.hypot(q.x-pc.x,q.z-pc.z);if(d<bd){bd=d;best=q}}if(best)say(best,SAY.cop,2.6)}if(!POL.wanted)wzCrime();const pc=PL.car||PL;if(!POL.wanted)toast('<span style="color:#ff4a4a">POLÍCIA</span> <span style="color:#4aa8ff">NA SUA COLA!</span><br><small style="font-size:11px;color:#fff">afaste-se '+wzEscapeDistance()+' m da área do crime</small>');
 if(!POL.wanted){POL.level=1;POL.boomW=0;POL.lvT=0}POL.wanted=true;POL.escT=0;POL.bustT=0;if(PL.heli)wantedUp(3);
 const ps=vehicles.filter(c=>policeTrafficCar(c)&&!c.chase&&c!==PL.car).sort((a,b)=>Math.hypot(a.x-pc.x,a.z-pc.z)-Math.hypot(b.x-pc.x,b.z-pc.z));
 for(const c of ps.slice(0,polCap()))if(Math.hypot(c.x-pc.x,c.z-pc.z)<180)startChase(c);
 if(fz&&fz.lvl>1)wantedUp(fz.lvl)}
function polCap(){const l=POL.level||1;return l>=3?3:l>=2?2:1} // v78: nível 3 = 3 viaturas (+ helicóptero)
function wantedUp(lv){if(!POL.wanted)return;if(lv>(POL.level||1)){POL.level=Math.min(3,lv);POL.lvT=0;POL.boomW=0;toast('<span style="color:#ffd200">'+'★'.repeat(POL.level)+'</span> NÍVEL '+POL.level+'<br><small style="font-size:11px;color:#fff">'+(POL.level===2?'mais uma viatura na perseguição':'helicóptero da polícia no ar · ele atira!')+'</small>');const pc=PL.car||PL;const ps=vehicles.filter(c=>policeTrafficCar(c)&&!c.chase&&!c.blitz&&c!==PL.car).sort((a,b)=>Math.hypot(a.x-pc.x,a.z-pc.z)-Math.hypot(b.x-pc.x,b.z-pc.z));for(const c of ps.slice(0,polCap()-vehicles.filter(c=>c.chase&&c.alive&&!c.target&&!c.loan).length))if(Math.hypot(c.x-pc.x,c.z-pc.z)<200)startChase(c)}}
function polTgt(){return PL.inside==='mall'&&MALL.out?MALL.out:(PL.car||PL)}
function startChase(c){if(c.mode==='rail')toPhys(c);c.chase=true;if(c.police||c.polBoat){c.lightsOff=false;c.sirenOn=true;c.stationParked=false}c.ai=null;c.sleep=false;c.hand=false;c.path=null;c.pathT=0;c.stuckT=0;c.revT=0}
function registerKill(p,byPlayer){if(byPlayer&&p&&p.gangT!==undefined&&!p.raid){const t=GANG.T.find(t=>t.g===p.gangT&&t.peds.includes(p));if(t){t.byPl++;t.hot=true}}if(!byPlayer||(p&&(p.demo||p.gang||p.tommy!==undefined||p.scnBad)))return;
 if(p.x9){x9Silenced();return}
 if(p.cop){if(!POL.wanted)startWanted(true)}
 else if(PL.inside&&PL.inside!=='jail'){if(!POL.wanted){startWanted(true);toast('<span style="color:#ff4a4a">ASSASSINATO EM LOCAL FECHADO</span>')}}
 else if(PL.car&&!PL.car.t.boat){POL.runKills=(POL.runKills||0)+1;if(POL.runKills>=5){POL.runKills=0;if(!POL.wanted){startWanted(true);toast('A POLÍCIA FOI CHAMADA<br><small style="font-size:11px;color:#fff">'+translatePlain('5 pedestres atropelados')+'</small>')}}} /* v1r17: 5 atropelados (contados à parte) = polícia */
 else{POL.kills++;if(POL.kills>=5){POL.kills=0;if(!POL.wanted&&!X9.p&&!x9Start()){startWanted(true);toast('A POLÍCIA FOI CHAMADA')}}}} /* v1r21: 5 mortos a pé → X9 */
/* v1r21: X9 — após 5 mortes a pé, o pedestre comum mais perto vira dedo-duro: balão, pisca vermelho no radar e liga pra polícia; 10 s pra calar ele ou vem 1 estrela */
const X9={p:null,t:0,sayT:0};
const X9_LINES=['ALÔ, POLÍCIA? TEM UM MALUCO AQUI!','ALÔ? 190? CORRE PRA CÁ!','ELE TÁ MATANDO TODO MUNDO!','TÔ VENDO ELE AGORA, MOÇO!','ANOTA A PLACA AÍ, SEU GUARDA!'];
function x9Ok(q){return q&&q.state!=='dead'&&!q.cop&&!q.gang&&!q.demo&&!q.balcony&&!q.fixed&&!q.resPath&&!q.clubType&&!q.skb&&!q.crim&&q.tommy===undefined&&(q.fin===undefined||q.fin>=1)}
function x9Start(){if(ONLINE.on||profInMission()||(S.style!=='modern'&&S.style!=='synthwave')||city.haze)return false; /* r56: X9 só no modo livre (nada de testemunha no online, nas missões nem nos mundos especiais) */let best=null,bd=70;for(const q of peds){if(!x9Ok(q))continue;const d=Math.hypot(q.x-PL.x,q.z-PL.z);if(d<bd){bd=d;best=q}}if(!best)return false;
 X9.p=best;X9.t=10;X9.sayT=0;best.x9=true;best.strip=null;try{dropUmbrella(best)}catch(e){}
 toast('<span style="color:#ff4a4a">'+translatePlain('TEM UM X9 NA ÁREA!')+'</span><br><small style="font-size:11px;color:#fff">'+translatePlain('ele tá ligando pra polícia · 10 s pra calar ele')+'</small>');return true}
function x9Clear(){if(X9.p)X9.p.x9=false;X9.p=null;X9.t=0}
function x9Silenced(){x9Clear();POL.kills=0;toast('<span style="color:#7dff7a">'+translatePlain('X9 SILENCIADO')+'</span>')}
function x9Tick(dt){const q=X9.p;if(!q)return;if(POL.wanted||PL.dead){x9Clear();return}if(q.state==='dead'){x9Clear();return}
 X9.t-=dt;const gone=!peds.includes(q);
 if(!gone){const dx=q.x-PL.x,dz=q.z-PL.z,d=Math.hypot(dx,dz)||1;q.state='flee';q.timer=1;q.rot=0;const sp=d<14?4.2:2.4;q.vx=dx/d*sp;q.vz=dz/d*sp;
  X9.sayT-=dt;if(X9.sayT<=0){X9.sayT=2.6;say(q,translatePlain(X9_LINES[Math.floor(Math.random()*X9_LINES.length)])+' ('+Math.max(1,Math.ceil(X9.t))+')',2.5)}}
 if(X9.t<=0||gone){x9Clear();startWanted(true);toast('<span style="color:#ff4a4a">'+translatePlain('O X9 CHAMOU A POLÍCIA')+'</span>')}}
function endWanted(silent,quiet){if(!silent&&POL.wanted)wzEscape();else{WZ.crime=null;WZ.fromZone=null;WZ.list.length=0}POL.wanted=false;POL.level=0;POL.boomW=0;POL.escT=0;for(const c of vehicles)if(c.alive&&c.chase&&!c.target&&!c.loan){c.chase=false;c.thr=0;c.ai={kx:0,kz:0,d:0,li:0,nd:null,vmax:c.vmax,stun:0,blockT:0,ignore:0};if(!reacquire(c)){c.ai=null;c.hand=true}}
 if(!silent&&!quiet)toast('A POLÍCIA DESISTIU')}
function nodeOf(x,z){const N=city.N;return[clamp(Math.round(x/P),0,N),clamp(Math.round(z/P),0,N)]}
function bfsNext(a,b,mao){const N=city.N,key=(x,z)=>x*64+z;if(a[0]===b[0]&&a[1]===b[1])return null;const prev=new Map([[key(a[0],a[1]),-1]]);const q=[a];
 while(q.length){const n=q.shift();if(n[0]===b[0]&&n[1]===b[1])break;for(let d=0;d<4;d++){if(mao?!canDrive(n[0],n[1],d):(!segExists(n[0],n[1],d)||obraClosed(n[0],n[1],d)))continue;const m=[n[0]+D[d][0],n[1]+D[d][1]],k=key(m[0],m[1]);if(prev.has(k))continue;prev.set(k,n);q.push(m)}}
 let cur=b;if(!prev.has(key(b[0],b[1])))return null;const path=[cur];while(true){const p=prev.get(key(cur[0],cur[1]));if(p===-1||!p)break;path.push(p);cur=p}path.reverse();return path}
function aheadNode(c){const N=city.N,ca=Math.cos(c.a),sa=Math.sin(c.a),kx=Math.round(c.x/P),kz=Math.round(c.z/P);
 const onV=Math.abs(c.x-kx*P)<RW/2+2,onH=Math.abs(c.z-kz*P)<RW/2+2;let cands=[];
 if(onV&&onH)cands=[[kx,kz]];else if(onV)cands=[[kx,Math.floor(c.z/P)],[kx,Math.ceil(c.z/P)]];else if(onH)cands=[[Math.floor(c.x/P),kz],[Math.ceil(c.x/P),kz]];else cands=[[kx,kz]];
 cands=cands.map(n=>[clamp(n[0],0,N),clamp(n[1],0,N)]);let best=cands[0],bs=-1e9;for(const n of cands){const ex=n[0]*P-c.x,ez=n[1]*P-c.z,l=Math.hypot(ex,ez)||1,sc=(ex*ca+ez*sa)/l;if(sc>bs){bs=sc;best=n}}return best}
function policeDrive(c,dt){if(!c.alive){c.thr=0;return}
  if(c.playerStolen){c.thr=0;c.hand=true;c.steerT=0;return} // v78k: viatura roubada pelo jogador fica parada quando ele desce
 if(c.copsOut&&c.copsOut.length){c.thr=0;c.hand=true;c.steerT=0;return}
 {const pt=polTgt();if((c.copsAboard??2)>0&&!c.target&&!PL.car&&!PL.dead&&Math.hypot(pt.x-c.x,pt.z-c.z)<17&&Math.abs(c.fwd)<3.5&&simT>(c.nextDeploy||0)){c.nextDeploy=simT+20;deployCops(c);c.thr=0;c.hand=true;return}}
 if(c.target&&(!c.target.alive||!vehicles.includes(c.target))){c.chase=false;c.target=null;c.thr=0;c.hand=true;return}const tgt=c.target||polTgt(),tx=tgt.x+(tgt.vx||0)*.5,tz=tgt.z+(tgt.vz||0)*.5,dist=Math.hypot(tx-c.x,tz-c.z);let wx=tx,wz=tz,turnAhead=0;
 const ca=Math.cos(c.a),sa=Math.sin(c.a);
 if(dist>30){c.pathT-=dt;if(c.pathT<=0||!c.path||!c.path.length){c.pathT=.8;const a=aheadNode(c);c.path=bfsNext(a,nodeOf(tx,tz))||[a]}
  while(c.path.length){const n=c.path[0],ex=n[0]*P-c.x,ez=n[1]*P-c.z,d=Math.hypot(ex,ez);if(d<7||(d<22&&ex*ca+ez*sa<0))c.path.shift();else break}
  if(c.path.length){const n=c.path[0];wx=n[0]*P;wz=n[1]*P;
   if(c.path.length>1){const m=c.path[1],ax=n[0]*P-c.x,az=n[1]*P-c.z,bx=m[0]-n[0],bz=m[1]-n[1],la=Math.hypot(ax,az)||1;turnAhead=Math.abs((ax*bz-az*bx)/la)>.5&&la<34?1:0}}}
 if(dist>12&&(!c.path||!c.path.length||dist<=30)&&groundY(tx,tz)>0){const kx=Math.round(tx/P),kz=Math.round(tz/P);if(Math.abs(tx-kx*P)<Math.abs(tz-kz*P)){wx=kx*P;wz=tz}else{wx=tx;wz=kz*P}}
 const ex=wx-c.x,ez=wz-c.z,lx=ex*ca+ez*sa,lz=-ex*sa+ez*ca,ang=Math.atan2(lz,lx);
 if(c.revT>0){c.revT-=dt;c.thr=-1;c.steerT=-(Math.sign(ang)||1);c.hand=false;return}
 c.steerT=clamp(ang/(c.t.steer*.75),-1,1);const sp=c.fwd;
 c.thr=Math.abs(ang)>1.4?.35:turnAhead&&sp>13?-.6:1;c.hand=Math.abs(ang)>1.0&&sp>10;
 if(sp<1.5&&c.thr>0){c.stuckT+=dt;if(c.stuckT>1.2){c.revT=1;c.stuckT=0}}else c.stuckT=Math.max(0,c.stuckT-dt*2)}
/* v3 r5: cópia da lista num array reaproveitado (cada ponto de uso tem o seu buffer); substitui vehicles.slice() por quadro */
function listSnap(buf,src){buf.length=0;for(let i=0;i<src.length;i++)buf.push(src[i]);return buf}
const POL_SNAP=[],PARKV_SNAP=[],POLB_SNAP=[],POL_CHASERS=[];
function updatePolice(dt){const pc=PL.car||PL;
 // v227: interiores são coordenadas isoladas. A polícia não perde o jogador
 // por uma falsa fuga de 500m nem tenta criar viaturas dentro da maquete.
 if(PL.inside){POL.bustT=0;return}
 if(!POL.wanted){
  POL.spawnT-=dt;
  // Viaturas de busca local ficam restritas ao raio do crime, sem perseguir o jogador.
  for(const c of listSnap(POL_SNAP,vehicles))if(c.zonePatrol){
   const z=WZ.list.includes(c.zonePatrol)?c.zonePatrol:undefined;
   if(!z||Math.hypot(c.x-z.x,c.z-z.z)>z.r+35){if(c!==PL.car)removeVehicle(c);else c.zonePatrol=null}
  }
  if(POL.spawnT<=0&&WZ.list.length){
   POL.spawnT=5;
   for(const z of WZ.list){
    if(Math.hypot(pc.x-z.x,pc.z-z.z)>3*P)continue;
    if(vehicles.filter(c=>c.zonePatrol===z&&c.alive).length>=3)continue;
    const c=spawnPoliceCar(15,z.r*.85,z);
    if(c)c.zonePatrol=z;
   }
  }
  return;
 }
 const inMall=PL.inside==='mall'&&!!MALL.out,pw=inMall?MALL.out:PL.inside==='bank'&&bankDoor()?bankDoor():pc;
 const chasers=POL_CHASERS;chasers.length=0;for(let i=0;i<vehicles.length;i++){const c=vehicles[i];if(c.chase&&c.alive&&!c.target)chasers.push(c)}let md=1e9;for(const c of chasers)md=Math.min(md,Math.hypot(c.x-pw.x,c.z-pw.z));
 // A fuga agora depende da distancia ao LOCAL DO CRIME, nao da viatura.
 if(WZ.crime&&Math.hypot(pw.x-WZ.crime.x,pw.z-WZ.crime.z)>wzEscapeDistance()){endWanted();return}
 const psp=PL.car?Math.abs(PL.car.fwd):Math.hypot(PL.vx,PL.vz);
 let copNear=false;for(let i=0;i<peds.length;i++){const q=peds[i];if(q.cop&&q.state==='cop'&&Math.hypot(q.x-PL.x,q.z-PL.z)<2.2){copNear=true;break}}
 if(!PL.dead&&psp<1.8&&(inMall?copNear:PL.car?md<7.5:(md<3.5||copNear))){POL.bustT+=dt;if(POL.bustT>2.4)busted()}else POL.bustT=Math.max(0,POL.bustT-dt);
 copCarShoot(chasers,dt);
 POL.spawnT-=dt;if(POL.spawnT<=0){POL.spawnT=4;if(chasers.length<polCap()&&!(PL.car&&PL.car.t.boat)&&!PL.heli){const c=spawnPoliceCar(90,160);if(c)startChase(c)}}}
// Disfarce comprado (roupa ou pintura) com a polícia na cola: a perseguição vira busca na área do crime.
// Provador e oficina pausam a simulação, então a compra nunca é interrompida pela polícia.
// Na zona, as regras de reconhecimento seguem as mesmas (1 indicador = 1 minuto; nenhum = busca encerrada).
function wzDisguise(){if(!POL.wanted)return;
 const c=WZ.crime,fullyChanged=c&&!c.looks.has(lookKey())&&!c.cars.has(wzCarKey());
 if(fullyChanged){endWanted(true,true);toast('DISFARCE COMPLETO · BUSCA E PERSEGUIÇÃO ENCERRADAS')}
 else endWanted(false,true);
}
function busted(){STATS.arrests++;if(!PROLOGUE.active)newsAdd('busted',{lv:POL.level||1});if(storyMissionFail('VOCÊ FOI PRESO'))return;POL.bustT=0;endWanted(true);POL.wanted=false;PL.jail=false;PL.dead=false;$('#ko').hidden=true;$('#ko').textContent='NOCAUTE';jailEnter(true)}
function spawnPoliceCar(minD,maxD,center){const pc=center||polTgt(),N=city.N;
 const r=Math.ceil(maxD/P)+1,cx=Math.round(pc.x/P),cz=Math.round(pc.z/P);
 for(let k=0;k<80;k++){const kx=clamp(cx+Math.floor(R2()*(2*r+1))-r,0,N),kz=clamp(cz+Math.floor(R2()*(2*r+1))-r,0,N),d=Math.floor(R2()*4);if(!segExists(kx,kz,d)||obraClosed(kx,kz,d)||!laneValid(kx,kz,d,0))continue;
  const s=RW/2+4+R2()*(SEG_END-RW/2-8),p=lanePt(kx,kz,d,0,s),dd=Math.hypot(p[0]-pc.x,p[1]-pc.z);if(dd<minD||dd>maxD)continue;
  if(carsNear(p[0],p[1],6).length)continue;return makeRailCar(kx,kz,d,0,s,'police')}return null}
// Buzina do jogador: uma voz só, sustentada enquanto o botão estiver pressionado (nunca empilha).
// Nas ambulancias, toques curtos: giroflex -> giroflex + sirene -> desligado.
// Nas viaturas e lanchas policiais, o toque alterna os dois juntos; segurar toca a buzina.
const HORN={held:false,src:null,t0:0,police:false,voice:null,relT:0};
function hornVoiceOn(){if(!AC||HORN.voice)return;const t=AC.currentTime,g=AC.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.126,t+.02);
 const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=900;lp.Q.value=1.2;const pk=AC.createBiquadFilter();pk.type='peaking';pk.frequency.value=320;pk.gain.value=6;g.connect(lp);lp.connect(pk);pk.connect(master);
 const os=[196,247].map(f=>{const o=AC.createOscillator();o.type='sawtooth';o.frequency.value=f;o.detune.value=(Math.random()-.5)*14;o.connect(g);o.start(t);return o});HORN.voice={g,os}}
function hornVoiceOff(){clearTimeout(HORN.relT);const v=HORN.voice;HORN.voice=null;if(!v||!AC)return;const t=AC.currentTime;v.g.gain.cancelScheduledValues(t);v.g.gain.setValueAtTime(v.g.gain.value,t);v.g.gain.setTargetAtTime(0,t,.05);for(const o of v.os)o.stop(t+.35)}
function hornDown(src){initAudio();if(HORN.held||!PL.car)return;clearTimeout(HORN.relT);HORN.held=true;HORN.src=src;HORN.t0=performance.now();HORN.police=!!((PL.car.police||PL.car.ambulance||PL.car.polBoat)&&PL.car.alive);if(!HORN.police)hornVoiceOn()}
function hornUp(src){if(!HORN.held||(src&&HORN.src!==src))return;HORN.held=false;
 if(HORN.police&&!HORN.voice){togglePoliceLights();return}
 const left=180-(performance.now()-HORN.t0);if(left>0){clearTimeout(HORN.relT);HORN.relT=setTimeout(hornVoiceOff,left)}else hornVoiceOff()}
function hornTick(){if(!HORN.held)return;if(!PL.car||PL.dead||menuOpen){HORN.held=false;hornVoiceOff();return}if(HORN.police&&!HORN.voice&&performance.now()-HORN.t0>260)hornVoiceOn()}
function togglePoliceLights(){
 const c=PL.car;if(!(c?.police||c?.ambulance||c?.polBoat)||!c.alive)return;
 initAudio();if(c.ambulance){// ambulância: toque curto alterna desligado → giroflex → giroflex + sirene
  if(c.lightsOff===undefined||c.lightsOff){c.lightsOff=false;c.sirenOn=false;toast('GIROFLEX LIGADO<br><small style="font-size:11px;color:#fff">toque de novo para a sirene</small>')}else if(!c.sirenOn){c.sirenOn=true;toast('GIROFLEX + SIRENE')}else{c.lightsOff=true;c.sirenOn=false;toast('GIROFLEX / SIRENE DESLIGADOS')}return}
 c.lightsOff=!c.lightsOff;c.sirenOn=!c.lightsOff;
 toast(c.lightsOff?'SIRENE / GIROFLEX DESLIGADOS':'SIRENE / GIROFLEX LIGADOS');
}
function policeVisual(c){if(!c.lb)return;if(c.lightsOff){c.lb[0].material.color.setHex(0x3a0808);c.lb[1].material.color.setHex(0x0a1440);if(c.lbGlow)c.lbGlow.visible=false;return}const ph=Math.floor((simT+c.id*.37)*7)%2;
 c.lb[0].material.color.setHex(ph?0xff2020:0x3a0808);c.lb[1].material.color.setHex(ph?0x0a1440:0x2a6aff);
 if(c.lbGlow){c.lbGlow.visible=true;c.lbGlow.material.opacity=c.chase?.5:.26;c.lbGlow.material.color.setHex(ph?0xff2020:0x2a6aff)}}
function sirenUpdate(){if(!AC)return;if(!POL.siren){try{const o=AC.createOscillator();o.type='triangle';o.frequency.value=900;const lfo=AC.createOscillator();lfo.frequency.value=.55;const lg=AC.createGain();lg.gain.value=320;lfo.connect(lg);lg.connect(o.frequency);
  const o2=AC.createOscillator();o2.type='square';o2.frequency.value=1;const g=AC.createGain();g.gain.value=0;const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=2600;
  const pn=AC.createPanner();pn.panningModel='HRTF';pn.distanceModel='inverse';pn.refDistance=8;pn.rolloffFactor=1;o.connect(f);f.connect(g);g.connect(pn);pn.connect(master);o.start();lfo.start();POL.siren={g,pn}}catch(e){return}}
 const pc=PL.car||PL;let best=null,bd=1e9;for(const c of vehicles)if((c.chase||c.polBoat||c.bench&&c.police&&c.sirenOn||c===PL.car&&(c.police||c.ambulance)&&c.sirenOn||c.npcAmb&&c!==PL.car)&&c.alive&&!c.target&&!c.lightsOff){const d=Math.hypot(c.x-pc.x,c.z-pc.z);if(d<bd){bd=d;best=c}}
 const t=AC.currentTime;POL.siren.g.gain.setTargetAtTime(best&&!menuOpen&&!STORYFAIL.active&&!STORYINTRO.active?.16:0,t,.15);
 if(best){const pn=POL.siren.pn;if(pn.positionX){pn.positionX.value=best.x;pn.positionY.value=1.5;pn.positionZ.value=best.z}else pn.setPosition(best.x,1.5,best.z)}
}

/* ================= DAY / NIGHT (Modern only) ================= */
const DN={tod:8*60,nightF:0,t:0};
const SKYK_S=[[0,'#07031a','#b0205e'],[4.8,'#140630','#d0306e'],[6,'#3a1a7a','#ff7a5a'],[7.4,'#3b3aa8','#ff8fb8'],[12,'#4a52c0','#ff9cc4'],[16.6,'#3b3aa8','#ff8fb8'],[18.1,'#2a1466','#e8604a'],[19.4,'#120630','#d8306e'],[24,'#07031a','#b0205e']]; // v77 outrun
const SKYK=[[0,'#101c44','#2a3c66'],[4.8,'#16224a','#34405f'],[5.7,'#2e3478','#a8486a'],[6.3,'#5a5aa8','#ff7a34'],[7.3,'#6fa6de','#e8d6c0'],[16.4,'#6fa6de','#d4e4ef'],[17.2,'#9aa4c8','#f2b878'],[17.8,'#8a7cb8','#ff9a40'],[18.4,'#5a4aa8','#ff6a28'],[18.9,'#3a3290','#e8482a'],[19.5,'#1a2652','#4a3462'],[24,'#101c44','#2a3c66']]; /* v78: noite menos preta (céu azul-petróleo legível) */
const _v4=new THREE.Vector3(),_c1=new THREE.Color(),_c2=new THREE.Color(),_c3=new THREE.Color(),_c4=new THREE.Color();
function skyAt(h,top,hor){const K=STYLES[S.style].night?SKYK_S:SKYK;for(let i=0;i<K.length-1;i++){const a=K[i],b=K[i+1];if(h>=a[0]&&h<=b[0]){const t=(h-a[0])/(b[0]-a[0]);top.set(a[1]).lerp(_c3.set(b[1]),t);hor.set(a[2]).lerp(_c4.set(b[2]),t);return}}}
const MOON=[{n:'LUA NOVA',w:0,light:1.25,ic:'🌑'},{n:'LUA CRESCENTE',w:-.5,light:1.875,ic:'🌓'},{n:'LUA CHEIA',w:1,light:2.5,ic:'🌕'},{n:'LUA MINGUANTE',w:.5,light:1.875,ic:'🌗'}];
function moonPhase(){return(((DN.day||0)+(S.seed|0))%4+4)%4}
const ECLIPSE={on:false,stage:'',t:0,dark:0,sep:.12,fade:0};
function eclipseStart(){if(city.haze||S.style==='inverted'){toast('ECLIPSE · VOLTE PARA SUNSET SHORES');return;}if(ECLIPSE.on)return;
 Object.assign(ECLIPSE,{on:true,stage:'clock',t:0,dark:0,sep:.12,fade:0,from:DN.tod,advance:(660-DN.tod+1440)%1440,day:DN.day||0,style:S.style,seed:S.seed});}
function eclipseCoverage(separation){const r=.0308,m=.030,d=Math.abs(separation);if(d>=r+m)return 0;if(d<=r-m)return m*m/(r*r);const a=Math.acos(clamp((d*d+r*r-m*m)/(2*d*r),-1,1)),b=Math.acos(clamp((d*d+m*m-r*r)/(2*d*m),-1,1));return (r*r*a+m*m*b-.5*Math.sqrt(Math.max(0,(-d+r+m)*(d+r-m)*(d-r+m)*(d+r+m))))/(Math.PI*r*r);}
function eclipseDarkness(separation){const c=eclipseCoverage(separation),max=.030*.030/(.0308*.0308),v=clamp((c-.5)/(max-.5),0,1);return v*v*v;}
function eclipseStep(dt){const e=ECLIPSE;if(!e.on)return dt;if(e.style!==S.style||e.seed!==S.seed){e.on=false;e.dark=0;skyMat.uniforms.eclipse.value.set(0,0,0,0);return dt;}e.t+=dt;
 const smooth=v=>{v=clamp(v,0,1);return v*v*(3-2*v);};
 if(e.stage==='clock'){e.fade=smooth(e.t/10);DN.tod=(e.from+e.advance*smooth(e.t/10))%1440;if(e.t>=10){DN.tod=660;if(e.from>660)DN.day=e.day+1;e.stage='rise';e.t=0;}return 0;}
 if(e.stage==='rise'){e.fade=1;e.sep=.12+(1-smooth(e.t/60))*.9;if(e.t>=60){e.stage='cross';e.t=0;}}
 else if(e.stage==='cross'){e.sep=.12*(1-smooth(e.t/120));e.dark=eclipseDarkness(e.sep);if(e.t>=120){e.stage='total';e.t=0;e.sep=0;e.dark=1;}}
 else if(e.stage==='total'){e.sep=0;e.dark=1;if(e.t>=60){e.stage='separate';e.t=0;}}
 else if(e.stage==='separate'){e.sep=-.12*smooth(e.t/120);e.dark=eclipseDarkness(e.sep);if(e.t>=120){e.stage='set';e.t=0;}}
 else if(e.stage==='set'){e.sep=-.12-smooth(e.t/30)*1.1;e.fade=1-smooth(e.t/30);e.dark=0;if(e.t>=30){e.on=false;e.fade=0;e.dark=0;skyMat.uniforms.sunDim.value=1;}}
 return e.stage==='total'?0:(e.stage==='cross'||e.stage==='separate')?dt*.5:dt;
}
// v78: o pôr do sol é sempre para o lado do mar: o caminho do sol gira por cidade para que o poente caia numa faixa de 45° (±22,5°)
// centrada na direção da praia (sorteio fixo pela seed). Só gira o azimute — altura, horários, luz e shader continuam iguais.
function sunRot(x,y,z){const cs=city.coast;if(cs==null)return[x,y,z];const key=S.seed+':'+cs;if(DN._srK!==key){DN._srK=key;const sea=cs===0?[0,-1]:cs===1?[0,1]:cs===2?[-1,0]:[1,0],off=(mulberry32((S.seed^0x51a7c0)>>>0)()-.5)*Math.PI/4;
 const a=Math.atan2(sea[1],sea[0])+off-Math.atan2(-.38,-.85);DN._src=Math.cos(a);DN._srs=Math.sin(a)}const c=DN._src,s2=DN._srs;return[x*c-z*s2,y,x*s2+z*c]}
function updateDayNight(dt,force){dt=eclipseStep(dt);if(ECLIPSE.on)force=true;const st=STYLES[S.style];const clk=$('#clock');
 const frozen=st.freezeTod!==undefined;
 if(frozen){DN.tod=st.freezeTod;DN.day=0}
 else {const pt=DN.tod;DN.tod=(DN.tod+dt/GMIN)%1440;if(pt<720&&DN.tod>=720){DN.day=(DN.day||0)+1}
  if(played&&pt<1110&&DN.tod>=1110&&!st.night){const m=MOON[moonPhase()];toast(m.ic+' HOJE À NOITE: '+m.n,'wx',4.5)}}const h=DN.tod/60;const ph=(h-6)/12*Math.PI,elev=Math.sin(ph);
 const dayF=clamp((elev+.12)/.37,0,1)*(1-ECLIPSE.dark),nf=1-dayF;DN.nightF=nf;
 const hh=Math.floor(h),mm=Math.floor(DN.tod%60);{const t=String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0');if(clk){clk.hidden=true;if(clk.textContent!==t)clk.textContent=t}}updateCityClock();
 DN.accDt=(DN.accDt||0)+Math.max(0,dt||0);DN.t-=dt;if(DN.t>0&&!force)return;DN.t=.25;
 // sun / moon
 let dir;if(elev>-.05){dir=new THREE.Vector3(...sunRot(Math.cos(ph)*.85,Math.max(.08,elev),-.38)).normalize()}else dir=new THREE.Vector3(...sunRot(.35,.9,.4)).normalize();
 {const mph=ph+Math.PI,mel=Math.sin(mph);const ph4=moonPhase();{const mr=sunRot(Math.cos(mph)*.85,mel,.38);skyMat.uniforms.moonD.value.set(mr[0],mr[1],mr[2],MOON[ph4].w)}
  if(elev<=-.05){const lw=MOON[ph4].light;if(mel>.08)dir=new THREE.Vector3(...sunRot(Math.cos(mph)*.85,mel,.38)).normalize();DN.moonL=lw}else DN.moonL=1}
 {const ph=moonPhase(),factor=ph===0?0:ph===2?1:.5,visible=skyReflectionVisibility(),spec=(elev<=-.05?factor*1.25/MOON[ph].light:1)*visible;
  if(city.waterMat?.userData.moonShader)city.waterMat.userData.moonShader.uniforms.moonReflect.value=spec;
  if(city.M?.water?.userData.celestialShader)city.M.water.userData.celestialShader.uniforms.celestialSpec.value=spec;
 }city.sunOff=[dir.x*150,dir.y*150,dir.z*150];skyMat.uniforms.sunDir.value.set(...sunRot(Math.cos(ph)*.85,elev,-.38));skyMat.uniforms.night.value=nf;meteorTick(dt,nf);
 if(st.night&&elev<.08)skyMat.uniforms.sunDir.value.lerp(_v4.set(-1,.11,0),clamp((.08-elev)/.25,0,1));
 const low=clamp(1-elev*2.2,0,1),SY=st.night;sun.color.set(SY?'#ffd9ec':'#fff0d8').lerp(_c1.set(SY?'#ff6aa0':'#ff8a3a'),low*dayF).lerp(_c2.set(SY?'#b09aff':'#8aa0ff'),nf);
 sun.intensity=(.98*clamp(elev*3.5,0,1)+.27*nf*(DN.moonL==null?1:DN.moonL))*(1-Math.max(.7*WX.f,.77*(WX.gloom||0)))*(1-.55*WLD.cem.f)*(1-.22*clamp(WX.ind||0,0,1)); /* v3 r12: zona industrial sempre um pouco mais escura */
 hemi.intensity=(.2+.38*dayF+.21*nf*(DN.moonL==null?1:DN.moonL))*(1-Math.max(.22*WX.f,.26*(WX.gloom||0)))*(1-.3*WLD.cem.f)*(1-.08*clamp(WX.ind||0,0,1));hemi.color.set(SY?'#c8b8ff':'#dde9ff').lerp(_c1.set(SY?'#5a3aa8':'#5266a0'),nf);ACTOR_LIGHT.value.copy(hemi.color).multiplyScalar(hemi.intensity*.9).add(_c1.copy(sun.color).multiplyScalar(sun.intensity*.65));ACTOR_LIGHT.value.r=clamp(ACTOR_LIGHT.value.r,.08,1);ACTOR_LIGHT.value.g=clamp(ACTOR_LIGHT.value.g,.08,1);ACTOR_LIGHT.value.b=clamp(ACTOR_LIGHT.value.b,.08,1);hemi.groundColor.set(SY?'#5a4a6a':'#5f564c').lerp(_c2.set(SY?'#1a0c28':'#232838'),nf);
 skyAt(h,skyMat.uniforms.top.value,skyMat.uniforms.hor.value);{const gf=Math.max(city.haze?.8:0,WX.f*(1-.7*(WX.stormAmt||0)));skyMat.uniforms.top.value.lerp(_c1.set(nf>.5?'#15171e':'#6a7078'),gf*.65);skyMat.uniforms.hor.value.lerp(_c2.set(nf>.5?'#24262e':'#9aa0a6'),gf*.6)}
 {const e=ECLIPSE,u=skyMat.uniforms;u.eclipse.value.set(e.on?1:0,e.sep,e.dark,e.fade);u.eclipsePrep.value=e.stage==='clock'?clamp(e.t/10,0,1):1;
  if(e.on){
   const sd=u.sunDir.value.clone().normalize(),axis=new THREE.Vector3(-sd.z,0,sd.x).normalize(),md=sd.clone().addScaledVector(axis,e.sep).normalize();if(e.stage==='clock')md.copy(sd).multiplyScalar(-1);if(e.stage==='rise'){const k=clamp(e.t/60,0,1);md.lerp(new THREE.Vector3(-sd.x,-.8,-sd.z).normalize(),1-k).normalize();}if(e.stage==='set')md.lerp(new THREE.Vector3(-sd.x,-.8,-sd.z).normalize(),clamp(e.t/30,0,1)).normalize();u.moonD.value.set(md.x,md.y,md.z,0);
   sun.intensity*=1-e.dark*.97;hemi.intensity*=1-e.dark*.30;
   const topNight=new THREE.Color(),horNight=new THREE.Color();skyAt(0,topNight,horNight);u.top.value.lerp(topNight,e.dark*.92);u.hor.value.lerp(new THREE.Color('#b37565'),e.dark*.45).lerp(horNight,e.dark*.48);
  }
 }
 const fc=_c1.copy(skyMat.uniforms.hor.value).lerp(_c2.set(st.fog),dayF*.6);if(WLD.cem.f>.003)fc.lerp(_c2.set(nf>.5?'#1a1c24':'#7d838a'),WLD.cem.f*.85);if(scene.fog)scene.fog.color.copy(fc);scene.background.copy(fc).multiplyScalar(.85);
 if(city.wallMat)city.wallMat.emissiveIntensity=st.noWindows?0:Math.max(0,(nf-.25)/.75)*(SY?1.25:1.15);
 if(INST.beam)INST.beam.material.opacity=st.noLamps?0:.2*clamp((nf-.3)/.5,0,1);
 /* v1r4: tempestade de dia — passou de 50% de céu fechado (WX.cover) e a luz caindo (WX.gloom), os POSTES acendem aos poucos (limites .3–.7 por poste); janelas dos prédios seguem só a noite (nf) */
 /* v2 r6: o pedido é começar a acender com 75% do céu fechado e estar tudo aceso quando a chuva começa (90%, ~4 s depois).
    O passo antes era por QUADRO (+.003): a 20–30 fps os postes acendiam ~10 s atrasados, junto com a chuva. Agora é por segundo. */
 const sTg=clamp(((WX.cover||0)-.75)/.15,0,1)*clamp((WX.gloom||0)/.45,0,1)*.95,sDt=Math.min(.6,DN.accDt||0);DN.accDt=0;DN.sL=(DN.sL||0)+clamp(sTg-(DN.sL||0),-.25*sDt,.45*sDt); /* o bloco roda a cada .25 s: usa o tempo acumulado, não o dt do quadro */ /* v1r5: sobe no ritmo do anoitecer (~.012/s, a faixa .3–.7 dos postes leva ~35 s) → acendem um a um, como à noite */
 const lampF=Math.max(nf,DN.sL);LAMPF=lampF;
 for(const chk of city.chunks.values()){const IM=chk.lampIM;if(!IM)continue;let chg=false;for(const l of chk.lamps){if(l.broken)continue;const on=st.noLamps?false:(lampF>l.th&&!jammerBlocked(l.x,l.z));if(on!==l.on){l.on=on;chg=true;IM.head.setColorAt(l.i,on?LAMP_ON:LAMP_OFF);IM.glow.setMatrixAt(l.i,on&&S.lampLighting!==false?lampGlowM(l):ZM)}}
  if(chg){IM.head.instanceColor.needsUpdate=true;IM.glow.instanceMatrix.needsUpdate=true}}
 if(city.M)city.M.hwin.emissiveIntensity=st.noWindows?0:Math.max(0,(nf-.3)/.7)*.9;{const k=st.noWindows?0:Math.max(0,(nf-.25)/.6);if(city.M&&city.M.neonDN&&!st.noWindows){const v=.42+.58*Math.min(1,k);city.M.neonDN.color.setRGB(v,v,v)}for(const m of DN_SIGNS)m.emissiveIntensity=(m.userData.dnK||.5)*Math.min(1,k)}if(city.M&&city.M.hwinSoft)city.M.hwinSoft.emissiveIntensity=city.M.hwin.emissiveIntensity*.28;}

/* ================= FIRE & EXPLOSIONS ================= */
const boomLight=new THREE.PointLight(0xff9040,0,55,2);boomLight.visible=true;scene.add(boomLight);let boomT=0,shake=0;
const burntMat=new THREE.MeshStandardMaterial({color:0x1d1a19,roughness:1,metalness:0});
function setOnFire(c){if(!c.alive)return;if(c.net&&!c.netFire){netHit(c.net,250,true,'boom');c.hp=1e6;return}
 // Durante cada tomada do benchmark, conservar o elenco até a explosão conjunta.
 if(BENCH.running&&c.bench&&BENCH.wave&&!BENCH.wave.detonated&&c.benchWave===BENCH.wave.n){c.hp=Math.max(c.hp,60);return}if(c.mode==='rail')toPhys(c);c.alive=false;c.hp=0;c.wreckAt=simT;c.chase=false;c.fuse=3+Math.random()*2.2;
 if(c.police&&!c.stationParked){copBail(c);c.ai=null}else if(c.ai){const ca=Math.cos(c.a),sa=Math.sin(c.a);spawnPed(null,{x:c.x+sa*(c.t.W/2+.9),z:c.z-ca*(c.t.W/2+.9),vx:sa*6,vz:-ca*6});c.ai=null}
}
function fireTick(c,dt){const ca=Math.cos(c.a),sa=Math.sin(c.a);const hx=c.x+ca*c.t.L*.3,hz=c.z+sa*c.t.L*.3;
 if(!c.exploded){c.fuse-=dt;const k=c.fuse<1.2?2:1;
  if(Math.random()<dt*22*k)emit(hx+(Math.random()-.5)*1.2,c.gy+1.1,hz+(Math.random()-.5)*1.2,(Math.random()-.5)*.8,2+Math.random()*2,(Math.random()-.5)*.8,.55,1.1*k,.3,Math.random()<.5?0xff6a1a:0xffb02a,true,.95);
  if(Math.random()<dt*6)emit(hx,c.gy+2,hz,(Math.random()-.5),2+Math.random(),(Math.random()-.5),2.2,1.2,5,0x2a2426,false,.5);
  if(c.fuse<=0)explode(c,c.fireByPlayer)}
 else if(c.burn>0){c.burn-=dt;if(Math.random()<dt*10)emit(c.x+(Math.random()-.5)*c.t.L*.7,c.gy+.9,c.z+(Math.random()-.5)*1.5,0,1.5+Math.random()*1.5,0,.6,.9,.2,Math.random()<.5?0xff5a14:0xffa02a,true,.85);
  if(Math.random()<dt*5)emit(c.x,c.gy+2,c.z,(Math.random()-.5),2,(Math.random()-.5),2.8,1.5,6,0x1e1a1c,false,.55)}}
function explode(c,byP,vehicleDetonate=false){if(byP&&c&&!c.statBoom){c.statBoom=true;STATS.destroyed++}if(c&&c===PL.car){NEWS.boomT=simT;NEWS.veh=vehicleModelName(c);if(maskOn())newsAdd('maskboom',{veh:NEWS.veh})}if(byP&&POL.wanted&&!c.boomW){c.boomW=true;POL.boomW=(POL.boomW||0)+1;if(POL.boomW>=3&&(POL.level||1)<3)wantedUp((POL.level||1)+1)}if(byP&&!c.police&&!c.boomCounted){c.boomCounted=true;POL.booms=(POL.booms||0)+1;if(POL.booms>=CRIME_ROLL.cars){POL.booms=0;if(!POL.wanted){setTimeout(()=>{startWanted(true);toast('A POLÍCIA FOI CHAMADA')},400)}}}if(c.mode==='rail')toPhys(c);c.alive=false;c.hp=0;c.ai=null;c.chase=false;c.thr=0;c.wreckAt=Number.isFinite(c.wreckAt)?c.wreckAt:simT;if(!c.g)buildCarMesh(c);c.exploded=true;if(c.icol)c.icol.setHex(0x1d1a19);c.burn=8;c.hopV=6+Math.random()*3;c.w+=(Math.random()-.5)*5;c.sleep=false;c.sleepT=0;
 c.g.traverse(o=>{if(!o.isMesh)return;if(o.material===carBodyMat)o.material=burntMat;else if(o.material&&o.material.userData.carBody)o.material=carHoleMat(c,true);else if(o.material===carLightMat)o.visible=false;else if(o.material&&o.material.blending===THREE.AdditiveBlending)o.visible=false});
 blastAt(c.x,c.z,c,!!byP,vehicleDetonate)}
function blastAt(cx,cz,c,byPlayer,vehicleDetonate=false){c=c||{x:cx,z:cz};if(byPlayer)labTankPoke({x:cx,y:1.2,z:cz},3);GAS.by=GAS.by||byPlayer;gasNearBlast(cx,cz);
 boomLight.position.set(cx,4,cz);boomLight.intensity=10;boomT=.7;
 for(let i=0;i<34;i++){const a=Math.random()*6.28,s=Math.random()*9;emit(cx,1+Math.random()*1.5,cz,Math.cos(a)*s,2+Math.random()*7,Math.sin(a)*s,.6+Math.random()*.5,2.6,5.5,Math.random()<.5?0xff7a1a:0xffc040,true,.95)}
 for(let i=0;i<22;i++){const a=Math.random()*6.28,s=Math.random()*4;emit(cx,2,cz,Math.cos(a)*s,1.5+Math.random()*3,Math.sin(a)*s,2.4+Math.random(),2.5,8,0x1c1818,false,.75)}
 for(let i=0;i<30;i++){const a=Math.random()*6.28,s=6+Math.random()*12;emit(cx,1,cz,Math.cos(a)*s,4+Math.random()*8,Math.sin(a)*s,.8,.3,.08,0xffd070,true,1)}
 const RB=14;
 for(const v of vehicles){if(v===c)continue;const dx=v.x-c.x,dz=v.z-c.z,d=Math.hypot(dx,dz);if(d>RB)continue;const f=1-d/RB,nx=dx/(d||1),nz=dz/(d||1);
  v.vx+=nx*f*14;v.vz+=nz*f*14;v.w+=(Math.random()-.5)*f*4;v.sleep=false;v.sleepT=0;v.hp-=f*75;
  if(v.ai)v.ai.stun=2;if(byPlayer&&policeTrafficCar(v))startWanted();
  // Granada e C4 devem destruir inclusive motocicletas, independente do HP.
  // A explosão do veículo ocorre em fireTick no próximo frame, evitando recursão
  // imediata enquanto blastAt ainda itera a lista de tráfego.
  if(vehicleDetonate&&d<=11&&!v.exploded){if(v.alive)setOnFire(v);if(!v.sunk){v.fireByPlayer=v.fireByPlayer||byPlayer;v.fuse=Math.min(v.fuse||.02,.02)}}
  else if(v.hp<=0&&v.alive){setOnFire(v);v.fuse=.5+Math.random()*1.3}}
 for(const p of peds){const dx=p.x-c.x,dz=p.z-c.z,d=Math.hypot(dx,dz);if(d>11)continue;const f=1-d/11;if(p.state!=='dead'){ouch(p.x,p.z,p.pitch);if(byPlayer)registerKill(p,true)}p.sp.material.alphaTest=.02;p.sp.material.needsUpdate=true;p.state='dead';p.timer=9;p.vx=dx/(d||1)*f*14;p.vz=dz/(d||1)*f*14;p.rot=(Math.random()<.5?1:-1)*Math.PI/2}
 if(PL.car===c){enterExit();killPlayer()}
 else if(!PL.car&&!PL.dead&&!PL.heli&&(PL.gy||0)<groundY(c.x,c.z)+4){const dx=PL.x-c.x,dz=PL.z-c.z,d=Math.hypot(dx,dz);if(d<11){const f=1-d/11;if(maskSafe())maskBurn();else PL.hp-=armorHit(Math.round(f*95));PL.down=1.6;PL.rot=Math.PI/2;PL.vx=dx/(d||1)*f*14;PL.vz=dz/(d||1)*f*14;if(PL.hp<=0)killPlayer()}}
 const fp=PL.car||PL;shake=Math.max(shake,clamp(1.6-Math.hypot(fp.x-c.x,fp.z-c.z)/60,0,1.6));{const bf=clamp(1-Math.hypot(fp.x-c.x,fp.z-c.z)/80,0,1);if(bf>0)rumble(bf,bf*.8,150+bf*450)}boomSound(Math.hypot(fp.x-c.x,fp.z-c.z))}
function killPlayer(txt){NEWS.cause=txt||(simT-(NEWS.boomT??-9)<1.5?'EXPLODIDO':'');if(maskSafe()){PL.hp=100;if(/QUEDA/.test(txt||''))maskFall();else if(/explos/i.test(txt||''))maskBurn();return} /* v78: Maskara = imortal (queda e explosão viram piada) */ if(typeof netProt==='function'&&netProt()){PL.hp=100;return} /* v3 r38: proteção de 15 s ao renascer no online */ if(storyMissionFail(txt==='AFOGADO'?'VOCÊ SE AFOGOU':txt&&/abatid|explos|morte|morto/i.test(txt)?'VOCÊ MORREU: '+txt:'VOCÊ MORREU'))return;PL.hp=0;PL.dead=true;PL.deadT=5;PL.down=5;PL.rot=Math.PI/2;if(S.style==='inverted')INVERT.deathReturn=true;$('#ko').textContent=txt||'NOCAUTE';$('#ko').hidden=false}

