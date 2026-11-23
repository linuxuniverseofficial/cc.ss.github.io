'use strict';
/* Coastal Chaos · js/42-idioma-config.js — Tradução em tempo real, menu de configurações.
   Script clássico (não é módulo): todos os js/NN-*.js dividem o mesmo escopo global e entram na ordem do index.html. */
const LANG_EXACT=new Map(Object.entries(LANG_EN));
// One-pass replacement prevents cascading translations and substitutions inside words.
const LANG_KEYS=Object.keys(LANG_EN).filter(k=>k.trim().length>=2).sort((a,b)=>b.length-a.length);
const LANG_RE=new RegExp('(?<![\\p{L}\\p{N}_])(?:'+LANG_KEYS.map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')(?![\\p{L}\\p{N}_])','gu');
const LANG_PREV=new WeakMap(), LANG_ATTR_PREV=new WeakMap();
function translatePlain(v){
 if(S.lang!=='en'||typeof v!=='string'||!v)return v;
 const clean=v.trim(),exact=LANG_EXACT.get(clean);
 if(exact!==undefined){const i=v.indexOf(clean);return v.slice(0,i)+exact+v.slice(i+clean.length)}
 return v.replace(LANG_RE,m=>LANG_EN[m]??m);
}
function translateMarkup(s){if(S.lang!=='en'||typeof s!=='string')return s;
 return s.split(/(<[^>]*>)/g).map(part=>part.startsWith('<')?part:translatePlain(part)).join('');
}
function translateNode(node){
 if(!node||node.nodeType!==3||!node.parentElement||node.parentElement.closest('script,style,textarea,code,pre,svg'))return;
 const current=node.nodeValue,prev=LANG_PREV.get(node);
 if(S.lang!=='en'){
  if(prev&&current===prev.en)node.nodeValue=prev.br;
  LANG_PREV.delete(node);return;
 }
 if(prev&&current===prev.en)return;
 const en=translatePlain(current);
 if(en!==current){LANG_PREV.set(node,{br:current,en});node.nodeValue=en}
}
const LANG_ATTRS=['title','aria-label','aria-description','aria-valuetext','placeholder','alt'];
function translateAttributes(el){if(!el||el.nodeType!==1||el.closest('script,style,textarea,svg'))return;
 let store=LANG_ATTR_PREV.get(el);if(!store){store={};LANG_ATTR_PREV.set(el,store)}
 for(const at of LANG_ATTRS){if(!el.hasAttribute(at))continue;
  const now=el.getAttribute(at),was=store[at];
  if(S.lang!=='en'){if(was&&now===was.en)el.setAttribute(at,was.br);delete store[at];continue}
  if(was&&now===was.en)continue;
  const en=translatePlain(now);if(en!==now){store[at]={br:now,en};el.setAttribute(at,en)}
 }
}
function translateRoot(root){if(!root||!root.ownerDocument)return;
 translateAttributes(root);
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);let el;
 while((el=walker.nextNode())){if(el.nodeType===3)translateNode(el);else translateAttributes(el)}
}
function applyLanguage(){try{cheatListRender()}catch(e){}document.documentElement.lang=S.lang==='en'?'en':'pt-BR';
 translateRoot(document.body);
 const a=$('#langBR'),b=$('#langEN');if(a&&b){a.setAttribute('aria-pressed',S.lang==='br'?'true':'false');b.setAttribute('aria-pressed',S.lang==='en'?'true':'false')}
 if(typeof DLG!=='undefined'&&DLG.on&&DLG.d&&DLG.d._originalLocale){
  const orig=DLG.d._originalLocale;
  DLG.d.lines=orig.lines.map(translatePlain);
  DLG.d.choices=orig.choices?.map(translatePlain);
  DLG.shown=Math.min(DLG.shown,(DLG.d.lines[DLG.i]||'').length);dlgPaint();
 }
 if(typeof recordsOpen!=='undefined'&&recordsOpen)recordsRefresh();
 if(typeof PHONE!=='undefined'&&PHONE.open&&PHONE.cv)phoneDraw();
 if(typeof TVC!=='undefined'&&TVC.open)tvcRender();
 if(typeof NAV!=='undefined'&&NAV.open)try{drawBigmap()}catch(e){}
}
let LANG_OBS_LOCK=false;
const langObs=new MutationObserver(records=>{
 if(S.lang!=='en'||LANG_OBS_LOCK)return;LANG_OBS_LOCK=true;
 try{for(const m of records){
  if(m.type==='characterData')translateNode(m.target);
  else if(m.type==='attributes')translateAttributes(m.target);
  else for(const node of m.addedNodes){if(node.nodeType===3)translateNode(node);else if(node.nodeType===1)translateRoot(node)}
 }}finally{LANG_OBS_LOCK=false}
});
langObs.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:LANG_ATTRS});
$('#langBR').addEventListener('click',()=>{S.lang='br';applyLanguage();saveCfg()});
$('#langEN').addEventListener('click',()=>{S.lang='en';applyLanguage();saveCfg()});
function selectCfgCategory(cat,focus){if(cat==='1'||cat==='4'||cat===1||cat===4)cat='6';{const q=$('#cfgSearch');if(q&&q.value){q.value='';$('#cfg').classList.remove('searching');for(const el of document.querySelectorAll('#cfg .cfg-miss'))el.classList.remove('cfg-miss')}}
 if(String(cat)!=='0'&&AUDIO_TEST.mode)audioPreviewStop();
 const tabs=[...document.querySelectorAll('#cfg [data-cfg]')],panels=[...document.querySelectorAll('#cfg [data-cfg-panel]')];
 for(const t of tabs){const on=t.dataset.cfg===String(cat);t.classList.toggle('on',on);t.setAttribute('aria-selected',String(on));if(on&&focus)t.focus()}
 for(const panel of panels)panel.hidden=panel.dataset.cfgPanel!==String(cat);
}

// v77: reorganiza CONFIGURAÇÕES sem mudar ids/handlers: GERAL (idioma + interface + comandos) · GRÁFICOS · ÁUDIO · CONTROLES,
// busca no topo, explicações longas recolhidas (botão "Explicações"), restaurar padrões e fechar no rodapé fixo.
(function cfgRestructure(){const root=$('#cfg');if(!root||root.dataset.v77)return;root.dataset.v77='1';
 const card=root.querySelector('.card'),tabs=root.querySelector('.cfg-tabs'),secs=root.querySelector('.cfg-sections');
 const T=id=>root.querySelector('#cfg-tab-'+id),Pn=id=>root.querySelector('#cfg-panel-'+id);
 const meta={6:['⚙','GERAL'],3:['🖥','GRÁFICOS'],0:['🔊','ÁUDIO'],5:['🎮','CONTROLES']};
 for(const id of ['6','3','0','5']){const t=T(id);if(!t)continue;t.innerHTML='<span class="ico" aria-hidden="true">'+meta[id][0]+'</span><span class="lbl">'+meta[id][1]+'</span>';tabs.appendChild(t)}
 for(const id of ['1','4']){const t=T(id);if(t){t.dataset.merged='1';t.tabIndex=-1}}
 // GERAL recebe idioma e interface como subseções
 const g=Pn('6'),gTitle=g.querySelector('h2');const wrap=n=>{const d=document.createElement('div');d.className='cfg-sub';return d};
 const acts=g.querySelector('.cfg-general-actions');
 const lang=Pn('1'),ui=Pn('4');
 for(const src of [lang,ui]){if(!src)continue;const d=wrap();while(src.firstChild)d.appendChild(src.firstChild);g.insertBefore(d,acts);src.remove()}
 if(gTitle)gTitle.textContent='GERAL';
 if(acts){const d=wrap();const h=document.createElement('h2');h.textContent='COMANDOS E ATALHOS';d.appendChild(h);d.appendChild(acts);g.appendChild(d)}
 // rodapé
 const foot=document.createElement('div');foot.className='cfg-foot';
 foot.innerHTML='<label><input type="checkbox" id="cfgHelpT"> Mostrar explicações</label><span class="grow"></span>';
 const reset=$('#cfgReset'),msg=$('#cfgResetMsg');if(msg)foot.appendChild(msg);if(reset)foot.appendChild(reset);
 const done=document.createElement('button');done.className='btn';done.type='button';done.id='cfgDone';done.textContent='PRONTO';done.addEventListener('click',()=>closeCfg());foot.appendChild(done);
 card.appendChild(foot);
 $('#cfgHelpT').addEventListener('change',e=>root.classList.toggle('show-help',e.target.checked));
 // cabeçalho: busca + benchmark + fechar (✕)
 const head=root.querySelector('.cfg-heading'),ha=head.querySelector('.cfg-head-actions'),close=$('#cfgClose');
 const q=document.createElement('input');q.type='search';q.id='cfgSearch';q.placeholder='Buscar configuração…';q.setAttribute('aria-label','Buscar configuração');head.insertBefore(q,ha);
 close.textContent='✕';close.setAttribute('aria-label','Fechar configurações (Esc)');close.title='Fechar (Esc)';ha.appendChild(close);
 // explicações longas: viram ajuda sob demanda
 for(const p of secs.querySelectorAll('p')){if(p.id==='padStatus'||p.getAttribute('role')==='status'||p.classList.contains('graphics-preset-status'))continue;if((p.textContent||'').trim().length>48)p.classList.add('cfg-help')}
 for(const d of secs.querySelectorAll('.field > div[style*="justify-content:space-between"]'))d.classList.add('cfg-help');
 // busca
 for(const [k,t] of [['6','GERAL'],['3','GRÁFICOS'],['0','ÁUDIO'],['5','CONTROLES']]){const pn=secs.querySelector('[data-cfg-panel="'+k+'"]');if(pn){const st=document.createElement('div');st.className='cfg-stitle';st.textContent=t;pn.insertBefore(st,pn.firstChild)}}
 const nores=document.createElement('div');nores.className='cfg-nores';nores.hidden=true;nores.textContent='Nada encontrado.';secs.appendChild(nores);
 const norm=t=>(t||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
 q.addEventListener('input',()=>{const v=norm(q.value.trim());root.classList.toggle('searching',!!v);let any=false;
  for(const pnl of secs.querySelectorAll('.msec')){let hit=false;for(const el of pnl.querySelectorAll('.field,.checks>label,.graphics-presets,.radiobox,.lang-select,.dualSection,.cfg-general-actions,.row')){if(el.parentElement.closest('.field,.checks>label,.dualSection,.graphics-presets,.radiobox'))continue;const lab=el.matches('.field')?(el.querySelector('label')||el):el;let tx='';for(const n of lab.childNodes){if(n.nodeType===3||!(n.classList&&n.classList.contains('cfg-help')))tx+=' '+(n.textContent||'')}const m=!v||(norm(tx).includes(v)&&!((h=>h&&h!==pnl)(el.closest('[hidden]'))));el.classList.toggle('cfg-miss',!m);if(m&&v)hit=true}
   {const IT='.field,.checks>label,.graphics-presets,.radiobox,.lang-select,.dualSection,.cfg-general-actions,.row';const top=x=>x.matches(IT)&&!x.parentElement.closest('.field,.checks>label,.dualSection,.graphics-presets,.radiobox');
    const walk=n=>{for(const c of n.children){if(c.classList.contains('cfg-stitle'))continue;if(top(c))continue;if(!c.matches(IT))c.classList.remove('cfg-miss');if(!v){walk(c);continue}const ok=[...c.querySelectorAll(IT)].some(x=>top(x)&&!x.classList.contains('cfg-miss'));if(ok)walk(c);else c.classList.add('cfg-miss')}};walk(pnl)}
   pnl.classList.toggle('cfg-miss',!!v&&!hit);if(hit)any=true}
  nores.hidden=!v||any;if(!v){const on=root.querySelector('.cfg-tabs .ctab.on');selectCfgCategory(on?on.dataset.cfg:'6',false)}});
})();
{const tabs=[...document.querySelectorAll('#cfg [data-cfg]:not([data-merged])')];tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>selectCfgCategory(tab.dataset.cfg,false));tab.addEventListener('keydown',e=>{let n=i;if(e.key==='ArrowRight'||e.key==='ArrowDown')n=(i+1)%tabs.length;else if(e.key==='ArrowLeft'||e.key==='ArrowUp')n=(i+tabs.length-1)%tabs.length;else if(e.key==='Home')n=0;else if(e.key==='End')n=tabs.length-1;else return;e.preventDefault();selectCfgCategory(tabs[n].dataset.cfg,true)})});selectCfgCategory('6',false)}
$('#wardClose').addEventListener('click',()=>closeWard(false));$('#wardBuy').addEventListener('click',()=>closeWard(true));
{const tabs=[...document.querySelectorAll('#cmds .ctab')],grid=document.querySelector('#cmds .cgrid'),cgs=[...grid.querySelectorAll(':scope > .cg')];const show=g=>{tabs.forEach(t=>t.classList.toggle('on',t.dataset.g===String(g)));grid.classList.toggle('one',g!=='all');cgs.forEach((c,i)=>c.style.display=g==='all'||String(i)===String(g)?'':'none')};tabs.forEach(t=>t.addEventListener('click',()=>show(t.dataset.g)));show('0')}
