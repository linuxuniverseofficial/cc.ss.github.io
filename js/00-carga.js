'use strict';
/* Coastal Chaos · js/00-carga.js — proteção da carga em vários arquivos.
   No index antigo o jogo era um <script> só: nenhum setTimeout/setInterval/requestAnimationFrame podia rodar no meio dele.
   Agora são vários arquivos e o navegador pode rodar tarefas entre um e outro (ex.: esperando o próximo arquivo chegar da rede).
   Aqui os callbacks que dispararem ANTES do último arquivo ficam numa fila; 99-pos-carga.js chama __CC_CARGA.fim(), que devolve
   as funções originais e roda a fila na mesma ordem. Depois da carga não sobra nenhum embrulho. Não mexer sem necessidade. */
(function(){
 const w=window,st=w.setTimeout,si=w.setInterval,raf=w.requestAnimationFrame,ct=w.clearTimeout,ci=w.clearInterval,caf=w.cancelAnimationFrame;
 let pronto=false;const fila=[],morto={t:new Set(),i:new Set(),r:new Set()},intervaloNaFila=new Set();
 w.setTimeout=function(f,d,...a){if(typeof f!=='function')return st.call(w,f,d,...a);let id=0;
  id=st.call(w,function(){if(pronto)return f.apply(this,a);fila.push(['t',id,()=>f.apply(w,a)])},d);return id};
 w.setInterval=function(f,d,...a){if(typeof f!=='function')return si.call(w,f,d,...a);let id=0;
  id=si.call(w,function(){if(pronto)return f.apply(this,a);if(intervaloNaFila.has(id))return;intervaloNaFila.add(id);fila.push(['i',id,()=>{intervaloNaFila.delete(id);f.apply(w,a)}])},d);return id};
 if(raf)w.requestAnimationFrame=function(f){let id=0;id=raf.call(w,t=>{if(pronto)return f(t);fila.push(['r',id,f])});return id};
 w.clearTimeout=function(id){morto.t.add(id);return ct.call(w,id)};
 w.clearInterval=function(id){morto.i.add(id);return ci.call(w,id)};
 if(caf)w.cancelAnimationFrame=function(id){morto.r.add(id);return caf.call(w,id)};
 w.__CC_CARGA={fim(){if(pronto)return;pronto=true;
  w.setTimeout=st;w.setInterval=si;w.clearTimeout=ct;w.clearInterval=ci;if(raf){w.requestAnimationFrame=raf;w.cancelAnimationFrame=caf}
  for(const [k,id,fn] of fila){if(morto[k].has(id))continue;if(k==='r')raf.call(w,fn);else st.call(w,fn,0)}
  fila.length=0;try{delete w.__CC_CARGA}catch(e){w.__CC_CARGA=undefined}}};
})();
