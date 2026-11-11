/* PixelCity: installation UI for mobile and desktop browsers. */
(()=>{
 'use strict';
 const button=document.getElementById('installApp');
 if(!button)return;
 const secure=location.protocol==='https:'||['localhost','127.0.0.1'].includes(location.hostname);
 const modes=['standalone','fullscreen','minimal-ui'].map(m=>matchMedia('(display-mode: '+m+')'));
 const installed=()=>modes.some(m=>m.matches)||navigator.standalone===true;
 const mobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||(navigator.maxTouchPoints>1&&/MacIntel/.test(navigator.platform));
 let pending=null,busy=false,accepted=false;
 const refresh=()=>{
  button.hidden=!secure||installed()||accepted||(!mobile&&!pending);
  button.disabled=busy;
  button.textContent=busy?'AGUARDE...':'INSTALAR PIXELCITY';
 };
 window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();pending=event;refresh();console.info('[PixelCity PWA] Instalação nativa disponível')});
 window.addEventListener('appinstalled',()=>{pending=null;accepted=true;refresh()});
 for(const m of modes){if(m.addEventListener)m.addEventListener('change',refresh)}
 button.addEventListener('click',async()=>{
  if(busy||installed())return;
  if(!pending){
   const ios=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
   const msg=ios?'No Safari, toque em Compartilhar e depois Adicionar à Tela de Início.':'No menu do navegador (⋮ ou ⋯), escolha Instalar app / Instalar PixelCity.';
   alert(msg);return;
  }
  const event=pending;pending=null;busy=true;refresh();
  try{await event.prompt();const choice=await event.userChoice;if(choice.outcome==='accepted')accepted=true;else console.info('[PixelCity PWA] Instalação cancelada pelo usuário')}
  catch(e){console.warn('[PixelCity PWA] Prompt indisponível',e);alert('Use o menu do navegador e escolha Instalar app.')}
  finally{busy=false;refresh()}
 });
 if(secure&&'serviceWorker' in navigator)window.addEventListener('load',()=>{
  navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).then(r=>r.update()).catch(e=>console.warn('[PixelCity PWA] Service worker:',e));
 });
 refresh();
})();
