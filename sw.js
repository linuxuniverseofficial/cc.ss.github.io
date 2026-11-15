'use strict';
// Network only: always retrieve the current game; never cache saves, login or radio.
// v78: página e scripts sempre revalidados no servidor (cache:'no-cache' → 304 barato quando nada mudou), assim um update aparece no primeiro carregamento.
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
 const req=event.request;if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
 const fresh=req.mode==='navigate'||/\.(?:html|js|css|json|webmanifest)(?:$|\?)/i.test(new URL(req.url).pathname)||new URL(req.url).pathname.endsWith('/');
 event.respondWith(fresh?fetch(req.url,{cache:'no-cache',credentials:'same-origin'}).catch(()=>fetch(req)):fetch(req));
});
