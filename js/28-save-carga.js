'use strict';
/* Coastal Chaos · js/28-save-carga.js — Funções do save que já rodam na carga (syncSave() no fim de 29-campanha-abertura.js): versão compatível, ler save, alinhar botão. O resto do save fica em 37-save-garagem.js.
   Script clássico (não é módulo): todos os js/NN-*.js dividem o mesmo escopo global e entram na ordem do index.html. */
/* Estas funções estavam junto do save (e storyOn junto do modo história). Vieram para cá porque o syncSave() do fim de 29-campanha-abertura.js
   roda durante a carga: num arquivo posterior elas ainda não existiriam. */
function storyOn(){return GAMEMODE!=='free'}
function saveVersionCompatible(gv,series){return (gv===1||gv===2||gv===3||gv===4||gv===5||gv===6||gv===7||gv===8||gv===9||gv===10||gv===11||gv===12||gv===13||gv===14||gv===15||gv===16||gv===17||gv===18||gv===19||gv===20||gv===21||gv===22||gv===23||gv===24||gv===25||gv===26||gv===27||gv===28||gv===29||gv===30||gv===31||gv===32||gv===33||gv===34||gv===35||gv===36||gv===37||gv===38||gv===39||gv===40||gv===41||gv===42||gv===43||gv===44||gv===45||gv===46||gv===47||gv===48||gv===49||gv===50||gv===51||gv===52||gv===53||gv===54||gv===55||gv===56||gv===57||gv===58||gv===59||gv===60||gv===61||gv===62||gv===63||gv===64||gv===65||gv===66||gv===67||gv===68||gv===69||gv===70||gv===71||gv===72||gv===73||gv===74||gv===75||gv===76||gv===77||gv===78||gv===79)&&series===SAVE_SERIES}
function readSave(){try{/* save antigo do navegador (só leitura) */const d=JSON.parse(localStorage.getItem('ps_save')||'null');return d&&d.v===1&&saveVersionCompatible(d.gv,d.saveSeries)&&supportedCitySize(d.size||14)?d:null}catch(e){return null}}
function alignSaveToLoad(){
 const save=$('#saveFile'),load=document.querySelector('#menu label[for="loadFile"]'),menu=$('#menu');
 if(played||save.hidden||menu.hidden||!load)return;
 const target=load.getBoundingClientRect(),top=save.closest('.row').getBoundingClientRect();
 if(!target.width||!top.width)return;
 save.style.width=target.width+'px';
 save.style.marginRight=Math.max(0,top.right-target.right)+'px';
}
function syncSave(){const d=readSave();$('#loadSave').hidden=!d||played;$('#saveFile').hidden=!played||BENCH.active||(storyOn()&&!STORY.checkpoint);
 $('#benchRow').hidden=!!played||BENCH.active;$('#benchBtn').disabled=!!played||BENCH.active;$('#regBtnMenu').hidden=!played;
 $('#menu').classList.toggle('in-game',!!played&&!BENCH.active);
 $('#saveInfo').textContent=played?'':d?`Save antigo no navegador: seed ${d.seed} · ${new Date(d.t).toLocaleString(S.lang==='en'?'en-US':'pt-BR',{dateStyle:'short',timeStyle:'short'})}`:'';
 if(!$('#menu').hidden)requestAnimationFrame(alignSaveToLoad);
}
