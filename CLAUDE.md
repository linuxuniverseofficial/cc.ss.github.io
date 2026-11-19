# Coastal Chaos: Sunset Shores — guia rápido para edições

Jogo inteiro em `index.html` (three r128, scripts inline). `CONTEXT.md` = contexto enxuto (mecânicas atuais, travas, delimitações da missão 1, regras de render, bugs que já existiram, registro recente): **ler antes de mexer**. O histórico antigo completo (~690 KB) está em `backup/CONTEXT.historico.md`: só `grep`, nunca ler inteiro. `README.md`/`ITCHIO.txt` são textos para jogador, não especificação.

## Regras do projeto
- Responder ao usuário em português (pt-BR).
- Toda mudança executável vai no **§9 Registro recente** do `CONTEXT.md` (causa, o que mudou, o que foi testado e o que NÃO foi). Regra nova que nasce de uma correção vai também para a seção do sistema (§2–§8).
- Servir a pasta: `python3 -m http.server 8777 --bind 127.0.0.1` e abrir `http://127.0.0.1:8777/`. Gerar cidade: input `#seed` + `#seedPlay` e depois `#mpFree` (livre) ou modo história. Seeds de referência: 716540 (danceteria, padrão dos testes), 473195072, 2812765640 (benchmark mobile), 4242, 99, 635537, 2976794230 (regressão), 653267 (orla no canto 0,0), 509166 (fim da história).
- Teste automático (quando houver Node + Playwright): Chromium headless com `--use-gl=swiftshader`; o jogo roda a poucos FPS e `dt` é limitado a 0,05 → para testar física/movimento chamar as funções direto (`updatePlayer(.033)`, `updatePeds(.033)`, `skTick`) em vez de esperar tempo real. Sintaxe: extrair o maior `<script>` e `node --check`.
- Entrega: zip `coastal-chaos-v2-rN.zip` contendo a pasta `v77/` (pasta do jogo inteira; o nome da pasta ficou por causa do deploy).
- **Combinado com o usuário:** a cada mudança entregue, SEMPRE mandar o zip (subindo `BUILD_TAG`/`version.txt`). Commit/push SÓ quando ele pedir. Zip feito da pasta de trabalho (não do `git archive`), sem `.git` e sem `online/data/`.
- Antes de recarregar a aba, lembrar que o usuário pode estar jogando nela; não mexer se ele pediu para parar.
- Sem Node à mão: checar sintaxe recarregando a página e lendo o console (`city`/`PAD` indefinidos = script quebrou).

## Estilo dos textos de tela (pedido do usuário)
- Avisos (toast/wxToast), objetivos e guias: CURTOS e não expositivos. Título direto; subtítulo só se for informação que o jogador não deduz sozinho (preço, tempo, tecla nova). Nada de narrar o que ele está vendo ou explicar o óbvio.
- Todo texto novo em PT precisa de entrada em LANG_EN (frase inteira; chave terminada em espaço não funciona no regex do translatePlain).
- `LANG_RE` troca as chaves de `LANG_EN` **dentro de qualquer texto** (com borda de palavra): chave curta e genérica ("SKATE", "RAIO", "SAIR", "IR") muda outras frases. Rótulo curto → tradução local (ex.: `SK_EN`/`skT`). Formato das linhas: `Object.assign(LANG_EN,{"chave": "valor"})` (com espaço depois dos dois-pontos).

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
13. **Objeto novo nasce em (0,0,0).** Posicionar antes de `scene.add` (ou nascer em y −9999 até o 1º posicionamento, como `makeActorLitSprite`/`makeCharacter`/`skBoard`). Senão pisca 1 quadro no canto (0,0) do mapa — que é o canto noroeste da cidade, não o centro.
14. **Cassino × boate:** o mesmo `casinoBuild` monta os dois; malha do cassino adicionada depois de `casinoObjectCount` vai parar na cena da boate. O código da boate repete trechos do cassino: em substituição por texto, limitar à região certa e contar ocorrências.
15. **Painel do MONITOR tem `pointer-events:none`**: campo/botão novo ali precisa de `pointer-events:auto`.
16. **Cutscene não roda `updatePeds`**: a fila 3D (`ped3dJobTick`) só anda em `prologueCutTick` e nos palcos; ped de personagem da história nasce com `spawnPed(null,{..,main:true,pal})` (→ `pedExact`).
17. **Garagem:** vaga 1 é do conversível permanente quando `SAFE.conv` existe (`convTick`); carro novo na garagem passa por `safeGarage`, que adota um igual já parado antes de criar outro.
18. **Personagens 3D (`S.sprite8`):** `atlas8Tex(pal, N, RES)` — jogador 16 ângulos em 2×, pedestres 8 em 1× (memória: textura por ped). `setFrame` usa `PICK8.a` (ângulo de `pickDir`) só em texturas `isAtlas8` (`dirsN` linhas). Ao animar sprite, sempre `setFrame(tex, pickDir(...), fr)` com pickDir logo antes. Rosto é textura pintada (não usar olhos em relevo: paralaxe = "vesgo"). Para trocar o visual de peds já criados: `spritesRefreshPeds()`. Peds 3D: UMA textura por roupa (`atlas8Shared`) + proxy por ped (`atlas8Proxy`, `p.tex.isProxy`); o quadro do proxy é copiado para a textura no `onBeforeRender` do sprite. Nunca dar `.dispose()` na textura compartilhada; usar `charTexRelease(tex)`. Pré-carga em `charPreload3D()`.

## Funções comuns (usar, não duplicar)
- `toast(html)` (aviso), `translatePlain(pt)` (tradução de texto solto), `money(delta, msg?)` (dinheiro com aviso), `clang(v)`/`thud(v)` (sons curtos).
- `storyOK(feature)` / `storyLocked(msg)` (trava da história), `eventLock()` (bloqueio de teleporte/minigame em morte, paraquedas, eventos), `CHEAT.used=true` + `syncSave()` (marca cheat e bloqueia save), `cheatWarp(x,z)` (teleporte seguro).
- Mundo: `groundY(x,z)`, `inWater(x,z)`, `circleVsWorld(o,r)` (empurra para fora dos colisores), `query(x,z,r)` (colisores perto), `carsNear(x,z,r)`, `mulberry32(seed)`.
- Veículos: `makeVehicle(type,x,z,a,color?)`, `removeVehicle(c)`, `syncCar(c,dt)`, `carRec(c)` (registro para save/garagem), `normPlate(p)`, `repairCar(c)`, `enterExit()`.
- Pedestres: `spawnPed(r,at)` (`at.main` = roupa exata no 3D), `spawnLying(x,z,pal?)`, `removePed(p)`, `pedExact(p)`, `say(p,txt)`.
- Interiores: `doorEnter(interior,code,out,nrm)` / `doorExit(def)` (`DOOR.from` = ponto de volta), `roomLitMat(rect,luzes)` (luz com penumbra), `zfWrap` (anti z-fight na montagem).
- Trânsito: `trafficCalm(x,z,r,seg)` (some com o trânsito comum numa área por um tempo).
- Skate: `skAdd/skRemove`, `skGaragePlace(look)`, `skMount/skDismount`, `skBoard(look)`; skatista da orla `pedSkSpawn/pedSkTick`.
- Garagem: `safeGarage()`, `convTick()`/`convMigrate()` (conversível permanente).
- Cassino: `casinoEnter/casinoExit`, `tableGameOpen(kind)` (bj, poker, roul, pool, dice), `slotOpen()`, atalho do menu `mgGo(kind)`.
- `actorShowNow(o, mx?, mz?)` — mostra/posiciona ator imediatamente (armadilha 3).
- `weaponTick(dt)` — recarga, tiro contínuo, rastros e foguetes (armadilha 2).
- `audioCutKeepScene()` / `sceneRadioResume(k)` — corte de áudio preservando o rádio de cena (armadilha 4).
- `recordsAdd(who, text, type)` — registro de diálogo (`'mission'` = aba HISTÓRIA, `'npc'` = ALEATÓRIOS).
- `padNavFocus(dlg, dir, vec)` — navegação de menu no controle.
- `charModel3D(pal, face)` — boneco 3D (blocos arredondados, rosto pintado). Base de `atlas8Build` (sprites 3D) e `charPortrait(pal)` (retrato 192×192 com 4 variações olhos/boca, usado nos cards de modo e na caixa de diálogo). Para mudar o visual do personagem, mexer só aqui.

## Onde fica cada coisa (buscar pelo nome)
`generateCity`, `buildChunk`, `chunkLod`, `cullChunks`, `roomStageLocalTick`, `roomStageEnter`, `casinoBuild` (cassino + interior da danceteria), `clubInteriorTick`, `prologueSwitch`/`prologueCutTick`/`prologueStage` (história; estágios em `PROLOGUE`, checkpoints `MCP_STAGES`), `charSwitch` (troca no modo livre), `sceneRadioStart`, `boomUpdate` (rádio dos carros que passam), `updateAudio` (motor, `ENG_GEARS`), `padPoll`, `jailEscapeTick`, `blitzMake`, `dbTick`/`dbBuild` (pontes levadiças), `specTick`/`slowFxTick` (especiais), `buildSave`/`applySave`, `beachTick`/`updatePeds`, `mallStoreFit`/`mallStoreDecor` (lojas do shopping), `POOL`/`DICE`/`ITS`/`SKATE`/`MG` (módulos com o nome no comentário de cabeçalho).
- Online: servidor `online/api.php` (PHP+SQLite, ver `online/LEIA-ME.md`); cliente `ONLINE`/`netTick`/`netFrame`/`netHit` (perto de `CHC`). Testar com `php -S 127.0.0.1:8778 -t .` (serve o jogo e a API) e duas abas. Dano novo em ped/carro: respeitar `p.net`/`c.net`.
- Build: a cada entrega, subir `BUILD_TAG` (topo do index.html) e `version.txt` para o mesmo rN (numeração: depois da v79 r49 veio **v1 r1**; depois da v1 dev r2.4 veio **v2 r1**; versão = `GAME_VER`=2 — a lista de `saveVersionCompatible` cobre 1–79, então saves da v1 abrem na v2; numa v3 futura, conferir se o número novo está na lista) — o jogo recarrega sozinho quando o servidor tem outra build.
- Backup: a cada atualização entregue, `backup/index.anterior.html` = a build estável anterior (só uma, substitui a antiga). `backup/CONTEXT.historico.md` = histórico antigo arquivado (não editar).
- Rodar `tools/zfight-detector.js` ao criar/alterar ambiente, cenário ou objeto (meta: 0 conflitos de z-fight).
