# Coastal Chaos: Sunset Shores — CONTEXTO

Documento de trabalho: mecânicas atuais, travas, delimitações das missões, regras de render e bugs que já existiram (para não voltarem).
O histórico completo antigo (PixelCity v1–v301, v26–v78 e v79 r1–r24, ~690 KB) foi arquivado em `backup/CONTEXT.historico.md`: consultar por `grep` só quando precisar da origem de uma decisão.
Regras de edição e funções comuns: `CLAUDE.md`. Em conflito vale: pedido atual do usuário > código > este documento.

---

## 0. Como registrar mudanças

- Cada entrega = `rN` novo (v79 recomeçou em r1). Subir `BUILD_TAG` (topo do `index.html`) e `version.txt` juntos. Zip `coastal-chaos-v79-rN.zip` com a pasta `v77/`. `backup/index.anterior.html` = build entregue anterior.
- Registrar no **§9 Registro recente** (topo da lista): causa, o que mudou, o que foi testado e o que NÃO foi. Quando uma regra nova nascer de uma correção, levar a regra para a seção do sistema (§2–§8) e enxugar o registro.
- Saves: `GAME_VER=79`, schema `v:1`, série `pixelcity-restart-1`. `saveVersionCompatible` lista as versões aceitas; não confundir com `BUILD_TAG`.

---

## 1. Base técnica

- Tudo em `index.html`: three.js r128 local (`lib/`), scripts inline, HUD em DOM/CSS, Canvas 2D para atlas/texturas/mapas, Web Audio. PWA: `sw.js`, `manifest.webmanifest`, `icons/`. Sem backend.
- Unidades: `BS=60`, `RW=16`, `P=76`, `SW=4` (calçada), chunk = 2×2 quadras. A cidade vai de **0 a `city.ext`** nos dois eixos (X leste, Z sul): o **(0,0) é o canto noroeste**, não o centro. Rios em `RY=-3`; ver `SEA_Y`/`waterLevel` antes de mexer em alturas.
- Tamanhos: 7×7 (Mobile) e 14×14 (Normal). Point Haze é ilha `N=3`.
- Determinismo: geração estática usa `R()` (mulberry32 da seed). Um `R()` a mais muda o resto da cidade. Aleatório novo na geração → gerador próprio (`const R0=R;R=mulberry32(..);try{..}finally{R=R0}`). Sistemas de jogo (trânsito, peds, clima, skatistas) usam `Math.random`/`R2`, nunca `R`.
- Mundo inteiro pré-carregado (`preloadCityRegions`); `cullChunks` + `chunkLod` (dither) cuidam de visibilidade. Esconder grupo não libera memória.
- Interiores com palco (`roomStageEnter/Exit/LocalTick`): o mundo externo é ocultado e **`update()` não roda**; só `roomStageLocalTick`. `PL.inside===true` = casa segura; demais interiores são strings (`ammo`, `shop`, `mall`, `casino`, `club`, `bank`, `jail`, `motel`, `lab`, `pawn`, `emp`, `heist`).
- Estilos de mundo: `S.style` (`modern` = Sunset Shores, synthwave, `inverted` = Upside Down) e `city.haze` (Point Haze). `buildChunk` `night` = estilo noturno (Synthwave), **não** a hora.

---

## 2. Render, luz e pixel art (áreas sensíveis)

- **Sprites de personagem = área protegida.** `makeActorLitSprite` usa `SpriteMaterial` nativo; a luz é calculada na CPU (`actorLighting0`: dia/noite, sombra nos pés/cabeça, postes próximos) e aplicada em `material.color` no `onBeforeRender`. `actorTint` preserva cores próprias (fantasmas etc.). Histórico: shaders customizados nos sprites (v184) e "refresh" forçado de todos os sprites (v254) causaram sprites invisíveis/errados ao trocar de mundo ou ligar sombras. v255/v258 restauraram; **não mexer em shader/material de sprite sem diagnóstico** (`pixelCitySpriteStatus`).
- **Pixel art reage à luz**: o jogador e os peds escurecem/esquentam com sol, lua, sombra e postes. Os postes NÃO são PointLight na cena: `nearLampLights` são luzes virtuais (4 mais próximas) que alimentam o tom dos sprites e a pintura dos carros (`carLampInject` no `carBodyMat`). Opção "Iluminação dos postes" liga/desliga halo + tom.
- **Ajuste de cor da noite** (Sunset Shores, `SKYK`): noite azul-petróleo legível. 00h topo `#101c44` / horizonte `#2a3c66`; luz da lua .27, ambiente .21, hemisfério noturno `#5266a0`, chão noturno `#232838`. Synthwave usa `SKYK_S` (paleta própria). Não escurecer de novo sem pedido.
- `charVolumeShade` dá volume às formas (só no modo 2D, chave `CHAR_SHADE`).
- **Acabamento** (`charGrade`/`CHAR_GRADE`, r29): contorno no tom da peça, grão de tecido, roupa menos saturada e pés mais escuros, feito no canvas do atlas (não no shader). **Luz por relevo** (r31, `RELIEF`/`charRelief`/`reliefSide`/`reliefApply`): variantes esquerda/direita do atlas trocadas por sprite conforme o sol/poste; nada de shader. Etapa 2 (r32): modo 3D (estúdio com `char3DLight`) e peds fora do pool.
- **Peds 3D** (`S.sprite8`, preset ALTO): uma textura por roupa (`atlas8Shared`) + proxy por ped. Roupa ainda não montada usa um **substituto parecido do pool (standIn)** até `ped3dJobTick` montar a certa. Personagens da história que viram ped (Claire/Nathan no motel, dupla, casa) passam `main:true` no `spawnPed` → `pedExact` monta na hora. `prologueCutTick` também roda `ped3dJobTick` (cutscene não roda `updatePeds`). Bug corrigido na r16: Claire aparecia como NPC comum (outra calça, botões).
- **Objetos novos nascem em (0,0,0)** até serem posicionados. Sprite/sombra dos personagens (`makeActorLitSprite`, `makeCharacter`) e a prancha (`skBoard`) nascem em y −9999; `skySpawn` posiciona o avião/heli antes de `scene.add`. Regra: **posicionar antes de pôr na cena**. Era o "pisca" no canto (0,0) desde a r1 (r22).
- Iluminação de interiores: `roomLitMat(rect, luzes≤8)` = luz por cômodo com **penumbra** perto das bordas (`ROOM_GLSL`). Interiores novos devem usá-la (cassino por ala, shopping por loja via `uSC/uSK`, 17 lojas).
- **Z-fight**: `ZF`/`zfWrap`/`zfBoxAdj` corrigem faces coplanares na montagem (MB). Builders de interior/prédio rodam dentro de `zfWrap`. Malha avulsa (PlaneGeometry, placas, telas) → afastar 6–12 mm ou `polygonOffset`. Ferramenta: `tools/zfight-detector.js` (meta 0 conflitos relevantes).
- Lotes que acendem ao anoitecer em Sunset Shores: `neonDN` / `dnSignMat()`.
- Filtro CSS do canvas tem dono (modo foto e `SLOWFX`).
- `IMPOSSIBLETOSEE` (`ITS`): troca materiais por clones de chiado por objeto (`scene.traverse(itsSwap)` todo quadro, pra quem nasce já vir com chiado), meio-dia fixo, sem sombra/neblina; devolve tudo ao desligar.

---

## 3. Travas, bloqueios e save

- **Cheat** (`CHEAT.used=true` + `syncSave()`): bloqueia salvar e as recompensas (táxi, vigilante, alvo de paraquedas, coletáveis pagos) até um jogo novo; desligar o efeito não limpa. O **TP por coordenada do MONITOR** (`monTeleport`) conta como cheat. Os pulos de checkpoint da missão (`mcpTick`) NÃO marcam cheat.
- `eventLock()` bloqueia teleporte (mapa, MONITOR) em morte, paraquedas e eventos.
- **Trava da história** (`storyOK(feature)` / `storyLocked(msg)`): `STORY_LOCKED=['motel','pawn','safe','casino','bankrob','empire','mall','tune','deal','haze','rift','synth','rampage','race','drag','duo']` liberam por progresso ou ao terminar (`STORY.cleared`). Skate usa `safe`; oficina de skate usa `tune`; loja de skate fica no shopping (`mall`).
- `prologueLocked` (missão 1): sem troca livre de personagem, sem `charOpen/charSwitch/duoSwap`; seletor e botão de troca ocultos.
- Salvar é **manual** (menu). Bloqueado: no prólogo (usa checkpoint), na cadeia, com cheat.
- No save: dinheiro, roupas, armas, garagem (`garage`, 2 vagas), **conversível permanente** (`conv`), **veículo atual com placa/documento** (`car`: `plate`, `legal`, `owned`, `slot`, `conv`), skates da garagem (`skates`), zonas de procurado, história (`story`), registros etc. `applySave` reaplica após reconstruir o mundo.

---

## 4. Missão 1 — "Um novo começo" (delimitações)

Estágios (`PROLOGUE`, Ctrl+Shift+F9 pula em debug): `dealer` → `driveFirst` (12–24 s) → `prison` (cut) → `escape` → `steal` → `driveMall` → `phoneBuy` → `sms` → `smsSend`/`smsSwitch` (cuts) → `ammo` → `motelDrive` → `blitz` (cut) → `motelGo` → `motelRoom`/`motelTalk` (cuts) → `beach` (cut) → créditos → casa.
- Checkpoints (`MCP_STAGES`: driveFirst, prison, steal, phoneBuy, sms, ammo, motelDrive, motelGo): guardam dinheiro, roupas (+`jailLook`), armas, celulares e o carro comprado; falha volta por tela preta até o checkpoint (sem marcar cheat). Limite de 45 s; se travar, missão reinicia.
- **Falha**: polícia na cola (`POL.wanted`), Nathan fora do conversível por 30 s (interiores não contam), conversível destruído, morte.
- Concessionária só vende o conversível; Nathan precisa de ≥ $7.500 (custa $6.500). Claire começa com $0; ao roubar o carro ganha $1.000 (mochila).
- **Uniforme da cadeia** (`jailWear`): camisa, calça e cinto laranja `#f07818`, sem estampa (`art:null`), boné, óculos, colar, mochila, fone ou roupa de banho; o visual anterior fica em `jailLook`. Peça laranja não trocada não é cobrada no provador.
- Fuga: cavar no canto com o guarda longe; `jailEscape` só solta em chão seco (sem água a 9 m, sem colisor; espiral de fallback) — antes podia afogar em loop no beco (r11).
- Ligação: dá ocupado → "Enquanto isso…" → Nathan recebe SMS de **NÚMERO DESCONHECIDO** (retrato `CLERK_PAL` escuro). **O retrato segue quem fala; a skin do jogador no mundo nunca muda por diálogo.** O conversível nunca ganha motorista sorteado (r16).
- **Blitz** (`blitzMake('calm')`, mecanismo único): no fade, `trafficCalm(blitz,70 m,45 s)` remove o trânsito comum em volta e impede carro novo ali → só o jogador e as viaturas (antes: batida no nascimento → polícia → falha).
- Motel Miragem quarto 6: beijo com os dois a ±0,27 m (rostos encostam). Na missão a Claire não tem ponto no mapa (`luciaMapPose` parado).
- Trocas com interior ("Enquanto isso…", corte `iswitch`) e trocas aéreas longas no mesmo mundo usam `#switchCap`, sem cartão preto.
- Fim: o conversível vira o **permanente** (§6), Claire fica independente, créditos.

---

## 5. Polícia e procurado

- Crimes vistos, ataque a viaturas/policiais e violência contra pedestres. Fuga por distância ou disfarce (roupa nova, pintura na oficina). Zona vermelha fica no mapa; roupa + carro reconhecidos reiniciam a perseguição (só um → 1 min de suspeita); 1 h de jogo longe expira.
- Shopping: policiais entram a pé e tentam prender sem atirar; provador aberto não prende.
- Maskara (item do Nathan, cheat THEMASK): disfarce, arsenal infinito, corre sobre a água.

---

## 6. Veículos, garagem e skate

- **Garagem da casa**: 2 vagas (`city.safe.slots`). Carro parado na vaga é guardado e consertado (`safeGarage`, `SAFE.stored/cars`); carro de vaga que sumiu do mundo volta pra ela. Antes de criar o carro guardado, adota um igual já parado na vaga (evita duplicado, r23).
- **Conversível permanente** (depois da missão 1): `SAFE.conv` (registro com placa) + `SAFE.convCar`. Mora na **vaga 1**, que perde a marcação amarela/P (`SAFE.pads[0]`); outro carro ali → "ESSA VAGA É DO CONVERSÍVEL". A vaga 2 é a única livre. Se sumir do mundo ou for destruído a mais de 70 m de você, volta inteiro pra vaga 1. Saves antigos: conversível guardado na vaga 1 com a missão feita vira o permanente (`convMigrate`). Será usado em missões futuras.
- **GPS** (`updateNav`): rota pelos cruzamentos a partir do nó à frente do carro (`aheadNode`); de carro respeita mão única (`canDrive`) e a linha fica na faixa da direita; a pé/barco/heli sem essa restrição. A IA da polícia ainda usa `bfsNext` sem mão (não mexido).
- Som do motor: todo veículo troca 5 marchas até ~70% da vel. máx. (`ENG_GEARS=6`, passo 14% de `vmax`).
- Rádio dos carros que passam (`BOOM`): segue o modo do rádio (ONLINE = KRFM ao vivo; servidor = pastas `radios/`, em sequência). Só carro com motorista em movimento (`boomOk`): parado, seu, da garagem, da história ou da dupla não toca. Para ao entrar em interior.
- **Skate** (`SKATE`): pickup no chão; F sobe/desce. W empurra (≤ 9,5 m/s), S freia, A/D curva com leve inclinação, Espaço pula. Bater (parede, carro, pedestre, água, atropelado) → cai deitado e a prancha para ao lado. Escala `SK_SCL=[1.69,2.25,2.25]`, jogador +23 cm (`SK_UP`). **Fica de lado na prancha** (jogador e skatistas olham pra direita do movimento). Desce sozinho ao entrar em carro/interior (fica na porta) ou trocar de personagem.
  - Garagem: skates no corredor entre as vagas, em fila a partir da parede do fundo; salvos se estiverem até 4,6 m de uma vaga. Jogo novo ganha 1 skate vermelho (RAIO).
  - SKATE SHOP: 17ª loja do shopping (2º piso). $120; shape/rodas/estampa ou TEXTO (até 6 caracteres na fonte da camiseta `SHIRT_FONT`); "dar 1 na troca" −$50. Oficina (vaga do `city.tuneSpot`) customiza por $40.
  - Skatistas da orla (`BEACH.skaters`, estado `bskate`): de dia, até 2, só no calçadão (`skTRange` = 0..`city.ext` com 10 m de folga — antes entravam na esquina da ponta da orla). Derrubados soltam a prancha como pickup (até 6 soltos).

---

## 7. Interiores e lugares (o que tem regra)

- **Cassino em +** (centro 20×14 + alas N/W/E com MB e luz próprias): N caça-níqueis; W sinuca (Seu Zé); E Liar's Dice (Dona Cida e Tonhão, aposta $50, prêmio $150; regra do RDR1 desde a r34: faces 1–6, **sem coringa**, aposta é "pelo menos" — quem duvida de 5×4 com 6 dados 4 na mesa perde; remexer o próprio copo 1× só antes da 1ª aposta da rodada; NA MOSCA (r35): conta exata → quem chamou fica salvo e todos os outros vivos perdem 1 dado (`DICE.losers`), errou → só quem chamou perde; próxima rodada começa com quem acertou; dados perdidos ficam apagados na mesa na frente do copo; botão de vista mostra a vista de DESTINO, igual na sinuca; câmera centra na faixa livre entre os painéis com `setViewOffset` — limpar no `diceClose`). Malhas do cassino precisam ser adicionadas **antes** de `casinoObjectCount` (senão vão pra cena da boate). O código da boate repete trechos do cassino: substituições devem ser limitadas à região do cassino.
- **Sinuca "castigado"** (`POOL`): pares × ímpares, bola 1 = castigo. Toda falta derruba a menor do adversário; matar o castigo antes da hora entrega o jogo. Seu Zé acerta ~40%. Mira: arrastar no canvas, ⏪ ⏩ rápido, ◀ ▶ fino. Câmera 3D segue do mesmo lado; som `poolClack` (porcelana seca) na tacada e bola×bola. Radar/HUD ocultos (`body.pool-mode`).
- **Dados** (`DICE`): física de corpo rígido; dado dormindo não é acordado por colisão; sono forçado após 4,5 s.
- Shopping: 2 andares em cruz, 17 lojas (`MALL_SHOPS`, `MALL_LAYOUT`, `MALL_CLERK_KEYS`, `mallAct`); lojas temáticas (`MALL_THEMED`) não recebem a prateleira genérica.
- Lab (Point Haze): bobinas tiram 25 hp/s; escada de saída é MB própria.
- Mapa dentro de interiores (`INBIG`) + botão VER CIDADE (C / Y no controle).
- MINIGAMES (menu de pausa, `MG`, **só Modo Livre**): atalho pros jogos do cassino; volta pro lugar de antes ao fechar o jogo. Embaixo, empréstimo do agiota (`LOAN`, $10.000, 10 h; atrasou = 3 carros de cobradores a cada 5 h até quitar, mesmo morrendo).
- MONITOR (F3): FPS/memória, SEED e X/Y/Z com COPIAR, campo + TP + COLAR (o painel tem `pointer-events:none`; o campo precisa de `pointer-events:auto`), export .GLB.

---

## 8. Bugs que já existiram (não reintroduzir)

- Sprites invisíveis/errados ao trocar mundo ou sombras (v184, v254): ver §2.
- Objetos piscando no (0,0) por 1 quadro ao nascer: §2 (r22).
- Peds da história com roupa errada no modo 3D: §2 (r16).
- Carro do jogador com motorista NPC no conversível (r16).
- Batida no nascimento da blitz (r16); afogamento em loop na fuga (r11).
- Carro duplicado na garagem ao carregar (r23).
- Rádio tocando em carro estacionado/na garagem (r17).
- Tradução: `LANG_RE` substitui chaves de `LANG_EN` **dentro de qualquer texto** (com borda de palavra). Chave curta e genérica ("SKATE", "RAIO", "SAIR") troca palavras em outros textos → usar frases inteiras; rótulos curtos traduzir localmente (ex.: `SK_EN`).
- `//` no meio de linha comenta o resto do script ("Unexpected end of input").
- Diálogo/cutscene pausam `updatePlayer`/peds: ator que chega antes do diálogo → `actorShowNow`.
- Dados do Liar's Dice presos em "roll" (dado dormindo acordado por colisão) — r13.
- Ped deitado no cais "que não levanta" = corpo do canal arrancado da água por `pedRiverWall` (r33): corpo (`p.corpse`) é isento.
- Câmera da sinuca "pulando pra Nárnia" após a tacada → follow cam do mesmo lado (r9).

---

## 9. Registro recente (v79)

- **r41** — Modo foto: o jogo fica pausado, então `setFrame` não rodava e o sprite mantinha o lado escolhido pela câmera de jogo (parecia colado na câmera; não dava pra fotografar de frente). `photoFaceTick` (chamado depois do `photoCam`) refaz só a direção via `pickDir` com a câmera de foto e reusa o último quadro (`tex._fr`, gravado no `setFrame`) → pose congelada. Jogador + peds a até 90 m; 2D e 3D (8 direções). Testado: frente/costas/lado nos dois modos. README.md e ITCHIO.txt atualizados (kickflip, fone no skate, Liar's Dice com spot on, atalho de minigames + agiota, garagem que guarda e devolve veículos ao morrer, GPS de mão única, VHS e câmera ao redor do boneco no modo foto).
- **r40** — Morreu → seus veículos voltam na hora (`homeOnDeath`, chamado no `respawnBase` só quando estava morto): carros da frota (`SAFE.cars`) e o conversível (`SAFE.convCar`) vão pra vaga, parados, com o dano que tinham; destruído continua perdido (regra da frota); carro roubado fica onde está. Skate: morrer andando manda o skate direto pra garagem; skates largados pelo jogador (`it.mine`, marcado no `skDrop`) também voltam. Antes o skate ficava na rua e sumia ao recarregar (só a garagem é salva). Testado (seed 716540).
- **r39** — Skate: boneco (jogador e NPC) pisava ~8,5 cm acima do deck (o sprite tem margem sob os sapatos) → `SK_UP` .23→.145 (só desce o boneco; a prancha fica no chão). Velocidade final dobrada de novo: `SK_VMAX=38`, aceleração 8,4, freio 12 → equilíbrio ~31,6 m/s (`SK_TOP`), 28 m/s em ~8 s. KICKFLIP (`skFlipTick`, `skHold`): pulo a ≥88% de `SK_TOP` sobe mais (jv 6,2, ~0,78 s no ar) e, segurando Espaço/✕(□ no pad)/botão de pulo, a prancha gira no eixo do comprimento a 13 rad/s; soltou, termina a volta sozinha. Pousou ainda girando ou torta (>0,3 rad) = `skCrash`. Uma volta leva ~0,48 s, então segurar mais que isso não dá tempo da segunda → tombo. Gira em torno do meio da prancha e desce até 12 cm pra passar sob os pés.
- **r38** — Garagem: história = conversível (vaga 1, fixa) + 1 carro; livre = 2 carros (o conversível só existe depois do prólogo da história); nos dois modos +1 skate no corredor (`SK_GMAX=1`, `skFull`). Com 1 skate já guardado, comprar outro vira troca obrigatória (checkbox marcado e travado, desconto `SK_TRADE`). Saves antigos com vários skates ficam como estão.
- **r37** — Skate: velocidade final dobrada (teto 9,5→19, aceleração 3,4→5,1, freio 7→9); o atrito limita na prática a ~15,8 m/s (antes ~7,9).
- **r36** — Slider de zoom vale também na vista 3D (dados e sinuca) e fica sempre visível; cada vista guarda o seu zoom (`DICE.tz`/`DICE.z3`, `POOL.tz`/`POOL.zoom` — na sinuca 3D o slider é `1-POOL.zoom`, mesma variável da roda/pinça/Q/E); `tzSync` atualiza o slider sem brigar com o dedo. Dados 3D: zoom aproxima e mira no seu copo (só avançar a câmera passava por cima do copo).
- **r35** — Liar's Dice: botão/tecla M/RB "🎯 NA MOSCA" (regra do RDR1, a IA usa quando a conta exata é provável). Zoom da vista de cima no dado e na sinuca: slider vertical na esquerda (`.tz-zoom`, `#dcZoom`/`#plZoom`, `tzVal`/`tzBump`), só aparece na vista de cima; roda do mouse e pinça (sinuca) também mexem nele. Dados: zoom aproxima e puxa pro seu copo, padrão 35%. Sinuca: altura da câmera presa em 2,6 (acima disso a câmera sai pelo teto do cassino e a tela fica vazia) — cabe na faixa livre entre os painéis abrindo a lente (`hudBand` + `setViewOffset`) e o zoom fecha a lente e segue a branca. Slider de range: a regra global `input[type=range]{width:100%}` encolhia a trilha → `width ... !important`.
- **r34** — Liar's Dice: regra do RDR1 (1 não é coringa, aposta de 1 a 6, conta só a face; IA recalibrada pra 1/6); botão/tecla R/LB-RB "REMEXER O COPO" (só seu copo, 1× por rodada, antes de qualquer aposta); dados perdidos aparecem apagados na frente do copo de cada um; câmera no celular: placar e painel compactos em telas baixas (ajuda de teclado escondida no toque) e a cena centrada na faixa livre (`diceFreeBand` + `setViewOffset`, fov até 72° e câmera recua); botões de vista (dados e sinuca) mostram para onde vão: "VER DE CIMA" / "VER EM 3D".
- **r33** — Relevo 2× mais forte: 2D ×1,22 / ×0,76 (`RELIEF`); 3D: nas variantes de lado o estúdio usa sol 1,15 e ambiente 0,42 (a de sempre segue 0,8/0,6). Bancos de praça: encosto colado no fundo do assento (antes 20 cm atrás, solto) e colisor junto. Corpo boiando (easter egg do canal, `city.body`): `pedRiverWall` tirava da água qualquer ped vivo, inclusive o corpo, e o largava deitado no cais (seed 6783, 843,8/228,7) → corpos isentos; e `bodyInWater` garante que ele nasce na água (procura até 16 m; senão não aparece). Testado: corpo fica no canal (seed 6783).
- **r32** — Luz por relevo, etapa 2: (a) **modo 3D**: o estúdio dos bonecos ganhou lado de luz (`char3DLight`: 0 = a de sempre, ±1 = rasante pela esquerda/direita da tela). O atlas único 3D (`PED3`) assa as 2 variantes no carregamento (`PED3.texV`, ~3× o tempo de montagem; ~47 MB a mais de GPU, só no preset ALTO). A fila de roupas fora do pool assa 48 fileiras (base primeiro, que já troca o substituto; variantes depois, `PED3JOB.doneV`). Jogador 3D: `atlas8Build(...,side)`. (b) **2D fora do pool** (policial, atendente, personagens da história): `reliefV` próprio no `makeCharacter`, descartado no `removePed`. `atlasCacheV` virou WeakMap. Testado: 2D e 3D em 4 direções de câmera (jogador alterna; ~60% dos peds com variante); sem erro de console. NÃO medido: tempo de montagem numa GPU real (no teste sem GPU foram 7,6 s).
- **r31** — Luz por relevo, etapa 1 (personagens 2D: jogador e pedestres do atlas único `PEDATLAS`). Sem tocar no bloco protegido: cada atlas ganha 2 variantes prontas (`charRelief`: 3 tons por faixa horizontal, luz da esquerda ou da direita da tela, ×1,11 / ×0,88; traços escuros intactos) e `reliefApply` (chamado no `onBeforeRender`) só troca qual textura o sprite usa. Lado escolhido por `reliefSide`: sol (de dia, fora da sombra, componente horizontal do sol × eixo direito da câmera) ou o poste mais forte por perto à noite; histerese ±0,42/±0,22; neutra no sol de frente/costas, sombra, interiores e modo 3D. Peds fora do pool (policiais, atendentes, personagens da história) e modo 3D ficam neutros (etapa 2). Os veículos já têm luz direcional de verdade (malha 3D com sol + `carLampInject` dos postes), então o relevo só iguala os sprites a eles. Testado: 4 direções de câmera de dia → jogador alterna esquerda/direita e ~55% dos peds visíveis com variante; sem erro de console.
- **r30** — Menu de pausa menos colorido: SALVAR azul, REGISTROS marrom, MONITOR padrão e vermelho quando ligado (`aria-pressed`), CONFIGURAÇÕES, MODO FOTO e MINIGAMES no padrão.
- **r29** — Acabamento dos sprites (itens 1–4 da conversa; o 5 = normal map ficou pra depois): `charGrade` no canvas do atlas (2D `makeAtlas` e 3D `char3DShoot`; retrato sem a sombra dos pés): contorno com o tom escuro da peça vizinha (34% + leve roxo) em vez de preto, grão fixo ±6% em blocos de 1 pixel do desenho, roupa 15% menos saturada, último quarto de baixo até 22% mais escuro (sombra de contato). Traços escuros (lum < 34: olhos, sobrancelha) intactos. Liga/desliga e intensidades em `CHAR_GRADE`. Testado: antes × depois lado a lado (2D e 3D) e no jogo. Material/shader dos sprites intocados.
- **r28** — Modo foto: filtro **VHS** (último da lista). Sem scanlines. Ao vivo: filtro SVG `#vhsF` (luma borrada na horizontal, vermelho −2 px, azul borrado +3 px) + saturação/contraste no CSS + `#vhsOSD` (PLAY ▶, SP, hora do jogo e data "NOV. 16 1996" em VT323, chiado leve e faixa de tracking embaixo, `vhsAnim` a cada 70 ms). Na foto salva: `vhsBake` refaz em pixels (YIQ com croma borrada e deslocada, preto levantado, ruído, faixa de tracking com linhas deslocadas) + OSD desenhado; a marca d'água vem por cima. `body.photo-mode>*:not(#gl):not(#photoUI):not(#vhsOSD)` (o modo foto escondia todo o resto). Testado: ao vivo e foto salva (prints).
- **r27** — Empréstimo do agiota (`LOAN`, botão vermelho no fim do MINIGAMES): $10.000 na hora, prazo 10 h de jogo (600 s). Vencimento: com ≥ $10.000 paga sozinho (só os 10 mil, popup EMPRÉSTIMO PAGO); sem isso fica `late` → a cada 5 h (300 s) `loanWave` cria 3 carros (`c.loan`, chase da polícia sem `deployCops`) que atiram de dentro a < 30 m e, com você a pé a < 13 m, soltam 2 capangas (`GANG_PAL`, `empGangTick`). Continua depois de morrer; para só quando o saldo cobre a dívida (quita na hora, popup DÍVIDA QUITADA, cobradores vão embora). Dá pra pagar antes pelo mesmo botão. Relógio por `setInterval` 1 s (anda nos interiores; pausa no menu). Save `d.loan`. `endWanted`/`wantedUp` ignoram `c.loan`. **MINIGAMES e empréstimo só no Modo Livre** (`storyOn()` → `body.story-on` esconde o botão). Testado: assinar, vencer sem dinheiro → 3 carros perseguindo, capangas descendo e tirando vida, quitar com $12.000, save/load, botão escondido na história. NÃO testado: uma perseguição inteira jogada.
- **r26** — Sinuca no toque: botões ⏪ ⏩ de mira rápida (passo 0,02 rad a cada 40 ms, acelera até 3× segurando) por fora dos ◀ ▶ finos; os controles de toque do jogo (`#touch`) somem no modo sinuca/dados (`body.pool-mode`) pra não ficarem por cima do canvas e roubarem o arrastar da mira. Testado: toque no ⏪ gira a mira (celular 844×390). NÃO testado: arrastar com o dedo no canvas num celular real.
- **r25** — GPS sem contramão: `bfsNext(a,b,true)` usa `canDrive` (respeita as ruas de mão única) quando você está de carro/moto/táxi; linha desenhada na faixa da direita do sentido (`navLaneLine`, offset de `lineType`: avenida 3,75 m, mão dupla 1,9 m, mão única no meio). Barco/heli seguem livres. Testado: 290 rotas aleatórias na seed 716540, 552 trechos na contramão antes × 0 depois, nenhuma rota perdida; mapa grande conferido. NÃO testado: dirigir seguindo o GPS na mão.
- **r24** — MINIGAMES no menu de pausa (`MG`, `mgGo`): blackjack, vídeo pôquer, roleta, caça-níquel, sinuca, Liar's Dice; entra no cassino direto na mesa e, ao fechar o jogo, volta pro lugar de antes (`DOOR.from` = posição original); mesmas travas da porta + `eventLock`; dinheiro da conta; não é cheat. Menu de pausa com cores por função (revisto na r30). Skate +50% (`SK_SCL=[1.69,2.25,2.25]`, `SK_UP=.23`) e de lado na prancha (jogador `PL.face` perpendicular; skatista `p.mx/mz` perpendicular). Testado: os 4 tipos de minigame abrem e voltam ao ponto de origem; foto do menu; skatista de perfil andando.
- **r24** — Conversível da missão 1 permanente na vaga 1 (sem marcação P), vaga 2 livre; respawn na vaga; save do veículo atual com placa, documento e vaga; `convMigrate` para saves antigos. CONTEXT.md reescrito (histórico em `backup/CONTEXT.historico.md`); CLAUDE.md revisado. Testado headless: vaga 1 recusa outro carro, vaga 2 guarda; save/load dirigindo o conversível sem duplicar; destruído longe volta. NÃO testado: missão 1 jogada até o fim.
- **r23** — Garagem adota carro igual já parado (sem duplicado); skate pela metade; skates no corredor.
- **r22** — Fim do pisca na origem (sprites, sombras, prancha, `skySpawn`).
- **r19–r21** — MONITOR: TP por coordenada (cheat), alinhado ao COPY, botão COLAR, campo clicável.
- **r18** — Skate 3× (comprimento 75%); skatistas só no calçadão; skatista preso some.
- **r17** — Rádio dos carros que passam: modo escolhido, sequência, só carro andando.
- **r16** — Conversível sem NPC; `pedExact`/`main:true`; uniforme sem estampa; beijo; `trafficCalm` na blitz.
- **r15** — Skatistas da orla; 5 marchas no motor (inclui lancha, moto, jet ski, hovercraft).
- **r14** — Skate, SKATE SHOP, oficina de skate, `poolClack`.
- **r13** — Cassino em + com penumbra; Liar's Dice; lista completa de cheats rolável; ITS sem piscar.
- **r12** — Cheat IMPOSSIBLETOSEE.
- **r11** — Fuga da Claire sem afogamento.
- **r5–r10** — Sinuca castigado (regras, IA ~40%, caçapas, câmeras, zoom, mira fina).
- **r2–r4** — Lista de debug (garagem, motel/posto, lab, Haze, ponte levadiça, conveniência, LEDs do arranha-céu, estrela cadente `METEOR`, modo foto sem personagem, mapa de interiores, estampa de 1 caractere, praça de alimentação).
