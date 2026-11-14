# Coastal Chaos: Sunset Shores — guia rápido para edições

Jogo inteiro em `index.html` (three r128, scripts inline). `CONTEXT.md` é o histórico completo (~520 KB): **não ler inteiro**, procurar a seção da versão/sistema (`grep -n "## v78" CONTEXT.md`). `README.md` é texto para jogador, não especificação.

## Regras do projeto
- Responder ao usuário em português (pt-BR).
- Toda mudança executável vai registrada no topo do `CONTEXT.md` (seção da versão atual): causa, o que mudou, o que foi testado e o que NÃO foi.
- Testar no Chrome do usuário: `python3 -m http.server 8777 --bind 127.0.0.1` na pasta e abrir `http://127.0.0.1:8777/`. Gerar cidade pelo input de seed + "GERAR COM ESTA SEED" + "MODO LIVRE"/"MODO HISTÓRIA". Seeds usadas: 716540 (danceteria), 2812765640 (benchmark mobile).
- Antes de recarregar a aba, lembrar que o usuário pode estar jogando nela; não mexer se ele pediu para parar.
- Não há Node: checar sintaxe recarregando a página e lendo o console (`city`/`PAD` indefinidos = script quebrou).

## Estilo dos textos de tela (pedido do usuário)
- Avisos (toast/wxToast), objetivos e guias: CURTOS e não expositivos. Título direto; subtítulo só se for informação que o jogador não deduz sozinho (preço, tempo, tecla nova). Nada de narrar o que ele está vendo ou explicar o óbvio.
- Todo texto novo em PT precisa de entrada em LANG_EN (frase inteira; chave terminada em espaço não funciona no regex do translatePlain).

## Armadilhas
- buildChunk: `night` = estilo noturno do mundo (Synthwave), não a hora do dia. Para algo que acende ao anoitecer em Sunset Shores use o lote `neonDN` ou `dnSignMat()`. (já causaram bugs — conferir sempre)
1. **Linhas longas com várias funções.** Nunca inserir comentário `//` no meio de uma linha: comenta o resto do script ("Unexpected end of input"). Use `/* */` ou quebre a linha.
2. **Interiores com palco não rodam `update()`.** Impérios, banco, assalto, danceteria, cassino, lojas, shopping, motel e prisão usam `roomStageLocalTick`. Qualquer sistema por quadro que deva funcionar lá dentro precisa ser chamado também nesse caminho (ex.: armas → `weaponTick`). Clima e trânsito não rodam lá.
3. **Diálogos/cutscenes pausam `updatePlayer`/peds.** Ator que chega numa cena antes de um diálogo: chamar `actorShowNow(o)`, senão fica invisível/no lugar antigo até a conversa acabar.
4. **`transitionAudioStop` derruba o rádio de cena.** Em transições que podem acontecer com a danceteria etc. já tocando, usar `audioCutKeepScene()` + `sceneRadioResume(k)`.
5. **Objetos fora de `city.group`** (`scene.add` direto: pontes levadiças, vitrine da concessionária, efeitos) não somem na troca de cidade/mundo (Synth, Point Haze, DeLorean). Guardar a lista e remover/recolocar na troca (ver `DB.groups`).
6. **Determinismo da seed.** Geração usa `R()` (mulberry32 da seed); um `R()` a mais ou a menos muda o resto da cidade. Aleatório novo na geração: trocar `R` por um gerador próprio e restaurar (`const R0=R;R=mulberry32(...);try{...}finally{R=R0}`). `tree()` consome `R`.
7. **Caixa dos chunks** (`ch.x0..y1`) é usada no culling, LOD e reflexo: calcular com `matrixWorld` e ignorar caixas não finitas (há rodas com rotação NaN em carcaças).
8. **Sprites de personagem são área protegida** (SpriteMaterial, atlas, alphaTest): não trocar shaders/material para resolver visibilidade sem diagnóstico.
9. **Controle (DualSense/Xbox) usa layout padrão** (✕0 ○1 □2 △3 L1 4 R1 5 L2 6 R2 7, setas 12–15). Ação de "segurar" no controle precisa ler `B[i]` (botão pressionado), não só `pr(i)` (borda) — o teclado tem repetição automática, o controle não. Menus usam `padNavFocus` (navegação espacial).
10. **Desempenho:** gargalo é CPU/draw calls. Objetos repetidos → `MB` (lote por chunk) ou `InstancedMesh` com `frustumCulled=false` e cor por instância; materiais compartilhados com `userData.cached=true` (não são descartados por `disposeGroup`). Já instanciados: sombras de ped (`pedShadowTick`), coletáveis (`pickupInstAdopt`), guarda-sóis (`umbrellaInstTick`) — objeto novo desses tipos deve passar por eles.
11. **Canvas CSS filter** tem dono: modo foto e `SLOWFX` (especiais). Não escrever `canvas.style.filter` direto.
12. **three r128:** `Texture` não tem `userData` (marcar com propriedade direta, ex.: `tex.isAtlas8`). `try/catch` silencioso em listeners de opção esconde esse tipo de erro — testar a função direto no console.
13. **Personagens 3D (`S.sprite8`):** `atlas8Tex(pal, N, RES)` — jogador 16 ângulos em 2×, pedestres 8 em 1× (memória: textura por ped). `setFrame` usa `PICK8.a` (ângulo de `pickDir`) só em texturas `isAtlas8` (`dirsN` linhas). Ao animar sprite, sempre `setFrame(tex, pickDir(...), fr)` com pickDir logo antes. Rosto é textura pintada (não usar olhos em relevo: paralaxe = "vesgo"). Para trocar o visual de peds já criados: `spritesRefreshPeds()`. Peds 3D: UMA textura por roupa (`atlas8Shared`) + proxy por ped (`atlas8Proxy`, `p.tex.isProxy`); o quadro do proxy é copiado para a textura no `onBeforeRender` do sprite. Nunca dar `.dispose()` na textura compartilhada; usar `charTexRelease(tex)`. Pré-carga em `charPreload3D()`.

## Funções comuns (usar, não duplicar)
- `actorShowNow(o, mx?, mz?)` — mostra/posiciona ator imediatamente (armadilha 3).
- `weaponTick(dt)` — recarga, tiro contínuo, rastros e foguetes (armadilha 2).
- `audioCutKeepScene()` / `sceneRadioResume(k)` — corte de áudio preservando o rádio de cena (armadilha 4).
- `recordsAdd(who, text, type)` — registro de diálogo (`'mission'` = aba HISTÓRIA, `'npc'` = ALEATÓRIOS).
- `padNavFocus(dlg, dir, vec)` — navegação de menu no controle.
- `charModel3D(pal, face)` — boneco 3D (blocos arredondados, rosto pintado). Base de `atlas8Build` (sprites 3D) e `charPortrait(pal)` (retrato 192×192 com 4 variações olhos/boca, usado nos cards de modo e na caixa de diálogo). Para mudar o visual do personagem, mexer só aqui.

## Onde fica cada coisa (buscar pelo nome)
`generateCity`, `buildChunk`, `chunkLod`, `cullChunks`, `roomStageLocalTick`, `roomStageEnter`, `casinoBuild` (cassino + interior da danceteria), `clubInteriorTick`, `prologueSwitch`/`prologueCutTick` (história), `charSwitch` (troca no modo livre), `sceneRadioStart`, `padPoll`, `jailEscapeTick`, `dbTick`/`dbBuild` (pontes levadiças), `specTick`/`slowFxTick` (especiais).
- Backup: a cada atualização entregue, `backup/index.anterior.html` = a build estável anterior (só uma, substitui a antiga).
- Rodar `tools/zfight-detector.js` ao criar/alterar ambiente, cenário ou objeto (meta: 0 conflitos de z-fight).
