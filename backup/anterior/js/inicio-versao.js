/* v3 r5 (GC): o Math.hypot nativo aloca um array com os argumentos em cada chamada feita por código ainda não otimizado
   (842 chamadas no jogo, muitas por quadro). Esta versão não aloca (1–3 argumentos; 4 cai no nativo). Sem 'arguments' de propósito:
   só citar 'arguments' já faz o interpretador criar o objeto a cada chamada. */
(function(){const h0=Math.hypot,sq=Math.sqrt,ab=Math.abs;Math.hypot=function hypot(a,b,c,d){if(d!==undefined)return h0(a,b,c,d);if(c!==undefined)return sq(a*a+b*b+c*c);if(b!==undefined)return sq(a*a+b*b);return a===undefined?0:ab(+a)}})();
/* v78 · BUILD: número da entrega. Ao abrir, o jogo lê version.txt (poucos bytes, sem cache) e, se a build no servidor for outra
   (navegador/celular servindo cópia velha), recarrega uma vez. Saves e configurações (localStorage) NÃO são apagados. */
var BUILD_TAG='r45';
(function(){try{if(!/^https?:$/.test(location.protocol))return;const k='ps_build_reload';
 fetch(new URL('version.txt?b='+Date.now(),location.href).href,{cache:'no-store'}).then(r=>r.ok?r.text():'').then(t=>{const m=/^\s*((?:dev\s+)?r[\d.]+)\s*$/i.exec(t||'');if(!m||m[1].replace(/\s+/g,' ').toLowerCase()===BUILD_TAG.toLowerCase()){try{sessionStorage.removeItem(k)}catch(e){}return}
  let n=0;try{n=+sessionStorage.getItem(k)||0}catch(e){}if(n>=2)return;try{sessionStorage.setItem(k,String(n+1))}catch(e){}
  if(window.caches&&caches.keys)caches.keys().then(ks=>Promise.all(ks.map(x=>caches.delete(x)))).finally(()=>location.reload());else location.reload()}).catch(()=>{})}catch(e){}})();
