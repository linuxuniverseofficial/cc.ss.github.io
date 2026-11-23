// Aviso de orientacao desde a abertura, mesmo no menu inicial e antes do WebGL.
/* r35: celular = PC. Todos os cortes de qualidade/quantidade que eram por IS_MOBILE (sombra, LOD, árvores, chuva, folhas, pássaros, peds, sons, sprites…) agora leem MOB_LITE, desligado. Ligar só se um dia voltar um "modo leve" escolhido pelo jogador. IS_MOBILE continua para UI (retrato, toque). */
var MOB_LITE=false;
function pixelIsMobile(){
 try{return (matchMedia('(pointer:coarse)').matches&&Math.min(screen.width,screen.height)<=820)||/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)}
 catch(e){return false}
}
if(pixelIsMobile()&&matchMedia('(orientation: portrait)').matches)
 document.getElementById('rotatePhone').hidden=false;
