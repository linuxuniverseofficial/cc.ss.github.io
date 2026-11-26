'use strict';
/* Coastal Chaos · js/99-pos-carga.js — roda depois de todos os arquivos.
   1) Anti z-fight dos interiores: embrulha funções definidas em vários arquivos (no index antigo isto ficava logo depois do zfWrap,
      mas lá todas as funções já existiam por causa do hoisting). Nada chama essas funções durante a carga, então o resultado é o mesmo.
   2) Solta os timers/rAF que 00-carga.js segurou. */
// interiores e prédios especiais (os chunks montam os exteriores): montagem com anti z-fight
ibox=(f=>function(){let a=arguments;if(ZF.on){a=[...a];const v=zfBoxAdj(a.slice(1,7));for(let i=0;i<6;i++)a[i+1]=v[i]}ZF.box++;try{return f.apply(this,a)}finally{ZF.box--}})(ibox);
buildSafehouse=zfWrap(buildSafehouse);ammoBuild=zfWrap(ammoBuild);buildShop=zfWrap(buildShop);buildMall=zfWrap(buildMall);casinoBuild=zfWrap(casinoBuild);buildPawn=zfWrap(buildPawn);
bankBuild=zfWrap(bankBuild);buildJail=zfWrap(buildJail);motelRoomBuild=zfWrap(motelRoomBuild);labBuild=zfWrap(labBuild);houseBuild=zfWrap(houseBuild);empEnter=zfWrap(empEnter);buildChunk=zfWrap(buildChunk);gasVisual=zfWrap(gasVisual);
/* v4 r28: ragdoll dos bonecos 3D (js/49) roda depois do quadro do mundo (inclui o palco dos interiores, que sai do update) */
update=(f=>function(dt){const r=f.apply(this,arguments);try{ragTick(dt)}catch(e){console.error(e)}return r})(update);
__CC_CARGA.fim();
