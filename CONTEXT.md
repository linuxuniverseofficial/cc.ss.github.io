# Atualização v77 — Coastal Chaos: Sunset Shores · impérios, troca de personagem, calçadas/estacionamentos, danceteria, postos, rampas, mapa e logo

- Crash reportado no v76 ao usar interiores de império NÃO reproduzido em Chromium headless (swiftshader): entrada/saída direta, 20 ciclos entrar/sair, combate até morte do jogador, respawn, limpeza do local e saída. Memória JS, geometrias, texturas e programas estáveis; colliders e grid não crescem.
- Revisão estática: sem laço infinito no código novo (empRoomFit, empGoodModel, empRoomCol/ClearCols); goods em Group não quebram empGoodDmg/empGoodsHit/rayHit/disposeGroup.
- Blindagem aplicada: (1) capangas nascem num raio de 1,3–2,6 m de (X, Z−0,5), fora dos colisores dos alvos e móveis (antes até 4 m, podendo nascer dentro dos colisores novos); (2) morte dentro do império limpa os colisores da sala; (3) handlers webglcontextlost/restored no canvas — perda de contexto da GPU mostra aviso e recarrega (salvando) em vez de travar a aba.
- Motor: three r128 via CDN, WebGL2. Chrome 157/158 (3–9 nov/2026) traz correções de segurança em WebGL/GPU; possível que o crash venha do navegador/driver. Teste decisivo pendente: rodar v75 no MESMO Chrome atual.
- Troca de personagem longa: origem do voo passa a ser a posição ATUAL (heli/carro/a pé), não camT/PL.x guardados de quando o jogador subiu no veículo. Mesmo critério na troca curta (<45 m).
- Troca longa estilo GTA V: azimute da câmera de origem mantido em subida, voo e descida (sem giro no eixo vertical). Destino a pé herda esse azimute (PL.yaw), então não há giro nenhum; destino em carro/heli gira só no arco final baixo para a câmera de perseguição. Troca curta lado a lado intocada.
- Teste isolado (switchCam em passos de 50 ms, headless): yaw constante do início ao fim a pé→a pé e carro→a pé; carro como destino gira apenas nos últimos ~0,8 s.
- Estacionamentos/pátios (todos os lotes com parkingLots): piso de concreto (side, textura de juntas da calçada) 3 cm acima do asfalto; física continua em y=0. Tom varia por lote (hash da posição). Rebaixamentos (access.cut) em concreto um pouco mais claro, RECORTADOS ao contorno do quarteirão (nada avança sobre a rua). Sobreposições entre lotes resolvidas por subtração de retângulos (sem z-fight).
- parking(): faixas amarelas, faixa de fechamento na ponta da fileira e batente de concreto (12 cm, sem colisor) no fundo de cada vaga.
- Danceteria (Malibu Flash), estilo Malibu do Vice City: pódio de 3 níveis (0,1/0,2/0,3 m) com degraus voltados à esquina, muretas rosa com arbustos, marquise azul-marinho com pilares e neon, estátua em pedestal, faixa rosa na base e contornos (neon à noite). groundY tem gancho clubPlaza (transformação inversa da rotação/escala) para o jogador subir os degraus.
- Esquina da danceteria: rua contínua em diagonal (asfalto) ligando as duas entradas pelo miolo do canto; ilha de calçada (leg 13) com canteiro gramado e palmeira. Corrigido winding da ilha (era invisível de cima). Restante do pátio em concreto.
- Danceteria encostada na rua diagonal: translação ao longo da normal da porta até a borda do 1º degrau coincidir com a linha x−z = ix1−iz0−24. Resto do pátio vira estacionamento (fileiras de 7,5 m nas bordas, parking(...,noAccess)), pulando colisores e a faixa da rua.
- Rebaixamentos: no máximo UM por quadra (parkingAccess retorna null se a quadra já tem acesso). Nas ruas estreitas, o trecho do rebaixamento na faixa extra de calçada (parkingRoadSlabs) é preenchido em concreto, sem "dentes".
- Posto (landmark e posto+concessionária): gasCompact limita o posto a ≤30 m de frente e ≤36 m de fundo (sub-frame), conveniência logo atrás da cobertura. Sobra lateral (≥14 m) ou de fundo (≥14 m) vira borracharia: galpão aberto com placa, pilhas de pneus, carcaças (uma sobre blocos), tambores, chão batido e cerca de tela. Aleatoriedade própria (mulberry32 por posição), sem consumir o R() da geração.
- Mapa/minimapa: ícone do posto desenhado DEPOIS dos POIs (fica acima do logo da concessionária).
- 2º posto (cidades N≥9): em vez de outro posto+concessionária, posto isolado na zona rural (f.d≥ZONE.houses), ≥3 quadras do 1º e ≥2,6 quadras do cemitério; fallback = posto+concessionária pontuado pela distância ao 1º. Marco com rural:true.
- isRural: marcos com rural:true (cemitério e posto rural) não forçam mais asfalto em volta — ruas de terra quando a zona é rural.
- Rampas de estacionamento (lot/dealgas): validadas na construção do chunk (rampSettle): rampa + 9 m de embalo + 6 m de pouso dentro do miolo da quadra, sem colisores e sem vagas no embalo; senão procuram outra posição/direção na quadra; se nada couber, são removidas.
- Borracharia: carcaças agora são modelos reais de carro já explodidos (buildCarMesh com exploded, geometria clonada), sem rodas, assentados no chão ou sobre blocos; cerca de tela trocada por postes + 2 travessas.
- Sombra (blob) de jogador/NPC sobe para gy+0,045 (piso de concreto em 0,03 causava z-fight).
- Estacionamento com uma fileira só: a fileira (e o batente) vai para a borda mais próxima da calçada da quadra.
- Testado: renderização headless (danceteria, lote comum, posto+concessionária e posto rural, seed 777); sintaxe dos scripts. Rampas/IA em gameplay pendentes. Jogabilidade (degraus, IA de carros no pátio) pendente.
- Mapa: ícones nunca se sobrepõem (mapIconPlace/mapIconReset por passada do minimapa/mapa grande): ícone que cairia sobre outro vai lado a lado na horizontal da tela, alternando direita/esquerda; prioridade = ordem de desenho.
- Rampas: removidas de estacionamentos/lotes especiais (lot/dealgas). Mantidas as dos becos. Novas rampas de terra na zona rural (2–6, ≥2,2 quadras entre si), no capim, decolando por cima de estrada estreita (não avenida, fora de rio); validadas no chunk (rampField: embalo de 10 m e rampa dentro da quadra, sem colisores). Até 2 viram salto 'insane'.
- Posto: grupo visual rebaixado 24 cm (sem o piso elevado; pátio assenta no concreto). Bombas/cobertura 1,5 m mais perto da calçada da frente (GAS_SHIFT); conveniência a partir de v=23,5 (GAS_STORE_V). 4 vagas na porta da conveniência (2 de cada lado), com batentes. Sem estacionamento extra em volta das bombas (sem parking() nas sobras do marco 'gas' nem baias 'special').
- Nome do jogo: "Pixel City: Sunset Shores". Título do fim do prólogo (canvas 1200x420): sol retrô listrado, "Pixel City" em Pacifico com degradê de pôr do sol e "Sunset Shores" numa faixa em degradê ciano→roxo→magenta. Menus: "Pixel City" + "Sunset Shores" em texto degradê ciano→magenta — ao lado no menu inicial e EMBAIXO no menu de pausa (coluna, sem invadir o botão ×; testado em 1000, 525 e 420 px de largura). <title>, manifest e meta atualizados.
- Cena final do modo história (prologue 'beach'), 3 atos, PROLOGUE_CINE {T:21, rise:9, logoIn:10, logoOut:15, end:20.6}: (1) travelling lateral com o casal no conversível e o pôr do sol sobre o mar atrás (câmera do lado da terra, leve dolly-in e deriva); (2) aos 9 s a câmera solta o carro, sobe 9 m e recua, abrindo para o horizonte; logo entra 10 s e sai 15–16,4 s; (3) ~4 s olhando o carro seguindo ao longe; fade para créditos aos 20,6 s. prologueCinePlan testa 99 combinações (11 azimutes × 3 distâncias × 3 alturas) uma vez e escolhe a de linha de visão livre (prédios, árvores, muros) em todo o percurso, inclusive na subida. Pular a cena usa PROLOGUE_CINE.end. ensureDetail no carro durante a cena.
- **Missões em blocos (v77).** Missão 1 (`pier`, "Um novo começo" = abertura do avião + prólogo + cena final + créditos) agora é um bloco declarado em `STORY_MISSIONS`: `script:{active, cut, begin, reset, tick, cutTick, skip, complete}` aponta para as funções `prologue*`; `world:[...]` lista o conteúdo do modo livre que ela libera. Estágios em ordem em `MISSION_STAGES.pier` (`id`, `kind:'play'|'cut'`, `objective`, `what`); `prologueStage('x')` busca o texto do objetivo nessa tabela. Missões são sequenciais por `needs`; `STORY.cleared` (cidade toda liberada) só quando TODAS as missões terminam — hoje equivale ao fim da missão 1.
- **Modo missão / modo cutscene.** `missionMode()` → `null` | `'mission'` | `'cutscene'` (abertura, créditos, cortes `PROLOGUE.cut`, troca aérea e estágios `kind:'cut'`). `missionModeSync()` (todo frame) põe `body.mode-mission`/`body.mode-cutscene`. Nos dois: monitor (#mon e botão MONITOR) e SALVAR JOGO ocultos por CSS — a preferência do monitor é mantida e ele volta sozinho depois; troca de personagem bloqueada. Só na cutscene: mapa, celular, rodas (rádio/armas), configurações e seletor de personagem bloqueados e fechados se estavam abertos. `missionUiBlocked(o)` centraliza as regras.
- **Conteúdo do modo livre oculto antes/durante a missão.** `WORLD_FEATURES` enumera o que só aparece depois da missão que o libera (`unlockedBy`): `pickups` (armas, munição, coletes, vinis — dinheiro largado continua), `tommy`, `ghost`, `forest`, `vortex`, `empire`, `side`. `worldOn(id)` é falso durante qualquer missão/cutscene e antes da missão de desbloqueio; os ticks de cada sistema checam isso e `missionWorldHide()` remove/oculta na hora o que já tinha surgido (ex.: armas perto do aeroporto na abertura).
- **Ctrl+Shift+F10 (depuração):** `missionSkipActive()` conclui a missão ativa inteira pelo mesmo encerramento do roteiro (`script.complete` → `prologueCompleteNow`: fecha diálogos/lojas, sai da cadeia/shopping, volta para Jason, garante conversível e celular da Lucia, roda o fim) e pula os créditos. Com várias missões, pula só a atual. Ctrl+Shift+F9 continua pulando um trecho. Com cheat usado, o cartão de checkpoint .psave não é mais oferecido (salvar já era proibido).
- **Teste da missão 1 (headless, cidade 7×7, seed 777, simulação avançada por passos de 1/30 s):** do avião aos créditos, todos os 15 estágios em ordem, sem erro de página. Em cada estágio conferido: modo correto, monitor oculto (ligado antes), seletor de personagem oculto, nenhum item/Tommy/fantasma/Vortex/carro de gangue à vista; depois dos créditos voltam monitor, seletor, alvos Tommy e itens. Ctrl+Shift+F10 testado na abertura, concessionária, cadeia, shopping e caminho de casa (seed 4242): sempre termina em jogo livre com `pier` concluída, sem tela preta presa nem classe de cutscene sobrando, 0 erros. Não testado: controle real por teclado/gamepad, animações em tempo real e GPU de verdade.
- **Novo nome: COASTAL CHAOS: SUNSET SHORES.** Título, meta, manifest, menu ("Coastal Chaos" + "Sunset Shores" degradê), instalar app, benchmark, mensagens do .psave e logo final. O formato interno do save continua 'PixelCitySave'/SAVE_SERIES 'pixelcity-restart-1' (compatibilidade). Logo final (canvas 1200×420, exibido em min(1100px,94vw)): sol synthwave listrado, skyline roxo com janelas ciano/rosa, palmeiras verde-água, "COASTAL CHAOS" em Fredoka 700 (Google Fonts; cai para Arial Rounded/Arial Black) com degradê e contorno roxo, ajustado à largura; "S U N S E T  S H O R E S" ciano com brilho.
- **Personagens: NATHAN (Nate) e CLAIRE (Clary)** em todo texto visível (PT, LANG_EN e locale_en_catalog.json). Apelidos usados na ligação e no reencontro. Identificadores internos (LUCIA_PAL, luciaIdleTick…) mantidos.
- **Nomes de veículos (VMODEL / vehicleModelName):** Westline Crossway (sedã), Cab (táxi), Patrol (viatura), Touring (perua); Kipwell Zip (hatch), Pocket (mini); Alderwick Overlook (crossover), Ridgeback (SUV); Granton Gravel (picape), Freight 760 (caminhão); Shorelink Parcel (van), 1100 (ônibus), Medic (ambulância — sugestão); Breakwater Runout GT (esportivo), Open Sky (conversível); Veycross Slipstream R (super), Rewind 88 (super especial da viagem no tempo); Redwick Shortwave (roadster), Quickstep 250 (moto); Harborline Tidecut 620 (lancha), Patrol (lancha da polícia — sugestão), Sprayline 300 (jet ski); Fenward Driftfin HX (hovercraft); Kestrel H4 / H4 Patrol (helicópteros). A concessionária mostra o modelo.
- **Bairros (districtAt / DISTRICT_NAMES):** ilha do pedágio → Timeless Island; faixa até 0,55 quadra da costa → Saltwater Drive; aeroporto (+14 m) → Windfield; quadra da floresta → Mistwood Forest; industrial → Iron Yard; centro denso (bld/lot/lm/park com d<ZONE.dense) → DOWNTOWN; até ~24 m de água de rio → Cedar Reach; rural ou fora da cidade → Heron Acres; casas → Almond Grove; comercial intermediário → Palm Heights (sugestão). Mundo invertido: sem nome (surpresa).
- **HUD estilo GTA III/VC/SA (#areaHud, canto inferior direito, ao lado do seletor; no toque, topo direito):** ao entrar num veículo aparece o modelo (verde, 3,6 s); ao cruzar a divisa de bairro (estável por 0,75 s) aparece o nome em Pacifico (4,2 s). Oculto em cutscene, interiores, morto e no mundo invertido.
- **Lugares em inglês (placas e legenda do mapa):** COASTAL CAR SHOP (concessionária), FAST LANE CUSTOMS (antiga Veloz e Nervoso), SUNSET ROYALE CASINO, MALIBU FLASH CLUB, TIRE SHOP, 24/7 MARKET, WINDFIELD AIRPORT, PAWN SHOP · WE BUY ANYTHING, fachadas SUNSET SHORES + POLICE DEPARTMENT / GENERAL HOSPITAL / STADIUM / UNIVERSITY / CEMETERY, SUNSET SHORES BANK; legenda: CAR SHOP, MALL, BANK, AMMO & GUNS, SUPERMARKET, GAS STATION, CITY HALL, SKYSCRAPER, IRON YARD, BEACH, SAFE HOUSE etc. Placas Mercosul mantidas. Mensagens/toasts de interface continuam em PT com tradução EN.
- Testado (headless, seed 777, 14×14): os 10 bairros aparecem e o HUD troca de nome em cada um; modelo do veículo ao entrar; menu e logo renderizados; 0 erros. Fredoka não carrega no headless (sem rede), visual final da fonte pendente.
- GAME_VER77, saves1–77. Testado: boot e ciclos de entrada/saída headless. Gameplay real em GPU pendente.

---

# Atualização v76 — Seis interiores de império distintos

- empRoomFit e empGoodModel diferenciam identidade por EMP_INFO/id: sky gráfica/impressoras/papel; mkt agiotagem/cofres/maços/terminal; univ diplomas/prensas/arquivos; stad apostas/terminais/telas; ind desmanche/motores/bancadas; air carga aérea/caixotes/paletes.
- Mantém estrutura20x14m, placa, entrada, três posições de objetivos, hp3, alcance de interação/tiros, gangues, tomada, preços, receitas e escolha posterior EMP_TYPES. Decoração representa o negócio fixo do local, não adiciona nova atividade funcional.
- Equipamentos são Groups com mesh agrupado, escala/dano e desaparecimento aplicados ao conjunto. Collider por alvo, marcado dead na destruição; prateleiras/móveis laterais e carga traseira com colisores próprios. Vias centrais livres; decoração fora do miolo de combate.
- empRoomCol rastreia colisores do interior; empRoomClearCols remove referências do grid e colliders ao entrar/sair, impedindo bloqueadores acumulados entre layouts na mesma coordenada. Casca registrada no mesmo ciclo.
- GAME_VER76, saves1–76. Testes isolados: sintaxe, geometria finita dos seis modelos/salas, flood fill com raio.3m até os três alvos, destruição liberando colisão e limpeza entre seis reconstruções. Aparência/combate reais pendentes.

---

# Atualização v75 — Safe house: acabamento e colisões

- Mudanças limitadas a buildSafehouse; worldSafeFurn compartilhado com outras casas/mundos não alterado.
- Colisão da cama ajustada ao móvel, criado-mudo separado; cozinha separada da geladeira, eliminando bloqueador sobre vãos. Mesa de centro recebe footprint circular aproximado em oito faixas; banquetas, luminária e vaso com colisão. Guarda-roupa inclui puxadores/frontais.
- Completa hastes inferiores das banquetas, rodapés, moldura da entrada, cortinas/peitoril, backsplash, puxadores e acabamento do fogão/coifa/geladeira, bilhete, controle remoto, console e detalhes da cabeceira/criado-mudo. Sem novos pontos de interação nem luzes dinâmicas.
- TV/tela/canais, cama/save, guarda-roupa, coordenadas da casa e saída mantidos. GAME_VER75; saves1–75.
- Sintaxe e limites/finitude da geometria adicionada verificados; flood fill com raio.28m confirma caminhos da entrada até TV/cama/guarda-roupa/saída. Renderização e circulação real pendentes.

---

# Atualização v74 — Oficina Veloz e Nervoso

- Alteração apenas no ramo tune do galpão garage dentro da geração de chunks. Mesmo local frame u/v da fachada, com colisores transformados nas quatro orientações. Não é interior separado; mantém isoCapture e iluminação existente.
- Armários com gavetas e ferramentas, bancada traseira com morsa/motor/diagnóstico, pneus com aros, compressor, colunas de elevador decorativo, marcações de piso e luminárias. Colisões nos volumes sólidos; braços baixos/markings não bloqueiam a passagem.
- Preserva tuneSpot, raio/velocidade de ativação, preços, menu, upgrades e garagem especial DeLorean. Sem mecânica nova de elevador nem luzes dinâmicas adicionais.
- GAME_VER74, saves1–74. Sintaxe, limites/finitude da geometria, quatro orientações e faixa central de2.8m livre até8.1m de profundidade testados isoladamente; trigger/menu comparados ao v73. Manobra real e visual pendentes.

---

# Atualização v73 — Câmera interna e relógio do banco

- interiorCameraHeight aplica teto vertical do banco em todos os interiores:2.75m em TPS normal,2.7m em mira sobre ombro. Aplicado no alvo e após suavização; mantém limites laterais, câmeras externas, primeira pessoa e cinematográficas. Não bloqueia PL.pitch nem altera mira.
- Relógio do banco com marcas de horas e dois ponteiros geométricos. bankClockTick lê horário LOCAL DO APARELHO (Date; não relógio acelerado do jogo), atualiza ângulos no máximo uma vez por segundo enquanto no banco. Hora incorpora minutos, minutos incorporam segundos; sem recriar textura a cada tick.
- GAME_VER73, saves1–73. Sintaxe, limites dos interiores e ângulos do relógio testados isoladamente; conferência visual pendente.

---

# Atualização v72 — Banco: mobiliário e colisões

- Corrige cadeiras sem assento, orientação do encosto e colisões individuais. Retira colisores largos que fechavam vãos entre bancos/cadeiras; balcão principal passa a colidir até a borda real da tampa. Colunas concentradas junto às laterais, retirando coluna do eixo central.
- Mesas traseiras afastadas dos spawns dos atendentes. Acrescenta monitores, documentos, divisórias/suportes, mesas de apoio, gavetas de segurança, detalhes do ATM, luminárias e câmeras decorativas. Colisões de mesas, colunas, vasos, cofre e postes de fila; preserva eixo central de circulação.
- Placa da fila recebe suporte no teto. Letreiro e relógio retirados de trás do cofre. Vidros dos caixas com opacity.32 e depthWritefalse.
- bankEnter em diante (NPCs, spawns, assalto, pagamento, cofre, entrada/saída) idêntico ao v71. GAME_VER72, saves1–72. Testados sintaxe, construção com mocks/coordenadas finitas, spawns dos dez NPCs livres e flood fill da entrada aos três guichês com raio.3m. Renderização e comportamento real de colisão em gameplay ainda não verificados.

---

# Atualização v71 — Danceteria: mobiliário e colisões

- Remodela bar com balcão estreito e corredor de serviço; remove volume sólido envolvendo bartender e grades genéricas. Prateleiras, garrafas e copos; colisores acompanham balcão/tampa/armário.
- Sofás e mesas laterais com colisão; vasos retirados do balcão e posicionados com colisores individuais. Pista central e eixo de entrada livres. Caixas de som recebem suportes.
- Equipamento de DJ atrás dos dançarinos do palco, monitores, acabamento de paredes, treliças/luminárias de teto e placa de saída. Sem luzes dinâmicas adicionais. Decoração do palco permanece dentro do colisor existente.
- Spawns, CAS.bar, entrada/saída, rádio, bebidas, danças e pulos preservados. Alterações limitadas ao trecho de construção da danceteria em casinoBuild; cassino mantido.
- GAME_VER71; saves1–71. Sintaxe, construção com mocks, coordenadas finitas, acesso à pista/bar por flood fill com raio0.3m e posição livre do bartender/entrada verificados. Código de lógica/NPCs comparado ao v70, idêntico. Conferência visual e circulação real ainda pendentes.

---

# Atualização v70 — Cassino: colisões e acabamento

- Corrige faces laterais das cadeiras (qa orientado pelo centro), antes com normal fixa e winding incorreto. Completa assentos dos slots; remove bases isoladas sem banco.
- Substitui bloqueador contínuo de slots por colisores individuais dos gabinetes/bancos. Mesas usam 12 faixas aproximando elipse/círculo; cadeiras, vasos e balcões da entrada passam a ter colisões. Bar/caixa reduzidos em profundidade e colisores ajustados às tampas. Vasos antes embutidos nos balcões reposicionados.
- Cartas, bandejas, pilhas de fichas, copos, terminal do caixa, espelhos e roda da roleta decorativa. Mantém blackjack/videopôquer e cinco slots funcionais, sem adicionar mecânica de roleta. Separação visual cassino/danceteria preservada, lógica de jogos/entradas/saídas inalterada.
- GAME_VER70, saves1–70. Sintaxe, construção com mocks, winding dos meshes agrupados, separação das cenas e flood fill com raio0.3m da entrada até áreas de interação das sete estações testados. Lógica após casinoBuild comparada textualmente ao v69, idêntica. Renderização e circulação real ainda não verificadas.

---

# Atualização v69 — Remodelagem visual da cadeia

- Alterações limitadas ao buildJail e versão. Corrige junções superiores/laterais da divisória, preservando plano único da parede de fuga em X+4.02; sem alterar decals da escavação.
- Beliche com quatro montantes, escada, colchões, travesseiros e cobertores; remove cama estreita que atravessava divisória. Prateleira fixada na parede. Sanitário/pia metálicos reconhecíveis, torneira, espelho em moldura e janela alta gradeada decorativa.
- Paredes em dois tons, rodapés, luminárias compactas e conduíte. Placa CELA01 sobre suporte na grade; saída alinhada à verga; remove placa duplicada da sala do guarda. Porta modelada aberta junto ao batente.
- Mesa/armário/cadeira do corredor afastados do trajeto x±4.7; banco encostado à parede traseira fora da diagonal da ronda. Nenhuma colisão funcional adicionada/alterada; móveis permanecem visuais.
- JAIL_PATH, guard movement, spawns, prisão/fiança/fuga, tempos, hole/mark, uniforme e interações preservados. Verificação textual do bloco de mecânicas idêntico ao v68. Sintaxe, construção de meshes, finitude/orientação das faces e spawn do guarda testados isoladamente. Conferência visual em gameplay pendente.
- GAME_VER69, saves1–69.

---

# Atualização v68 — Atmosfera interna e fachada do shopping

- mallBuild: vidro removido do batch hwin (emissão excessiva noturna), passa ao det com tom azulado moderado; acrescenta montantes, painéis entre pisos, vitrines estilizadas, faixas localizadas, puxadores e acabamento/iluminação da marquise. Letreiro principal com fundo escuro em ambos os estilos. Mantém porta, normal e footprint.
- mallRoom: paleta de arquitetura mais suave, piso com menor contraste e claraboia menos branca. mallGalleryFit acrescenta sancas e faixas duplas ciano/magenta nos dois andares e tintas suaves no teto, agrupadas no mesh existente. Sem novas luzes dinâmicas ou partículas. Cafeteria/mallStoreFit preservada.
- GAME_VER68; compatibilidade saves1–68. Sintaxe, geometria/normal das faces em dois andares e dois estilos, acesso aos pontos de compra e café verificados isoladamente. Aparência final e desempenho não verificados em navegador.

---

# Atualização v67 — Shopping detalhado e cafeteria

- Corrige triangulação das caixas espelhadas do shopping com mallBox (normalização de limites X/Y/Z), sem alterar ibox global nem outros interiores.
- mallStoreFit: cafeteria substitui móveis genéricos por balcão, máquina de espresso, moinho, vitrine de doces, mesas, poltronas, vasos, pendentes e parede ripada. Tons quentes e manchas de luz pré-calculadas nos vértices; sem novas luzes dinâmicas. Café mantém preço $5, cura 25 pontos (25% da vida máxima100), respeita teto e saldo; prompt atualizado.
- Eletrônicos: balcão de atendimento, monitores com molduras/interfaces, expositores de celulares e caixas de acessórios. Todas as lojas recebem acabamento/prateleiras e produtos; detalhes específicos em discos/farmácia. Remove antigos blocos de fundo que ocultariam as novas prateleiras.
- mallGalleryFit: pilares frisados, acentos ciano/magenta em todos os estilos, bancos com encosto/apoios, lixeiras, vegetação e fonte em patamares com filetes de água estilizados estáticos. Fonte replicada no cenário inferior visto pelo vão do andar superior.
- Mantém dois meshes principais e sistema de materiais/visibilidade existente. Geometria nova agrupada; sem loops de partículas nem sombras/luzes extras. Bancos, mesas e poltronas possuem colisão; pontos de serviço e gatilhos de andares preservados.
- GAME_VER67, saves1–67. Validados sintaxe, geração dos dois andares em estilos dia/noite, orientação das faces e acesso aos pontos de compra, cura/cobrança/vida cheia/saldo insuficiente em testes isolados. Renderização e navegação visual no jogo ainda precisam de conferência; desempenho não medido.

---

# Atualização v66 — Ícones progressivos, interiores e lado da orla

- storyMap deixa passar GPS/missão; locais seguem STORY.map com aliases pol/police, hosp/hospital, mkt/super etc. Remove bypass de propriedades/heists e legenda. Aeroporto na chegada; concessionária/posto ao começar objetivo; delegacia na prisão; shopping na sua etapa; casa no reencontro; praia/paraquedas no passeio. Encerramento não revela tudo. Após conclusão, proximidade85m descobre categorias de locais (persistidas no save existente).
- updateCamera envolve gameplayCamera com override temporário TPS próximo tpz1 para Lucia na prisão/shopping durante prologue. Restaura preferências após resolver câmera; não muda câmera externa dos personagens.
- Órbita inicial da praia invertida180°: câmera lado cidade, mar atrás do carro. Âncora do título/subida vertical mantidas.
- GAME_VER66; saves1–66. Sintaxe e revelações/câmera isoladas verificadas; validação visual pendente.

---

# Atualização v65 — Título final dobrado

- Largura CSS do canvas prologueTitle672px/78vw→1344px/156vw, duplicando texto e acabamento em todos os tamanhos. Crescimento relativo25% e fades preservados.
- GAME_VER65; saves1–65. Sintaxe validada.

---

# Atualização v64 — Blitz mais próxima

- TV: raio23→11.5m, altura15→8m (metade do deslocamento vertical em relação ao foco y1). Abordagem da campanha: offsets8/5→4/2.5 e altura4.1→2.55m, mesmo critério. Usa broadcastSafeShot também na inspeção do jogador para evitar fachadas. Câmera normal de condução livre preservada.
- GAME_VER64, saves1–64. Sintaxe validada; confirmação visual pendente.

---

# Atualização v63 — Debug pula deslocamentos, preserva interações

- Ctrl+Shift+F9 encerra toda introdução aérea em um acionamento. Etapa dealer transporta Jason ao vendedor sob fade e abre compra real; não concede carro. phoneBuy abre loja real, sem conceder aparelho.
- Etapa home leva carro/personagem parados à casa sob fade e chama prologueTick para spawn de Lucia e reencontro normal; evita iniciar cut dentro do callback de outro fade.
- Fuga usa jailEscape, trechos driveFirst/driveSecond avançam às trocas previstas. Diálogos/cutscenes seguem suas continuações. Cheat continua bloqueando save/recompensa.
- GAME_VER63; saves1–63. Sintaxe e encaminhamento de voo/concessionária/casa testados isoladamente; gameplay completo pendente.

---

# Atualização v62 — Pulo secreto de etapas para debug

- Ctrl+Shift+F9, somente teclado, fora de listas e sem controle. missionDebugSkip priorizado antes das travas de cutscene/diálogo. Ignora repetição/campos editáveis e menus.
- Marca CHEAT.used e syncSave, sem salvar; bloqueios existentes de save/recompensas aplicados. Usa callbacks de diálogos, fades, troca, prisão, blitz e shopping existentes. Cada acionamento avança trecho atual: cut termina; diálogo executa continuação; gameplay resolve objetivo. Na cela, jailEscape real sob fade; escaped mantém2s antes da blitz.
- Dealer concede conversível debug; compra de telefone concede iPixel. Casa posiciona carro antes de iniciar reencontro. Introdução/créditos usam storySkipPart.
- GAME_VER62, saves1–62. Sintaxe validada; sequência completa requer teste em gameplay.

---

# Atualização v61 — Plano final do carro se afastando

- A partir de8s, no mesmo momento do surgimento do título, prologueOrbit captura finalAnchor da câmera. X/Z fixos; orientação continua lookAt no carro em movimento. Órbita/acompanhamento encerram nesse trecho. Elevação vertical3m em10s com smoothstep; título/fade anteriores mantidos.
- finalAnchor limpo a cada prologueBeachBegin. GAME_VER61; saves1–61. Sintaxe e posição/mira verificadas isoladamente; validação visual pendente.

---

# Atualização v60 — Final obrigatoriamente na orla e limpeza mobile

- Busca maior trecho seco contínuo na orla, três posições laterais da avenida, amostras1m; aceita trechos menores que36m. Remove fallback para blitz no interior. Trajetória usa deslocamento lateral selecionado.
- Órbita raio9m (50% do anterior), elevação5° (aproximadamente30° abaixo dos31° anteriores), lado do mar; prevenção de obstrução mantida. Título inteiro20% maior por CSS (672px/78vw); escala animada relativa1→1.25 mantida.
- Mobile oculta menuBtn duplicado e jailBailTag. Cutscenes ocultam storyGuide/contextos e entrada da orla limpa prompts. Retira frase de espera30s dos tutoriais, mantém lógica de expiração.
- GAME_VER60, saves1–60. Sintaxe validada; enquadramento visual pendente.

---

# Atualização v59 — Estado de câmera após créditos

- Trocas longas da campanha e livre já compartilham switchCam/switchCameraPrepare. Preparação comum remove roll residual da orientação cinematográfica usando Euler YXZ.z=0 antes de derivar nadir.
- storyCreditsHome, incluindo pular créditos, limpa SWITCH/CAMHOP/CAMX, LOOK e up; resolve câmera gameplay com updateCamera(0,true) sob preto e sincroniza chasePos, camT/camH. Evita filtros herdando pose orbital dos créditos na liberação.
- GAME_VER=59; saves v1–v59. Sintaxe validada; confirmar sensação e rotação visual em gameplay.

---

# Atualização v58 — Órbita final e título Sunset Shores

- Cena da orla: órbita contínua .065rad/s, raio18m/altura11m sobre foco, mais perto que blitzTV23/15. Inicia do lado do mar. Sem mudança abrupta de azimute nem câmera lateral que para/subida fixa.
- prologueOrbitRadius verifica obstruções da linha de visão (bldAt/roofTop, margem1.8/2.5m). Antecipação1s de trajetória e ângulo reduz raio antes da fachada; suavização retração5/s e expansão1.4/s, limite final impede interpolação através do prédio. Sem raycast de triângulos ou render extra. Fallback muito apertado eleva acima do obstáculo.
- Título canvas Pixel City usa MAP_TITLE.modern: Pacifico, #ffd27a, sombra #c2410c e contorno preto, como Sunset Shores. Surgimento2s a partir8s, escala1→1.25 suave até18s. Fica abaixo de storyBlack; fade da cena cobre também título, ocultado somente quando preto completo antes da colocação na casa/créditos.
- GAME_VER=58; série v1–v58. Sintaxe/geometria isoladas verificadas; conferir enquadramento no jogo.

---

# Atualização v57 — Botão mobile Interagir

- Botão INTERAGIR dedicado em tbtns, coluna3/linha2 (espaço livre quando a pé), destaque discreto dourado. Usa tamanho responsivo existente. Buzina preservada e redistribuída pela grade quando dirigindo.
- touchInteract chama interação primária ctxAct(1), incluindo carregar ferido (medLoad) e pulso de escavação da cela como tecla E. Não converte interação em buzina. Entrar/sair mantido.
- GAME_VER=57, saves v1–v57. Sintaxe e encaminhamento da ação testados isoladamente; confirmação visual no aparelho pendente.

---

# Atualização v56 — Celular interativo por toque

- Canvas do telefone gera regiões clicáveis junto do desenho (PHONE.hits). Coordenadas CSS convertidas para120×232, independentes de resolução/DPR. Teclas usam phoneOK; menus, agenda, PIXel, lanterna e confirmações usam funções existentes; mensagens selecionadas são marcadas lidas. Swipe vertical nas mensagens navega histórico.
- phoneBindTouch evita click sintético duplicado, ignora cancelamento/multitouch e deslocamento como clique. Mouse também pode clicar diretamente. Teclado/controle preservados.
- Mobile: altura acompanha100dvh/safe-area, proporção original preservada; botão FECHAR de44px fora do canvas. Fechamento automático da campanha também limpa botão.
- GAME_VER=56; saves v1–v56. Sintaxe e coordenadas/eventos verificados isoladamente; validação física pendente.

---

# Atualização v55 — Toque no mapa e diálogos

- Mobile: toque simples marca waypoint via setMarker (preserva bloqueio GPS de missão e cheat teleport); mapa permanece aberto. Botão VOLTAR exclusivo de body.touch, 44px, safe-area, fecha mapa/legenda. Desktop mantém clique para fechar e botão direito para marcar.
- Touch dedicado: deslocamento >12px, multitouch e cancelamento descartam gesto; touchend preventDefault e janela 800ms suprimem click sintético duplicado. Coordenadas usam bounding rect e escala real do canvas.
- dlgTap delegado no painel: revela texto incompleto, próximo toque avança. Opções são botões de 44px com índice explícito; toque fora não aceita escolha padrão. Teclado/controle mantidos. Dica mobile traduzida TOQUE PARA CONTINUAR.
- GAME_VER=55, série v1–v55. Sintaxe e testes isolados de eventos/diálogo; confirmação física mobile pendente.

---

# Atualização v54 — Troca distante em duas curvas e pernas verticais

- `switchCameraPrepare/Destination/switchCam`: saída usa a metade ascendente de CAMHOP (posição aproxima centro + pitch local até nadir), depois sobe mantendo X/Z constantes. Travessia aérea resolve diferença de azimute entre câmeras; descida mantém X/Z do destino, seguida da curva inversa de pitch para seu enquadramento. Não mistura azimutes na chegada.
- Duração 5.8s: curva .8, subida1.2, travessia1.8, descida1.2, curva .8. Smoothstep em todas as etapas. Lente inicial e final interpoladas; altura baixa relativa à câmera/personagem. Orientação/posição final capturada uma vez; sem destino móvel pela própria interpolação.
- `updateCamera(dt,snap=false)` permite resolver filtros de posição com cameraStep grande, sem avançar dt de timers/input. Captura após charEnter, restaura pose cinematográfica. Na conclusão chasePos recebe destino final para continuidade. Mundo livre e prologueSwitch compartilham preparação; troca curta e viagem entre mundos não alteradas.
- Referência de linguagem visual: https://gta.wiki/w/Switch_Scenes (vista aérea, afastamento, aproximação). Implementação própria.
- GAME_VER=54; saves da série v1–v54 aceitos. Testes com Three.js r128: 81 pares de azimutes, X/Z constante nas pernas verticais, eixo direito constante na curva de chegada, continuidade nas quatro junções, pose final e frame longo. Sintaxe aprovada; sem confirmação visual no jogo.

---

# Atualização v53 — Checkbox de inversão da direção

- Sem tick = eixo DualSense corrigido normal; com tick = negação desse eixo. `motionInvert` zera suavização anterior ao alternar para não carregar direção do estado oposto.
- `cfg.motion.dirVersion=2`: configuração antiga da fonte DualSense não herda flag de inversão usada para compensar o eixo da v51. Primeira carga fica desmarcada; escolhas feitas desta versão em diante persistem normalmente. Fonte celular preserva inversão anterior.
- GAME_VER=53; série v1–v53 aceita. Sintaxe e semântica de migração verificados; eixo físico confirmado pelo usuário na v52.

---

# Atualização v52 — Sentido do volante DualSense

- Sinal da inclinação lateral do DualSense corrigido em `motionDualInput`: negativo de atan2(ax,hypot(ay,az)). Esquerda física deve agora produzir direção à esquerda com Inverter desmarcado. Não altera eixo do celular, acelerador/freio ou opção manual de inversão.
- GAME_VER=52; aceita série v1–v52. Sintaxe e sinal de amostras USB/BT verificados; confirmação física pelo usuário pendente.

---

# Atualização v51 — Direção por inclinação DualSense e celular

- Configurações → Controle → Direção por movimento: fonte Off/DualSense/Celular, ativar/autorizar, centralizar, sensibilidade25–200%, zona morta0–10°, inverter. Desligado por padrão. Preferências em cfg/save; calibração física não persiste.
- `MOTION`: amostra, centro, timestamp, saída suavizada; `motionSteer(dt)` aplica deadzone, saturação em35°/sens e filtro exponencial12/s. Após650ms sem dados, retorna null e direção volta aos comandos normais. Não modifica analógicos de menus/pedestre, só `st` no ramo PL.car. R2/L2 e aceleração/freio mantidos.
- `motionDualBind/Input`: listener WebHID no dispositivo autorizado. USB inputID1>=63bytes usa accel21/23/25; BT inputID0x31 usa+1. Rejeita report simplificado/curto e gravidade inválida. Inclinação lateral relativa à gravidade atan2(ax,hypot(ay,az)), sem integrar giro e sem drift acumulado. Usa acelerômetro da IMU, não taxa de giro como volante. Centro automático na primeira leitura e botão de calibração manual.
- BT tenta feature0x05 ao abrir para habilitar relatórios completos. Leitura independe de resistência dos gatilhos e da luz; reconexão contempla fonte dual. Não abre sensores Steam Deck via HID da Sony.
- `motionPhoneInput/Angle`: DeviceOrientationEvent beta/gamma, compensa screen.orientation.angle ou window.orientation. Verifica contexto seguro e API, solicita requestPermission em gesto de ativação quando exigido. Ao mudar orientação exige novo centro; blur invalida valor e libera aceleração. Opera no aparelho onde o jogo está aberto, não é controle remoto de outro PC.
- Touch: botões dedicados Acelerar e Frear/Ré no modo celular dirigindo. Freio de mão preservado. Direção isométrica por analógico touch é suspensa apenas enquanto sensor válido para não sobrescrever volante; sem dados conserva fallback anterior.
- Steam Deck: orientação no menu para Steam Input mapear gyro ao analógico esquerdo, deixando sensor web desligado. Não embute biblioteca nativa Steamworks no HTML, não promete gatilhos adaptativos/alto-falante/luz de DualSense no hardware Deck. Referências: https://partner.steamgames.com/doc/api/isteaminput ; https://partner.steamgames.com/doc/features/steam_controller/input_source_modes ; DeviceOrientation MDN e nondebug/dualsense explorer.
- Testes isolados: sintaxe, centro/deadzone/inversão/suavização, fallback por amostra expirada, offsets USB/BT e rejeição de pacote curto, compensação de orientação nas duas paisagens. Ainda sem validação física da sensação de direção, sinal dos eixos ou dispositivos reais; botão Inverter permite ajuste por aparelho.
- GAME_VER=51; série v1–v51 aceita. Histórico preservado abaixo.

---

# Atualização v50 — Painel DualSense, volume, luz e Linux

- Configurações → Controle com painel dedicado DualSense: conexão, gatilhos, áudio e barra luminosa. Retirada etiqueta experimental. Aviso explícito de reconectar controle e fechar todas as janelas/reabrir navegador após setup Linux, conforme teste do usuário.
- Submenu expansível “Para Linux”: comando udev completo cobre DualSense/Edge, USB/Bluetooth, arquivo 70-pixelcity-dualsense.rules, MODE0660/TAGuaccess, reload e trigger filtrado hidraw. Botão copia via clipboard; fallback seleciona texto para Ctrl+C. Nada executado pelo jogo; orienta terminal/senha, reconexão e autorização no navegador.
- `PAD.speakerVolume` (0–1, padrão1) multiplicador exclusivo do contexto opcional de bipe. `PAD.speakerEnabled` liga/desliga roteamento; desligado usa bipe normal. Preferências persistem em cfg/save existente. Saída escolhida continua transitória/permissão de sessão. Não altera saída/volume normal nem rádio/sirene.
- `PAD.lightbar` independente de gatilhos e áudio. `dualHealthColor`: interpolação contínua verde[32,214,96] em100, laranja[255,149,26] em50, vermelho[255,32,32] em15 ou menos. Usa PL.hp atual, que é restaurado pelo kit de cada personagem na troca.
- `dualLightColor`: feedback desligado = azul fixo[40,100,255]. Se ligado e POL.wanted, alterna branco/vermelho a cada450ms, com prioridade sobre vida; terminado wanted, volta ao gradiente de saúde. Resultado faz parte da chave da fila para enviar mudanças mesmo com gatilhos idênticos.
- Pacote comum RGB nos offsets44–46, flag1 bit2 (0x04), sem habilitar campos de áudio/microfone/rumble. Setup de luz separado (flag2 bit1, offset38; setupLIGHT_OUT2 offset41) aguardado em dualOpen. Referência estrutural: driver Linux hid-playstation.c e nondebug/dualsense WebHID explorer.
- Corrigido tamanho de output USB: antes62bytes, descritor de referência usa47 (sem ID). `dualOutputSize` consulta relatório HID anunciado inclusive children e usa47USB/77BT como fallback. CRC BT recalculado após RGB. `dualOpen` aguarda primeiro sendReport e só então considera autorização concluída. Teste físico dos gatilhos ainda pendente; áudio confirmado pelo usuário na v47 após reiniciar navegador.
- `dualTick` continua luz com gatilhos desligados, liberando resistência; não escreve durante conexão. Fluxo serial e limites de90ms preservados. Desligar feedback envia azul fixo. Config defaults e UI sincronizados.
- Testes isolados: scripts parseados, cores e prioridades por vida/perseguição/feedback off, mudança de vida do personagem ativo, comprimento USB47, offsetsRGB, flags de áudio intactas e checksumBT. Sem controle físico para validar luz/gatilhos.
- GAME_VER=50; aceita série v1–v50. Histórico preservado abaixo.

---

# Atualização v49 — Sem quadrado preto atrás do buraco

- Removido plano retangular escuro `holeShade` da criação da escavação. Mantidas textura recortada do buraco e marca de parede. Referência permanece null; verificações legadas condicionais continuam seguras.
- GAME_VER=49; série v1–v49 aceita. Sintaxe verificada.

---

# Atualização v48 — Face única na parede de fuga

- Parede direita da cela removida do batch de blocos DoubleSide. Substituída por painel com um único quad orientado para dentro (normal -X), FrontSide, escrita/teste de profundidade normais, em X+4.02. Borda recuada .01/.02m para não coincidir com fundo/grade.
- Posição da colisão permanece clamp da cela. Decais continuam no lado interno em X+4.01/3.99/3.97. Parede esquerda e demais estruturas preservadas. Painel pertence ao mesmo grupo e sistema de recorte do interior.
- Isso remove faces traseiras e tampas do bloco nesse trecho; não se altera near/far global nem depthTest de outros objetos. Sintaxe e orientação/separação geométrica verificadas; resultado visual ainda precisa ser confirmado em gameplay.
- GAME_VER=48, aceita série v1–v48.

---

# Atualização v47 — Teste de bipe em saída do controle

- Configurações → Controle: autorização de saídas, seletor explícito e testar bipe. `PAD_AUDIO` mantém AudioContext separado com setSinkId para notificações de mensagem; mixagem/radio/sirene não são redirecionadas.
- `phoneBeep` roteia apenas quando sink pronto e Gamepad conectado. Sem configuração/controle ou em falha da saída, usa `phoneNormalBeep` original. Volume respeita master/sfx e som desligado; duas notas de 1320 Hz idênticas. Retorno para saída normal fecha contexto opcional.
- Seleção usa selectAudioOutput quando disponível; fallback enumera saídas e, só após clique de autorização quando necessário, solicita microfone para revelar rótulos/IDs, encerrando tracks imediatamente. Nada é gravado. HTTP fora de localhost e API ausente exibem status; contexto original é preservado.
- Devicechange invalida sink removido. Preferência não é persistida entre sessões (permissões/IDs transitórios). Não assume que nome DualSense equivale a alto-falante embutido: OS/driver podem expor headset, e suporte deve ser testado no hardware. USB recomendado; sem protocolo proprietário de áudio Bluetooth.
- GAME_VER=47; aceita série v1–v47. Sintaxe e roteamento/fallback verificados com mocks; sem DualSense físico para validar alto-falante.

---

# Atualização v46 — Título conforme referência

- `prologueTitle`: PixelCity com caixa mista, Segoe UI/system-ui peso 800, amarelo #ffcf32, sombra escura deslocada, sem contorno rosa nem fonte pixel. Mantidos posição central, tamanho médio e momento de exibição na subida da câmera da orla.
- Inclui todo lote v45 (cela, prompts, áudio, janela motorista, câmera protegida, fade, créditos 24h e fonte normal nos menus).
- DualSense atual usa WebHID para gatilhos; não há roteamento de áudio para alto-falante do controle implementado. Essa etapa foi consulta técnica, não pedido de habilitação.
- GAME_VER=46; aceita série v1–v46. Sintaxe verificada; validação visual pendente.

---

# Atualização v45 — Acabamento de prisão, transições e encerramento

- Cela: face interna da parede direita é X+4.02. Decais agora em X+4.01 (sombra), X+3.99 (buraco), X+3.97 (marca), todos para dentro da cela, renderOrder 2/3/4 e polygonOffset. Elimina coplanaridade da textura principal com parede. Mantém geometria/textura e escavação/reset compartilhados.
- HUD de cela: só estado do guarda e percentual de túnel; removidos relógio da pena, contador da colher e texto direcional. `ctxp` não repete pena/fiança restante na cela; tag de fiança ainda existe na grade. Penas internas mantidas.
- `transitionPromptClear`: oculta avisos de cela, fiança, loja e interação, limpa cache e CTX ao iniciar cut/troca e ao reassumir personagem. Mantém conteúdo estático dos elementos para reaparecimento correto. Resolve texto de prisão na blitz e loja depois do shopping.
- `blitzDriverWindow`: alvo em Z local negativo (mesmo lado do motorista em convRiderTick), afastamento W/2+.65. Usado por abordagem player e NPC; não duplicado para a missão.
- `prologueReunion` chama `transitionAudioStop` antes de sair do carro/caminhar/conversar. Motor não fica sustentado durante sequência congelada; música roteirizada da orla continua controlada por sceneRadio.
- `broadcastSafeShot`: helper compartilhado pela TV aérea e cena da orla, com sondas `bldAt/roofTop` ao longo do raio; tenta desviar pelo ângulo mais próximo e depois elevar se necessário. Orla inicia a 11m, lateral 18m; após 8s sobe mais 28m mantendo câmera parada ao longo da via. Protege fase lateral e ascensão. Não cria render pass nem raycaster por triângulos.
- Título independente `#prologueTitle`, fora do storyBlack oculto: PIXEL CITY no centro, pixel art Silkscreen, tamanho médio, branco e contorno rosa claro; aparece na subida (8s) e some ao encerrar tomada. Reset também oculta título.
- Final da orla escurece, reposiciona atores/carro atrás do preto e inicia cartão de missão. Removida revelação de 2s da câmera normal junto à seta da casa antes dos créditos. Fade do cartão e rolagem aérea preservados; Jason volta à porta ao terminar e Lucia continua com posição exterior própria.
- Créditos: relógio capturado no começo e fase calculada por t/38. Exatamente 1440 minutos percorridos em 38s, sem drift; atualiza iluminação com `updateDayNight(0,true)`, mantém vista aérea e retorna ao mesmo horário no dia seguinte.
- Interface HTML usa fonte normal Segoe UI/system-ui inclusive dicas laranjas, menus e créditos. Título do jogo é exceção pixel solicitada. Não altera fontes pintadas nas texturas/placas 3D da cidade nem sprites.
- Testes: sintaxe, lado do motorista em quatro headings, desvio/elevação com obstáculos simulados, ciclo de 24h e percurso completo do prólogo até final com dependências simuladas. Validação visual e gameplay reais ainda pendentes.
- GAME_VER=45; série reiniciada v1–v45 aceita. Arquivo histórico abaixo preservado.

---

# Atualização v44 — Cores da concessionária

- Amostras de `dealSync` recebem classe `sw`, como provador/tuning. Regra comercial `background:...!important` só afeta botões que não são sw; ampliada exclusão também para `.btn.sw`. Aplicados borda/tamanho/foco compartilhados às amostras da concessionária.
- Revisados provador/joias (sw), eletrônicos/headphones/mochilas (span.dot com cor própria): não têm o conflito do botão sem classe da concessionária. Cores inline e seleção preservadas.
- GAME_VER=44; nova série v1–v44 aceita. Sintaxe verificada; conferência visual pendente.

---

# Atualização v43 — Jason visível no diálogo após pouso

- `storyAirportSpawn` agora sincroniza frame parado, posição/escala do sprite e sombra via `placeSprite`, zera salto/rotação e posiciona câmera antes de iniciar conversa. O diálogo pausa `updatePlayer`; antes o sprite ficava na coordenada anterior até fechar conversa.
- Não altera material, atlas ou iluminação. GAME_VER=43; aceita série v1–v43. Sintaxe e posicionamento pré-diálogo verificados isoladamente; teste visual pendente.

---

# Atualização v42 — Celular funcional nos interiores

- `roomStageLocalTick` agora executa `phoneTick(dt)` após validar sala. Atualiza desenho/navegação e contagem da chamada, que antes só rodavam no update externo. Ao abrir telefone ou iniciar diálogo/cut pela ligação, retorna antes de movimentação local.
- `phoneToggle` fecha TECH antes de abrir telefone para impedir menu da loja capturando teclado/controle. Vale nos interiores em geral, inclusive Lucia no shopping da campanha.
- GAME_VER=42; aceita série v1–v42. Sintaxe e atualização de telefone em sala verificadas isoladamente; gameplay visual pendente.

---

# Atualização v41 — Conversível ausente na cutscene da blitz

- `charEnter`: após assumir destino e sair de interior, sincroniza `ROOM_STAGE` antes de garantir detalhe/visibilidade/pose do veículo e ocupantes. Evita carro sem malha ou oculto pelo estado do interior durante descida de câmera.
- Inspeção do prólogo mantém detalhe, visibilidade e pose do carro e viaturas sem depender do update normal suspenso pela cena. Não cria outro carro nem altera propriedade.
- GAME_VER=41; aceita série v1–v41. Sintaxe e materialização de malha ausente/oculta verificadas isoladamente; conferência visual pendente.

---

# Atualização v40 — Flagrante zera escavação

- Guarda flagra escavação no `jailEscapeTick` compartilhado: pena=300s e `jailResetDig` zera progresso/clique, oculta túnel e sombra, restaura marca/material/escala iniciais no mesmo frame. Mantém colher para nova tentativa.
- Percentual de HUD lê progresso após reset, evitando um frame com valor anterior. Vale para ambos personagens, prólogo e modo livre, sem lógica paralela.
- Inclui correção de áudio da v39. GAME_VER=40, série v1–v40 aceita. Sintaxe e reset de estado/visuais verificados isoladamente; gameplay pendente.

---

# Atualização v39 — Áudio residual na troca/interiores

- Causa: loops WebAudio e HTMLAudio mantinham reprodução/ganho enquanto `PROLOGUE.cut` e `ROOM_STAGE` não executavam `updateAudio`.
- `transitionAudioStop`: pausa rádio local/online sem apagar estação, posição local ou preferência; cancela automações e esmaece em .035s motor, pneus, sirene e loops de veículos/aeronaves. Não recria AudioContext nem altera mixer global/falas.
- Chamada após `charLeave` na troca roteirizada e ao entrar em qualquer interior via `roomStageEnter`. Gameplay externo retoma atualização normal das fontes.
- GAME_VER=39; nova série v1–v39. Sintaxe e encerramento de fontes testados isoladamente; áudio em gameplay pendente.

---

# Atualização v38 — Campanha “Um novo começo” e uniforme de prisão

## Fluxo atual (substitui a missão da passageira nas campanhas novas)

1. Mantém pouso e crédito de abertura existentes (`STORYINTRO`, física `AIRP`). `storyIntroFinish` chama `prologueBegin`: Jason veio de ilha atlântica, sente falta de Lucia. Destino é concessionária real; $7.500 mínimos para evitar bloqueio econômico. Compra real custa $6.500. Catálogo nesta etapa contém apenas `conv`; cores/placa continuam editáveis.
2. `prologuePurchase` guarda entidade e inicia tempo aleatório de 12–24s **dirigindo esse carro**. `prologueSwitch` reutiliza `SWITCH` / `switchCam` com curva de subida, viagem e descida originais. Troca para Lucia na cadeia real. Colega dá fala pedida e colher imediatamente. Fuga usa guarda, canto, escavação de 30s e beco existentes. Nesta etapa a pena não chega a zero e fiança não substitui a fuga.
3. Após fuga +2s, troca para Jason já parado numa blitz **do mecanismo único** `blitzMake('calm')`. Conversível legal, sequência normal de guarda/documentos/placa/liberação. Inspeção cinematográfica dura até a liberação e pelo menos 10s. Exibe dica laranja sobre blitze em fuga.
4. Mais 8–15s dirigindo; troca para Lucia já na loja real de eletrônicos do shopping (andar correto). Sem celular (`PHONE.models[1]=null`); celular não abre sem propriedade. Objetivo sugere iPixel branco, mas outro modelo comprado também permite continuar. Dinheiro inicial de Lucia: $1.000 mínimos; compra cobra preço normal.
5. Agenda/número 770 intercepta `prologueCall` durante objetivo `call`: diálogo Lucia/Jason, fade e troca sob preto, sem convocar NPC pela função livre “vir aqui”. Retoma Jason e o conversível. GPS da casa e pensamento de reencontro.
6. Na porta, Jason sai do carro e caminha em cena de 2.4s; diálogo inferior com Lucia sobre cinco anos. Fade para avenida da orla às 18h30, ambos no conversível usando `DUO`/`convRiderTick`. Câmera lateral segue por 8s, para, sobe até aproximadamente altura de prédios; título PIXEL CITY aos 11s. Cena completa ~18s. Seleciona trecho costeiro seco de 90/60/36m; mapa atípico sem trecho usa avenida seca da blitz.
7. Fade para porta da safe house, revela Jason por 2s; novo fade antes de `storyFinalBegin`. Só então MISSÃO CONCLUÍDA / UM NOVO COMEÇO, CONTINUA e créditos existentes. Lucia recebe posição exterior independente. Carro permanece na vaga real `city.safe.slots[0]`, quando disponível. Salva ao final/créditos pelo mecanismo anterior.

## Integrações e estado

- `PROLOGUE` é transitório; tick de objetivos no loop principal funciona também nos interiores, fora da simulação pausada de sala. `cut` controla switch, inspeção, caminhada, fades e passeio; câmera normal não sobrescreve essas cenas. Cenas atualizam balões e ocupantes sem simular trânsito inteiro. `cutT` separado evita reiniciar fade quando ação troca objetivo.
- `QUEST.pier.state='prologue'` e `questTick` suspenso só durante prólogo novo. Identificador de missão permanece `pier` para save/checkpoint/créditos e compatibilidade. Saves antigos incompletos conservam fluxo anterior; nova campanha usa narrativa nova. Histórico abaixo é arquivo, não especificação do fluxo novo.
- `prologueLocked` protege charOpen, charSwitch, duoSwap, charLock; seletor desktop e botão touch `data-t=char` ocultos. Trocas só pelo roteiro. Fim dos créditos remove classe e libera controle normal.
- Reset de falha restaura visual/caracter, limpa cut/SWITCH/CAMHOP e recomeça abertura na mesma cidade. Carro da missão destruído gera falha. Salvamento bloqueado durante prólogo; usa checkpoint existente ao terminar. Modo livre preservado.
- `jailWear(on)` geral por personagem: guarda clone completo em `CHAR.list[i].jailLook`; camisa/calça/cinto laranjas, sem boné, óculos, colar, mochila, headphone ou roupa de banho. Restaura exatamente clone ao escapar, cumprir pena, pagar fiança ou sair. Não altera atlas/material/shader dos sprites. Saves na cadeia já são bloqueados; backup não precisa serialização. Prisão normal da campanha ainda segue regra de falha de missão preexistente; após campanha e no livre uniforme usa fluxo normal.
- `charEnter` zera referências de veículo/helicóptero antes de assumir destino; ramo `prologueJail` chama cadeia com bypass limitado por try/finally. `allowJail` nunca fica habilitado após a entrada roteirizada.
- Português e inglês adicionados ao dicionário existente e catálogo. README público atualizado sem detalhamento técnico.

## Validação

- Sintaxe de scripts inline; teste isolado percorreu compra → trocas → uniforme/restauração → fuga → blitz → shopping → ligação/fades → caminhada/dialogo → orla → porta/final, incluindo relógio 18h30 e estado separado de Lucia.
- Teste usa dependências 3D/lojas/guarda simuladas: não substitui gameplay. Conferência visual, colisões do trecho costeiro e experiência completa em seeds/controles reais ainda pendentes. Chromium local indisponível nesta execução (restrição de socket reportada na v35).
- GAME_VER=38; aceita série reiniciada v1–v38. Schema de save `v:1` preservado.

---

# Atualização v37 — Diálogo da blitz

- `checkpointSpeech`: primeiro balão pede documentos; segundo cita placa, confirma regularidade e libera. Ajustados português e inglês. Placa mencionada uma única vez por atendimento.
- GAME_VER=37, aceita nova série v1–v37.

---

# Atualização v36 — Canal da floresta

- Canal 7 `forest`, marca fictícia “Além do Sinal”, identidade violeta/cinza e símbolo de mistério. Título e legenda sugerem o demogorgon escondido, conforme pedido; não cria criatura extra nem altera encontro/coletável da floresta.
- `tvForestSite` valida `city.forest`, `city.info[ri].forest` e retângulo real. `tvAvailableChannels` omite canal se não existe floresta; navegação circular funciona nos dois sentidos. Acesso direto sem floresta volta ao clima; perda do local durante transmissão pula adiante.
- `TVM.foc` é o centro da floresta existente, usando streaming normal da TV. `tvForestShot` sobrevoa em órbita lenta de .035 rad/s, raio 18–30m, altura 34–60m adaptada ao lote, FOV 58 e olhar inclinado para chão/copa. Não altera limite de chunks.
- GAME_VER=36; aceita nova série v1–v36. Sintaxe, elegibilidade/navegação e coordenadas da câmera verificadas em testes isolados; gameplay visual ainda pendente.

---

# Atualização v35 — Identidade dos canais de TV

- `TV_IDENTITIES` / `tvApplyIdentity`: seis marcas fictícias com símbolos SVG, paletas, selos e hierarquia gráfica próprios. Céu Agora (clima), Pixel News (perseguição), Cidade 24 (blitz), Terra Viva (ambiente, losango verde), Salto Livre (paraquedas), Horizonte (aeroporto). Referências de gênero, sem reproduzir logotipos reais.
- `#tvbar[data-channel]`: temas CSS, layouts responsivos e grafismo meteorológico discreto. Ticker preserva texto do programa, agora assinado pelo canal. Sem render targets, geometria 3D ou passes novos.
- `broadcastCam`: blitz R=23/H=15, metade de R=46/H=30; mantém proteção contra prédios que pode elevar câmera quando necessário. Troca de canal limpa camH/angT/chk para não herdar enquadramento anterior.
- `tvOff` limpa tema, kicker e logo para não contaminar benchmark. Controles e ciclo de vida dos eventos preservados.
- Sintaxe, troca das seis identidades e distâncias por modo verificadas em testes isolados. Conferência visual em navegador não concluída: Chromium bloqueado pelo ambiente (socket não permitido).
- GAME_VER=35, compatibilidade com nova série v1–v35.

---

# Atualização v34 — Um único mecanismo de blitz

- Removida montagem independente da TV. `blitzRandomSite` seleciona trecho seco de mão única; `blitzBuildAt` é a extração da construção original (viaturas, cones em funil, guardas, ponto de abordagem). `BLITZ.on` é a única instância ativa. TV usa `blitzMake` e apenas muda foco/ciclo de vida com `broadcast`.
- Blitz preventiva pode surgir com jogador a pé ou de carro, fora de interiores/fuga ativa. Não exige enquadramento à frente do jogador. Preservadas regras de documentos/roubo/reconhecimento do jogador.
- NPCs param no ponto de abordagem, aguardam policial aproximar-se da janela, recebem falas/placa e verificação de 2.8s com documentos sempre regulares. Policial retorna e o guarda sai do corredor antes de remover cone e liberar carro. Próximo espera anterior deixar área.
- `blitzNpcBegin/Tick/MoveCop` usam os mesmos policiais e `frontCone` da abordagem original. Fluxo do jogador não é iniciado simultaneamente ao atendimento NPC.
- Cones mantêm modelo original; instâncias da operação têm recursos próprios para descarte seguro. TV encerra sua operação pelo mesmo `blitzEnd` antes da limpeza de transmissão.
- Sintaxe e sequência isolada de aproximação/documentos/retorno/liberação verificadas; integração visual/colisões em gameplay ainda pendente.
- GAME_VER=34; nova série v1–v34 aceita.

---

# Atualização v33 — Espera para fechar cancela da ilha

- Cada braço do pedágio mantém `npcCloseDelay=2` enquanto houver sinal de passagem de NPC na sua faixa. Após o sinal cessar, conta dt até zero antes de iniciar fechamento.
- Acréscimo de 2s por faixa, sem alterar velocidade de rotação, cobrança ou tempo de inspeção. Outro NPC renova a espera.
- Sintaxe e temporização independente das duas faixas verificadas; gameplay pendente. GAME_VER=33, série v1–v33 aceita.

---

# Atualização v32 — Locais variados para blitz da TV

- `tvRoadblock` enumera ruas de mão única elegíveis e sorteia um trecho, em vez de encerrar no primeiro da varredura.
- Valida solo seco em três pontos da operação. Prioriza local a mais de 1.5 quadras da transmissão anterior; se impossível, prefere outro trecho; única opção permanece válida.
- `TVM.lastRoadblock` não é apagado ao mudar canal, permitindo alternância na próxima sintonia. Sem alterar geração estática da seed ou blitz real.
- Inclui correção v31: carro liberado não fica preso à leitura da faixa original.
- Sintaxe e seleção com alternativas verificadas; validação visual pendente. GAME_VER=32; série v1–v32 aceita.

---

# Atualização v31 — NPC liberado continuava parado na blitz

- Conflito identificado: `leaderGap` usa índice da faixa original (`rail.li`), mas `checkpointPose` desloca o carro ao corredor +2.8. Mesmo liberado, NPC podia continuar freando pela viatura na faixa fechada.
- Durante checkpoint ativo, rail usa fila projetada/corredor e detecção espacial próxima; fora dele mantém `leaderGap` original. Não ignora veículos fisicamente à frente.
- Fila projetada considera convergência de trânsito no mesmo sentido; estacionados/contramão só bloqueiam se corpo ocupar corredor aberto. Limpa cache de bloqueio no instante da liberação.
- Teste integrado isolado de `railUpdate` com `leaderGap=0` e viatura fechada, além de segunda fila e obstáculo real. Sintaxe validada; gameplay pendente.
- GAME_VER=31; nova série v1–v31 aceita.

---

# Atualização v30 — Placas e falas na fiscalização

- `checkpointSpeech` emite balão pelo policial no começo da inspeção e na liberação do NPC, citando sua placa. Documentos dos NPCs sempre em ordem; não altera legalidade ou regras de prisão do jogador.
- Guarita da micro-ilha recebe dois visores, um em cada lateral voltada às faixas, abaixo das janelas: fundo preto e texto amarelo. CanvasTexture reutilizada, redesenhada só quando placa muda.
- `tollPlateScan` consulta veículos terrestres vivos próximos, inclusive jogador, policiais e serviço; escolhe mais próximo de cada lado e mantém última leitura quando faixa esvazia. Placa usa `blitzPlate/normPlate`, sem alterar propriedade ou cobrança.
- Sintaxe, sequência de fala e atualização incremental dos visores verificadas com testes isolados. Posicionamento visual em gameplay pendente.
- GAME_VER=30; série atual v1–v30 aceita.

---

# Atualização v29 — Fila nas blitze

- `checkpointFor/Pose/Offset/Speed` compartilham corredor de fila entre blitz real e TV. Faixas convergem suavemente para offset +2.8; limite de velocidade, parada de 2.5s e liberação individual.
- `serving` identifica carro em inspeção; `releasing` mantém próximo parado até anterior passar 20m além do foco. `passed` é WeakSet local à operação. NPCs mantidos na fila em vez de removidos pelo antigo limite de dois carros.
- Tráfego rail usa deslocamento lateral no pose e limite de velocidade; IA física recebe alvo no corredor e limite comum. Policiais fixos da blitz entram na detecção de obstáculos dos motoristas.
- Jogador mantém controle manual e regras de abordagem existentes. Controle de tráfego não dirige o veículo do jogador. Carros já adiante quando operação surge são liberados para sair.
- TV: viaturas deslocadas para faixa fechada, fora do corredor. Estado do controlador descartado na troca de canal.
- Sintaxe e testes isolados de fila/ordem/offset verificados; teste visual de densidade, veículos largos e colisões em gameplay pendente.
- GAME_VER=29; nova série v1–v29 aceita.

---

# Atualização v28 — Enquadramento da TV/paraquedas

- Reportado cenário ausente no canal 5, seed 2028093081. O enquadramento anterior seguia quase horizontalmente o NPC, com offset fixo independente da orla, sem garantir cidade/solo no campo de visão.
- `tvParachuteShot` posiciona a câmera no lado do mar olhando para dentro da cidade nas quatro orientações de costa; altura/distância e ponto de mira incluem personagem e chão. FOV 60.
- Transmissão começa no trecho final do trajeto rumo à praia; altura 7–48m ajustada ao alcance configurado. Não aumenta draw distance nem altera saltos naturais/jogador.
- Teste matemático nas quatro costas e alturas; sintaxe validada. Reprodução visual da seed reportada ainda pendente.
- GAME_VER=28; nova série v1–v28 aceita.

---

# Atualização v27 — Cor do solo no LOD

- Causa: estradas de terra, cruzamentos e curvas rurais eram gerados em `marks`, junto das faixas; `ch.markMesh` recebe fade médio em `chunkLod`. Ao ocultá-lo, aparecia o asfalto global sob a terra.
- `roadGround`/`ch.roadGroundMesh` agora contém exclusivamente essa cobertura de solo, com o mesmo material e coordenadas anteriores. Não entra no dither de detalhes; segue visibilidade do chunk e névoa. Marcas viárias continuam no LOD anterior.
- Geometria/cores/PRNG não alterados. Um batch adicional nos chunks com terra; sem simulação extra por frame. Recorte de pontes preservado.
- Saves da série atual v1–v27 aceitos. Sintaxe e separação das rotas verificadas; comparação visual em gameplay pendente.

---

# Atualização v26 — TV e abertura

- Seis canais em `TV_CHANNELS`: tempestade, perseguição, blitz preventiva, poluição, paraquedas e aeroporto. Setas/botões anteriores e próximos respeitam sentido.
- `tvClearScene` remove apenas props/policiais/paraquedista temporários da transmissão. Não usa `BLITZ.on` para não misturar a fiscalização do jogador. Viaturas estacionadas e cones formam uma operação preventiva visual; não simula investigação de cada civil.
- Poluição seleciona maior `pollAt` em amostras da água já gerada; não altera materiais ou cria mancha falsa. Se a seed não tiver poluição, informa ausência de mancha visível.
- Paraquedas: modelo existente de NPC, voo interpolado até pouso na praia e repetição; independente dos NPCs naturais. A câmera segue em altura.
- Aeroporto: reutiliza `AIRP` e `airTick2`, inicia corrida de decolagem e usa enquadramento da abertura. Pistas compactas mantêm o sobrevoo de segurança já existente. Operação real avança; estado de voo não é revertido ao desligar a TV.
- Abertura usa `storyClock` como legenda inferior, com localização e 7:00. Não há mais horário isolado no topo.
- Nova build `GAME_VER=26`; saves da série atual v1–v26 aceitos. Índices de linhas abaixo continuam referindo-se à v25.
- Verificação: sintaxe e contratos estáticos; gameplay/renderização pendentes.

---

# PixelCity — contexto técnico e continuidade

**Código de referência: v25, nova série de saves `pixelcity-restart-1`.** Esta reorganização documental não altera o código nem incrementa `GAME_VER`.

Este documento serve a desenvolvedores humanos e agentes de IA. `README.md` é a apresentação pública; não é especificação técnica. `index.html` é a fonte executável. O histórico integral ao final preserva decisões, regressões e funcionalidades que não devem ser apagadas por esquecimento.

## 1. Ordem de leitura e autoridade

1. Ler este resumo técnico e o `SKILL.md` do pacote.
2. Localizar no `index.html` as declarações e os caminhos de chamada do sistema afetado.
3. Consultar o histórico pelo nome da mecânica e pela build antes de modificar comportamento existente.
4. Em conflito, a solicitação atual do usuário prevalece; o código define o comportamento implementado. O histórico registra intenção e tentativas, não comprova funcionamento.

Os registros antigos usam v159–v301 e numerações anteriores; depois houve reinício em v1. Não confundir uma versão da série antiga com a atual. Notas mais recentes substituem os detalhes antigos apenas nos aspectos explicitamente alterados.

## 2. Arquitetura e distribuição

Aplicação estática concentrada em `index.html`: Three.js r128, WebGL, scripts inline, DOM/CSS para HUD e menus, Canvas 2D para atlas/texturas/mapas, Web Audio e áudio HTML, Gamepad API, toque e Web Crypto. Não há etapa obrigatória de compilação ou backend para o jogo básico. Bibliotecas/fontes/rádios externos dependem de suas respectivas fontes.

| Arquivo | Responsabilidade |
|---|---|
| `index.html` | Estado, gerador, modelos, renderização, física, IA, missões, interfaces e áudio |
| `README.md` | Apresentação pública em linguagem de jogador, preparada para adaptação ao itch.io |
| `CONTEXT.md` | Contexto técnico atual, contratos, índice de código e histórico integral |
| `SKILL.md` | Orientação de handoff; aponta para este contexto em vez de duplicá-lo |
| `locale_en_catalog.json` | Catálogo de localização; conferir também textos e tabela `LANG_EN` no HTML |
| `manifest.webmanifest`, `pwa.js`, `sw.js`, `icons/` | Identidade e instalação PWA, cache/registro e ícones |

Servir via HTTP para desenvolvimento; HTTPS ou localhost para recursos como Web Crypto e instalação, conforme exigências do navegador. Não prometer instalação automática nem suporte idêntico de recursos em todos os dispositivos.

## 3. Estado e sistemas principais

As estruturas são globais lexicais; `const` no script não implica acesso via `window`. Alguns campos são acrescentados ao longo da execução. O índice adiante dá linhas desta build; preferir busca por símbolos ao aplicar alterações.

| Símbolo | Papel e campos/contratos relevantes |
|---|---|
| `S` | Configuração: `seed`, `size`, `style`, `hour`, câmera, clima, densidades, sombras, bloom, escalas e distâncias |
| `city` | Mundo gerado: `N`, `ext`, `rects`, `info`, `chunks`, materiais, rios, pontes, entradas, safe house e terrenos especiais |
| `PL` | Personagem ativo: posição, velocidades, `yaw/pitch`, sprite/sombra, vida/dinheiro, `car`, `heli`, `inside` |
| `CHAR`, `DUO`, `SWITCH` | Jason/Lucia, acompanhante e transições de personagem |
| `DN`, `WX`, `WIND`, `ECLIPSE` | Relógio e iluminação, células climáticas, vento e cheat de eclipse |
| `VIEW`, `LOOK`, `ORB`, `camT`, `chasePos` | Modo de câmera, olhar relativo no veículo, órbita, alvo e posição suavizada |
| `ROOM_STAGE` | Isolamento visual e atualização local de interiores |
| `SAFE`, `AMMO`, `SHOP`, `MALL`, `CAS`, `JAIL`, `BANK`, `HEIST`, `EMP` | Interiores/estabelecimentos; `IN` costuma indicar coordenada da sala remota; `grp` é grupo de renderização |
| `GUN`, `HELD`, `POL`, `WZ` | Armas, arma na mão, perseguição e reconhecimento policial |
| `STORY`, `STORY_MISSIONS`, `QUEST`, `GAMEMODE` | Campanha, desbloqueios, missão introdutória e modo livre |
| `PARA`, `VINYL`, `TOMMY` | Paraquedas, discos e cinco adversários colecionáveis |
| `INVERT`, `HAZE`, `TIMEJUMP` | Travessias de mundo e viagem temporal; seus locks devem ser respeitados |
| `CHEAT`, `SAVE` | Marca de cheats e fluxo de persistência |

### Geometria e unidades

`BS=60`, `RW=16`, `P=BS+RW=76`, `SW=4`, `CS=2`. Um chunk contém uma grade de 2×2 quadras; não alterar a dimensão do chunk ao mudar a distância de desenho. `RY=-3` é o nível dos rios; consultar `SEA_Y`, `waterLevel`, perfis de praia e foz antes de mexer em alturas.

`MB` acumula posições, normais, UVs e cores para malhas combinadas. `box`, `flat`, `quad`, `qa` e `geo` têm convenções próprias: conferir assinaturas antes de posicionar geometria. Evitar objetos independentes por detalhe quando puderem ser combinados. Colisões usam registros separados das malhas; mover um modelo exige conferir entradas, marcadores, estacionamento e colisores.

## 4. Contratos de geração procedural

- Repetição estática exige mesma seed, tamanho, estilo e versão do gerador. Trânsito, clima e eventos não precisam repetir a sequência estática.
- Usar PRNG derivado da seed para geração estática; preservar streams independentes. Um consumo adicional de `R()` pode modificar toda a sequência posterior.
- Tamanhos suportados: Mobile e Normal (`N=7` e `N=14`). Point Haze usa ilha `N=3`, independentemente do tamanho-base da partida.
- Marcos obrigatórios são reservados antes dos usos menos prioritários. Prédios especiais não devem crescer arbitrariamente sobre várias quadras; banco possui reserva individual.
- Centro orientado à orla, sem faixa rural na praia. Preservar os caminhos especiais de aeroporto, micro-ilha, prédio de salto e lotes costeiros.
- Rio/foz precisam permitir navegação; não reintroduzir superfícies de água sobrepostas, paredes sob pontes ou solo rural no leito do canal.
- Gerar ruas e lotes com suas conexões: rasgos de calçada, acesso ao asfalto, carros estacionados na altura correta, faixa livre de manobra.

## 5. Renderização, interiores e câmeras

A cidade inteira é pré-carregada em `preloadCityRegions` e permanece residente. `cullChunks` decide visibilidade por distância/frustum; `chunkLod` alterna materiais e dither de detalhes. Ocultar um grupo não libera RAM/VRAM.

`roomStageKind/Root/Enter/Exit/Sync/LocalTick` isolam salas com seta de entrada. Ao entrar, a maior parte dos objetos externos visíveis é ocultada e guardada em `ROOM_STAGE.hidden`. Ao sair, os objetos são reexibidos e fundo/névoa restaurados. O caminho local atualiza sala e atores locais, sem executar toda a simulação normal da cidade. TV possui exceção própria. Alguns interiores são montados sob demanda; não presumir que todo grupo existe.

`PL.inside===true` significa safe house; outros interiores usam strings (`ammo`, `shop`, `mall`, `casino`, `club`, `heist`, `pawn`, `emp`, `bank`, `jail`). Não substituir essas comparações por uma única interpretação booleana em despachos.

**v24:** castelo externo de Point Haze usa `hazeCastle`, material Standard próprio e `ch.hazeCastleMesh`, incluído em `ACTOR_CASTERS`. Reserva escolhe lote mais próximo do centro; após preloading verifica malha e porta. Foi uma correção defensiva: o desaparecimento original não foi reproduzido em renderização real. Não tratá-la como causa confirmada.

**v25:** `cameraAngle` normaliza `LOOK.yaw` com `atan2(sin,cos)` antes do retorno veicular. Isso descarta voltas completas; não converter todo ângulo de personagem/cinemática sem avaliar interpolação. `ammoCameraBounds` limita terceira pessoa armada/desarmada à sala W=7,D=6,H=3.5. `ammoEnter` reinicia pitch, olhar e `chasePos`. Verificação matemática feita; sensação visual ainda não confirmada.

### Áreas sensíveis

Preservar o sistema de iluminação de sprites estabelecido após as regressões dia/noite: `SpriteMaterial`, atlas, transparência/alphaTest, geometria compartilhada, ciclo de limpeza e os caches de obstáculos. Não resolver visibilidade trocando shaders de sprites sem diagnóstico. Sombras ON/OFF já causaram sprites totalmente invisíveis em builds antigas.

Recortes isométricos (`ISOFADE`), de interiores e de pontes são sistemas diferentes. Materiais compartilhados recebem hooks `onBeforeCompile` e chaves de programa; clones/fallbacks precisam conservar os hooks necessários e os atributos esperados. Transparência visual não deve remover colisões.

## 6. Clima e eclipse

Chuva comum é regional e pode começar longe do jogador; aves desaparecem na chuva e paraquedistas NPCs são suspensos em chuva forte. Notificações de formação de chuva comum foram removidas; previsões de tempestade continuam. Preservar janelas de céu limpo de pelo menos 30s antes/depois da tempestade antes de retomar formação comum.

O cheat `ECLIPSE` usa fases `clock` (10s), `rise` (60s), `cross` (120s), `total` (60s), `separate` (120s), `set` (30s). Acelera o relógio até 11h, com virada do dia se necessário. No cruzamento/separação, relógio recebe metade do dt. A geometria aparente tem raios .0308 (sol) e .030 (lua): anel estilizado, não uma simulação física de eclipse total.

`eclipseCoverage` calcula interseção dos discos; `eclipseDarkness` fica zero até 50% de cobertura e cresce em curva cúbica normalizada até o máximo. Shader e cálculo CPU devem permanecer coerentes. Halo mistura continuamente com o Sol normal durante preparação; não usar chave binária para apagar/reacender emissão. v23 mantém halo final .38, decaimento radial 500 contra 1000 da borda, e cor avermelhada perto do máximo via `smoothstep(.72,.995,occult)`, reversível na saída.

## 7. Saves e economia

`GAME_VER=25`, `SAVE_SERIES='pixelcity-restart-1'`. `saveVersionCompatible` aceita explicitamente v1–v25 dessa série; não aceita v301 legada. O campo de schema `v:1` não é `GAME_VER` nem a versão do envelope criptográfico. Não alterar esses identificadores como se fossem equivalentes.

`buildSave` captura estado suportado; `applySave` o reaplica após reconstrução do mundo. Não serializa cada mesh/NPC/veículo. Arquivo `.psave` exportado usa envelope com AES-GCM; chave no cliente, sem promessa de anticheat de servidor. Salvar é manual; configurações locais e leitura de legado não equivalem a autosave completo.

Cheat usado marca a sessão e bloqueia salvamento/recompensas aplicáveis; desligar o efeito não limpa a marca. Preservar bloqueios em táxi, vigilante, alvo de paraquedas e coletáveis pagos. Timoty: cinco alvos, $1.000 cada + $5.000 de conclusão = $10.000 total. Contagem nos Registros, não na legenda; radar usa ponto vermelho de proximidade.

## 8. Campanha, controles e manutenção

A campanha está incompleta: `STORY_MISSIONS` contém a missão ativa `pier` (“Encontre Lucia”); entradas seguintes estão comentadas. Não divulgar campanha extensa como concluída. O modo livre e os sistemas de desbloqueio coexistem; alterações em entradas/mapa precisam considerar `storyOK`, `storyMap` e `storySafeOpen`.

Menus suportam teclado/controle/toque com diferenças de foco. Campos editáveis têm mini teclado QWERTY com números. UI mobile é contextual e ainda necessita validação prática; não prometer cobertura perfeita de todos os comandos.

Alterações futuras: entregar pasta completa/ZIP, manter histórico, registrar o que foi realmente testado e diferenciar teste de sintaxe, teste isolado e gameplay WebGL. Não trocar a build oficial por arquivo antigo para consertar um único sistema. Incrementar versão de código somente quando houver alteração executável, mantendo política de saves deliberada.

## 9. Verificação e pendências

- v24: sintaxe e geração isolada de geometria/porta por 1.000 streams; sem confirmação visual do castelo pelo usuário.
- v25: sintaxe, normalização de ângulos e limites da câmera; sem teste visual real de entrada/saída e giro em todos os modos.
- Eclipse v17–v23: curvas e sintaxe verificadas; versões sucessivas foram ajustadas por screenshots do usuário. Aparência depende de exposição, bloom, nuvens e configuração.
- Seeds reportadas anteriormente: 1359625918 (garagem DeLorean), 2898363246 e 3116203139 (paraquedas). Fallbacks foram acrescentados; não há comprovação de regressão integral em gameplay dessas seeds.
- Validar após alterações relevantes: dia/noite com sombras ON/OFF, mouse/controle/toque, AMOnições armada/desarmada, troca de interiores, Point Haze/Upside Down/viagem temporal, save/load e determinismo estático.

## 10. Índice do código de referência

Linhas referem-se ao `index.html` v25 deste pacote. Os números são auxiliares, não contratos.

| Estado | Declaração |
|---|---|
| `S` | linha 1016 |
| `city` | linha 1350 |
| `PL` | linha 9364 |
| `CHAR` | linha 7963 |
| `DUO` | linha 13446 |
| `SWITCH` | linha 7965 |
| `DN` | linha 6491 |
| `WX` | linha 6264 |
| `WIND` | linha 2891 |
| `ECLIPSE` | linha 6498 |
| `LOOK` | linha 9127 |
| `VIEW` | linha 10286 |
| `ORB` | linha 10286 |
| `ROOM_STAGE` | linha 14563 |
| `SAFE` | linha 11984 |
| `AMMO` | linha 13709 |
| `SHOP` | linha 1758 |
| `MALL` | linha 1995 |
| `CAS` | linha 12412 |
| `JAIL` | linha 14019 |
| `BANK` | linha 12316 |
| `HEIST` | linha 12004 |
| `EMP` | linha 12231 |
| `GUN` | linha 5675 |
| `POL` | linha 6369 |
| `WZ` | linha 1828 |
| `PARA` | linha 9424 |
| `VINYL` | linha 5764 |
| `TOMMY` | linha 9194 |
| `HAZE` | linha 2427 |
| `INVERT` | linha 2237 |
| `TIMEJUMP` | linha 11353 |
| `CHEAT` | linha 14321 |
| `SAVE` | linha 14173 |
| `STORY` | linha 13303 |
| `QUEST` | linha 13409 |
| `CITY_CACHE` | linha 1015 |

| Função | Linha |
|---|---|
| `generateCity` | 3092 |
| `buildChunk` | 3800 |
| `preloadCityRegions` | 5317 |
| `cullChunks` | 5443 |
| `chunkLod` | 5390 |
| `groundY` | 1458 |
| `setSafeDoor` | 11991 |
| `buildSafehouse` | 13990 |
| `ammoBuild` | 13761 |
| `ammoEnter` | 13800 |
| `ammoCameraBounds` | 10212 |
| `updateCamera` | 10213 |
| `roomStageEnter` | 14609 |
| `roomStageExit` | 14601 |
| `roomStageLocalTick` | 14672 |
| `buildSave` | 14174 |
| `applySave` | 14290 |
| `saveVersionCompatible` | 14262 |
| `hazeShift` | 2437 |
| `invertShiftWorld` | 2423 |
| `timeJump` | 11366 |
| `eclipseStart` | 6499 |
| `eclipseStep` | 6503 |
| `eclipseCoverage` | 6501 |
| `eclipseDarkness` | 6502 |

## 11. Arquivo histórico integral

O conteúdo abaixo é uma cópia integral do README anterior à separação. **Não é uma segunda especificação atualizada:** contém numerações antigas, funções substituídas, afirmações de testes limitados e descrições de estados anteriores. Usar as seções 1–10 e o código para resolver conflitos. Mantido integralmente para não perder mecânicas e decisões.

<!-- BEGIN LEGACY README VERBATIM -->

# PixelCity v25 — Câmera da AMOnições e retorno angular

- Retorno da câmera veicular descarta voltas completas e usa o arco curto até o ângulo padrão. Aplica-se a mouse, controle e toque, em primeira e terceira pessoa.
- Entrada na AMOnições reinicia inclinação/posição de acompanhamento dentro da sala; câmera em terceira pessoa, armada ou desarmada, limitada ao interior da loja.
- Saves da nova série v1–v25 aceitos. Sintaxe e limites/ângulos verificados; gameplay pendente.

---

# PixelCity v24 — Castelo da safe house em Point Haze

- Castelo passa a usar um batch estrutural próprio, com material próprio, sem os shaders compartilhados de detalhes/recorte de pontes. Mantidas ruínas, torres, colisões e entrada.
- Reserva do lote central escolhe o lote mais próximo do centro e valida o castelo após o carregamento.
- Estrutura incluída nos obstáculos de iluminação dos personagens.
- Sintaxe e geração isolada da geometria verificadas; visual em gameplay ainda precisa ser conferido. Saves da nova série v1–v24 aceitos.

---

# PixelCity v23 — Halo persistente e cor no alinhamento

- Halo reforçado e preservado no máximo do eclipse: largura radial duas vezes a borda vermelha.
- Sol passa gradualmente do branco quente ao vermelho/laranja perto do alinhamento máximo; retorna ao branco conforme a Lua sai.
- Mantida curva de escurecimento da v22. Saves da nova série v1–v23 aceitos.
- Sintaxe validada; aparência final requer conferência em gameplay.

---

# PixelCity v22 — Anel solar e escurecimento por cobertura

- Anel mais visível, dourado/branco quente com borda avermelhada discreta; halo final um pouco mais largo. Mantido esmaecimento contínuo.
- Escurecimento usa área real dos discos: zero até 50% de cobertura, curva cúbica depois, máximo só no alinhamento.
- Referências NASA: Solar Eclipse Guide, Types of Solar Eclipses, Sun Facts (coroa branca, cromosfera/proeminências vermelhas/rosadas; anel de fogo anular). Visual do jogo continua estilizado.
- Testadas curva de cobertura e sintaxe; verificação visual em gameplay pendente. Saves nova série v1–v22 aceitos.

---

# PixelCity v21 — Transição contínua do halo

- Efeito começa durante o avanço até as 11h. Halo esmaece e encolhe progressivamente nesse avanço.
- Eliminada troca binária entre emissão solar normal e eclipse: mistura gradual, sem zerar sunDim.
- Subida da Lua mantém o brilho ao final da preparação, sem novo fade-in; separação continua restaurando o Sol suavemente.
- Saves nova série v1–v21 aceitos. Sintaxe verificada; visual em gameplay pendente.

---

# PixelCity v20 — Halo proporcional ao eclipse

- Halo amplo preservado até o contato entre os discos. Atenuação baseada na área real de sobreposição dos círculos.
- Quanto maior a cobertura lunar, menor a força e largura do halo; no máximo resta um anel fino/fraco. Recuperação simétrica na separação.
- Mantida correção da Lua preta fora do Sol. Saves nova série v1–v20 aceitos.

---

# PixelCity v19 — Emissão reduzida pela cobertura lunar

- Emissão do disco cai progressivamente pela separação angular real entre os astros: de 0,72 a 0,055, cerca de 92% de redução no alinhamento. Halo residual reduzido a 0,018.
- Não altera o bloom de outros objetos. Saves nova série v1–v19 aceitos.

---

# PixelCity v18 — Eclipse com anel fino

- Disco escuro da Lua restrito à sobreposição solar; fora dela mantém a cor do céu.
- Halo solar do eclipse limitado a faixa estreita, com luminosidade reduzida.
- Emissão solar normal bloqueada diretamente no shader durante o eclipse, mesmo se o clima atualizar sunDim.
- Sintaxe verificada. Conferência visual em gameplay pendente. Saves nova série v1–v18 aceitos.

---

# PixelCity v17 — Cheat ECLIPSE

- ECLIPSE: avanço progressivo para as 11h em 10s, virando o dia quando necessário.
- Lua sobe em 60s; aproximação desacelerada de 120s; anel/totalidade estilizada por 60s reais; separação 120s e descida 30s.
- Relógio em meia velocidade no cruzamento/separação e pausado na totalidade. Sol aparente ligeiramente maior que a Lua, produzindo anel anular estilizado com iluminação noturna.
- Controle: L1, R1, cima, direita, baixo, esquerda, triângulo/Y, triângulo/Y, pelo sistema normal de cheats. Bloqueia saves.
- Novo efeito no shader existente do céu, sem passes extras. Paleta de noite e horizonte quente misturadas gradualmente.
- Sintaxe e sequência temporal verificadas; visual e travessias durante o efeito ainda precisam de teste em gameplay. Saves nova série v1–v17 aceitos.

---

# PixelCity v16 — Revisão das travessias

- Bloqueio recíproco entre a transição do portal e a de Point Haze.
- Confirmado uso do gerador compartilhado com trees inicializado mesmo em chunks sem árvores.
- Revisadas as rotas de geração, restauração de snapshot e limpeza dos indicadores de transição. Sintaxe e exclusão mútua testadas; travessia WebGL completa não executada.
- Saves nova série v1–v16 aceitos.

---

# PixelCity v15 — Viagem temporal e chunks sem árvores

- Todo chunk inicializa trees como lista vazia, mesmo sem árvores. Corrige acesso a ch.trees.some na geração dos estacionamentos, que interrompia a viagem temporal.
- Sintaxe e inicialização de chunk vazio verificadas; viagem completa em WebGL pendente.
- Saves nova série v1–v15 aceitos.

---

# PixelCity v14 — Cidade orientada à praia

- Centro urbano sempre ancorado à orla com variação ao longo da praia e profundidade entre 15–25% do mapa.
- Quarteirões livres da orla convertidos em faixa urbana turística, incluindo os antes rurais; especiais e ilha preservados.
- Pousos de paraquedas contam com busca adicional ao longo de toda a praia, em três profundidades.
- Garagem do DeLorean ganha tentativa de recuperação em espaço livre da micro-ilha, com estrutura e colisões reais.
- Sintaxe e posição do núcleo verificadas; seeds reportadas ainda precisam de geração completa em gameplay.
- Nova geografia pode mudar a cidade de saves existentes; recomendado gerar cidade nova. Saves da série v1–v14 aceitos.

---

# PixelCity v13 — NPCs de óculos

- Garante ao menos 3 dos 14 modelos-base de pedestres com óculos; evita sessões em que o sorteio inicial não produz nenhum.
- Pixel art v12 e iluminação preservadas. Saves nova série v1–v13 aceitos.

---

# PixelCity v12 — Óculos pixel art

- Lentes menores e separadas, ponte de um pixel e reflexos discretos; ajustados frente e perfil.
- Alteração só no desenho Canvas do acessório; iluminação e materiais dos sprites preservados.
- Saves nova série v1–v12 aceitos.

---

# PixelCity v11 — Ícones nas entradas

- Mapa e radar usam as portas registradas dos marcos, negócios e concessionárias.
- Cassino e danceteria perdem deslocamentos artificiais e apontam para a porta exata. Lugares sem porta registrada conservam seu ponto de acesso.
- Saves nova série v1–v11 aceitos.

---

# PixelCity v10 — Primeira revisão da UI mobile

- Botões de 48–68 px CSS, distanciados e com estado pressionado visível.
- Ações contextuais a pé/veículo/helicóptero/paraquedas; mapa, câmera, Mais e pausa no topo.
- Mais reúne celular, personagem, especial, missão, rádio, música, faróis e ação secundária.
- Controles ocultos sobre compras, registros, telefone e outros modais; libera comandos segurados ao abrir janelas.
- Referências: Apple HIG Game Controls, Android Touch Target Size, Xbox Accessibility Guideline 107.
- Não inclui editor de posicionamento personalizado. Sintaxe validada; ergonomia e compatibilidade de todos os contextos precisam de teste em dispositivo.
- Saves nova série v1–v10 aceitos.

---

# PixelCity v9 — Rótulos gráficos

- Removidos os complementos entre parênteses dos controles de postes, bloom e reflexos.
- Saves nova série v1–v9 aceitos.

---

# PixelCity v8 — Caixas de seleção

- Checkboxes dos menus fixos em 18×18 px, sem encolher em linhas longas.
- Rótulo simplificado para Sombras Detalhadas. Saves nova série v1–v8 aceitos.

---

# PixelCity v7 — Distância até 5 chunks

- Slider estendido até 200 (=5 chunks): 50=2, 100=3, 150=4, 200=5. Faixa antiga e padrão preservados.
- Limites de configuração/save e névoa adaptados para o alcance adicional.
- Saves nova série v1–v7 aceitos.

---

# PixelCity v6 — Mini teclado QWERTY

- Números na primeira fileira, seguidos por QWERTY, ASDF e ZXCV. Ações em fileira própria.
- Navegação vertical por posição visual, mantendo a coluna aproximada nas fileiras de tamanhos diferentes.
- Saves nova série v1–v6 aceitos.

---

# PixelCity v5 — Navegação da AMOnições

- Setas navegam; Enter/Espaço ativam a ação focada. Escape cancela.
- Foco preservado após selecionar arma, comprar munição ou melhorar; se desativado, migra para uma ação válida.
- Botões desativados continuam respeitando dinheiro, capacidade, propriedade e nível máximo. Mouse/toque usam as mesmas ações.
- Saves nova série v1–v5 aceitos. Sintaxe validada.

---

# PixelCity v4 — Mini teclado para controle

- Editor de texto via controle com letras, números, espaço, apagar, limpar, cancelar e aplicar.
- Direcional/analógico navega em grade; A/✕ digita; B/○ cancela; Y/△ aplica. Mantém sanitização e limite original de cada campo.
- Placas da oficina e concessionária usam o teclado; mouse/teclado mantêm editor tradicional.
- Saves nova série v1–v4 aceitos. Sintaxe validada; controle físico pendente.

---

# PixelCity v3 — Padrão visual dos menus de compra

- Tuning, moda/joalheria, eletrônicos/mochilas, concessionária e AMOnições recebem botões arredondados, bordas discretas, divisórias finas e foco destacado.
- Paletas: oficina âmbar, moda rosa, joias dourado, eletrônicos ciano, mochilas verde e concessionária azul.
- Layout compacto para mobile/paisagem. Regras de compra e navegação mantidas.
- Saves da nova série v1–v3 aceitos. Sintaxe validada; teste visual de todos os menus pendente.

---

# PixelCity v2 — Restaurar menu AMOnições

- Menu da AMOnições restaurado integralmente ao visual e comportamento anteriores à v299 antiga.
- Demais alterações da v1 mantidas. Aceita saves da nova série v1 e v2; versões da série antiga continuam bloqueadas.

---

# PixelCity v1 — Nova numeração e saves

- Numeração reiniciada em v1, com base integral na antiga v301.
- Só carrega saves novos com gv=1 e identificação pixelcity-restart-1. Saves das versões anteriores e saves sem essa identificação são recusados tanto por arquivo como pelo navegador.
- Mecânicas e configurações mantidas; crie uma nova partida para gerar um save compatível.

---

# PixelCity v301 — Dinheiro de NPC abatido

- killPed também chama dropRoadCash: mortes por bala e combate recebem a mesma chance/valor de dinheiro dos atropelamentos.
- Proteção roadLoot impede duplicação. Faixa atual preservada: $0–20. Timoty, demogorgons e gangues mantêm suas regras próprias.
- Saves v258–300 aceitos.

---

# PixelCity v300 — Timoty nos registros

- Contador removido do mapa e inserido em Registros → Estatísticas, abaixo dos vinis.
- Marcadores vermelhos do radar preservados. Saves v258–299 aceitos.

---

# PixelCity v299 — Menu AMOnições

- Visual alinhado à oficina: card px, tipografia do sistema, destaque rosa, categorias em grade e botões compactos.
- Layout adaptável a celular/paisagem e rolagem interna.
- Controle mantém foco após troca de arma/compra/upgrade, incluindo recuperação se o botão ficar desativado. Direcional/analógico e confirmação/voltar usam a navegação existente. Teclado aceita setas e Enter/Espaço.
- Preços, estoque e upgrades preservados. Sintaxe validada; teste visual e controle físico pendentes. Saves v258–298 aceitos.

---

# PixelCity v298 — Mira e alcance do Timoty

- Reage a 16 m; depois de alertado mantém fogo até 48 m. Reinicia alerta ao sair desse alcance, entrar em interior ou morrer.
- Dispersão reduzida de ±1 m para ±0,175 m; mira acompanha altura do salto e porte do veículo. Raycast de 50 m, bloqueado por paredes.
- Dano e cadência preservados. Saves v258–297 aceitos. Sintaxe verificada; combate em gameplay pendente.

---

# PixelCity v297 — Último veículo no mapa

- Ícone de carro em turquesa no mapa e radar, com entrada na legenda, para PL.lastCar vivo e ainda existente. Some enquanto o jogador estiver nele, se destruído ou removido. Radar segue raio de proximidade dos locais.
- Limpeza original mantida: abandonTick remove usados após 60 minutos ingame e distância acima de 50 m, exceto keep, vinylCar, serviços, taxi chamado, barcos e carros da safe house. Checagem a cada 2 s.
- Saves v258–296 aceitos.

---

# PixelCity v296 — Alcance e dano do Tommy

- Alcance de reação reduzido de 32 para 16 metros.
- Dano por tiro triplicado: jogador 3 → 9 (antes da armadura), veículos 2 → 6.
- Cadência, vida e recompensas preservadas. Saves v258–295 aceitos.

---

# PixelCity v295 — Tommy no radar

- Pontos vermelhos para Tommys vivos exclusivamente no radar. Mesmo limite dos itens ?: 130 unidades em cada eixo.
- Derrotados deixam de aparecer; mapa completo não recebe marcadores.
- Saves v258–294 aceitos.

---

# PixelCity v294 — Mobiliário do cassino

- Mesas de jogos redistribuídas, cadeiras estofadas com encosto e pernas, lounge, balcões de bar e caixa alinhados às colisões.
- Prateleiras, garrafas, bandejas de fichas, grade do caixa, boiserie e acabamento de madeira/latão.
- Placas reposicionadas junto às paredes e saída identificada. Jogos e pontos de interação preservados junto às mesas.
- Detalhes de marcenaria agrupados na malha do ambiente. Sintaxe verificada; avaliação visual em gameplay pendente.
- Saves v258–293 aceitos.

---

# PixelCity v293 — Tommy nos becos

- Coletável Matar Timoty Verteccio X/5, contador no mapa e progresso próprio no save.
- Atiradores com 30 HP (pedestre comum: 3), rajadas contínuas a curta distância, sem consumo de munição.
- Locais determinados pela seed, preferindo becos de gatos/lixo e interiores livres, afastados das calçadas.
- $1.000 por derrota e bônus único de $5.000 pelos cinco: $10.000 total. Cheats bloqueiam os pagamentos.
- Sintaxe e teste de recompensa verificados; gameplay e cobertura de cinco locais em todas as seeds ainda não validados.
- Saves v258–292 aceitos.

---

# PixelCity v292 — Salto natural do arranha-céu

- Interação na borda sempre salta de paraquedas.
- Caminhar/pular para fora do topo inicia queda livre, sem combinação de teclas.
- Corrigida atualização visual durante a queda livre.
- Saves v258–291 aceitos; sintaxe verificada.

---

# PixelCity v291 — Topo do arranha-céu

- Seta de entrada leva ao topo em 109 m, usando o sistema de terraços.
- E na borda salta com paraquedas; Shift + E salta em queda livre (fatal no solo).
- Mantidos terraços anteriores e base v290. Saves v258–290 aceitos.
- Sintaxe verificada; conferência visual em gameplay pendente.

---

# PixelCity v290 — Pátios e danceteria diagonal

- Base v289 DualSense preservada; reincorporadas correções de alturas e recortes da outra linha v287.
- Cassino e danceteria usam asfalto, com vagas nas bordas livres dos lotes especiais; banco preserva área frontal. A quantidade depende das colisões e espaço disponível.
- Exterior da danceteria rotacionado em 45 graus: malhas, letreiro, porta e colisões. Ilha triangular e duas aberturas para circulação e estacionamento.
- Um carro do trânsito próximo pode entrar, aguardar 10 segundos e retornar à malha viária; espera se houver veículo/pedestre à frente.
- Sintaxe validada. Não houve validação visual WebGL nem teste físico do DualSense nesta versão; testar em cidade regenerada.
- Saves v258–289 aceitos.

---

# PixelCity v289 — DualSense: resposta dinâmica inspirada em GTA V (PS5)

**Novo (comportamento dinâmico único):** gatilhos variam conforme uso de acelerador/freio, velocidade, terreno/poças de lama, nitro, estado do motor e estimativa de troca de marcha; freada forte produz um pulso moderado similar a ABS. Cada arma possui ponto de resistência e reação ao tiro: pistola, metralhadora, Magnum, bazuca e explosivos/dispositivos. O pulso da arma é gerado apenas após um disparo realmente consumir munição. O controle/velocidade/tiro do jogo não é alterado; os comandos normais permanecem na Gamepad API.

**Configurações → Controle**: efeitos dinâmicos como única opção de comportamento. Mantém o ajuste de intensidade 10–100%, ativação/desativação, botão de autorização WebHID e teste. Não existe seletor de perfil antigo.

**Limites:** interpretação inspirada na sensação de GTA V no PS5, não reprodução de parâmetros internos da Rockstar. Apenas testes simulados de WebHID são possíveis aqui; testar força e conforto em um DualSense real. Recomendado iniciar com 45–65% de intensidade. As respostas táteis de terreno existentes na Gamepad API permanecem independentes.

**Compatibilidade:** USB/Bluetooth DualSense/Edge como na v288. Saves anteriores v258–v288 continuam válidos. Não há perfil Clássico na v289.

---

# PixelCity v288 — Correção WebHID DualSense

- **Corrigido** `ReferenceError: dev is not defined` ao transmitir comandos aos gatilhos adaptativos. Uma variável usada no envio estava sem declaração e o jogo roda em `use strict`.
- A **Gamepad API, suporte USB/Bluetooth e demais funções da v287 foram preservados**. A versão v288 aceita saves v258–v287.
- O erro `dev is not defined` **não é causado por permissões do Linux**. Só siga o procedimento de `udev` abaixo se a autorização falhar com erros como `NotAllowedError` ou `Failed to open the device`.
- Sintaxe e testes automatizados para abertura e envio dos relatórios USB/Bluetooth executados com simulação; teste com controle físico continua necessário.

---

# PixelCity v287 — DualSense WebHID (gatilhos adaptativos)

- Base v286 preservada. **Gamepad API permanece independente**: comandos do jogo e vibração continuam funcionando com DualSense, DualShock, Xbox e genéricos.
- Em **Configurações → Controle**: opção Gatilhos adaptativos (desligada por padrão), intensidade 10–100%, **Autorizar DualSense (WebHID)** e **Testar gatilhos**. A autorização é pedida apenas após clique/ação do usuário; conexão anterior autorizada pode ser reaberta sem diálogo.
- Duas conexões: USB (relatório `0x02`) e Bluetooth (relatório `0x31`, sequência + CRC32). DualSense original VID `054c`, PID `0ce6`; Edge PID `0df2`.
- Efeitos: R2 acelerador, L2 freio/ré com resistência proporcional à velocidade; helicóptero com pressão nos gatilhos; R2 com efeito de arma a pé. Menus, jogo pausado, troca de foco, controle desconectado, desativação ou falha liberam os gatilhos quando possível.
- Escreve **somente** os bits/bytes de efeito dos gatilhos; não altera luzes, microfone, som, rumble ou mapeamento da Gamepad API. Comandos enviados apenas em mudança ou manutenção (~1,4 s), serializados, com throttle da lógica de 120 ms.
- Sem bibliotecas externas novas e sem interferir na cidade/mundo. Novas preferências são salvas em `ps_cfg` e no perfil do save. Saves v258–v286 permanecem aceitos.
- **Linux/Chrome:** Bluetooth também é suportado, mas se o WebHID não abrir o `/dev/hidraw*`, verifique a permissão udev (Sony VID 054c, PID 0ce6/0df2; Bluetooth precisa casar `KERNELS=="*054C:0CE6*"` ou `*054C:0DF2*`). A permissão do site é necessária mesmo com regra udev.
- **Validação:** inspeção/sintaxe e teste isolado do protocolo; a resistência física precisa ser conferida com um DualSense real. Nenhum teste de hardware foi realizado neste ambiente.

### Linux: permissões para WebHID (somente se a conexão falhar)

Se a Gamepad API reconhece o controle, mas o navegador não consegue autorizar/abrir o WebHID, verifique as permissões `hidraw`. Em distribuições que usam `uaccess`, instale regras restritas ao DualSense/Edge:

```sh
sudo tee /etc/udev/rules.d/70-pixelcity-dualsense.rules >/dev/null <<'RULES'
# USB: DualSense / DualSense Edge
KERNEL=="hidraw*", ATTRS{idVendor}=="054c", ATTRS{idProduct}=="0ce6", TAG+="uaccess"
KERNEL=="hidraw*", ATTRS{idVendor}=="054c", ATTRS{idProduct}=="0df2", TAG+="uaccess"
# Bluetooth: o pai HID tem nome 0005:054C:0CE6 (ou 0DF2)
KERNEL=="hidraw*", KERNELS=="*054C:0CE6*", TAG+="uaccess"
KERNEL=="hidraw*", KERNELS=="*054C:0DF2*", TAG+="uaccess"
RULES
sudo udevadm control --reload-rules
sudo udevadm trigger
```

Desconecte/reconecte o controle (e encerre/reabra o navegador se necessário); em sessões sem `logind` ou instalação confinada (Flatpak/Snap), o acesso pode continuar restrito por políticas do sistema. Nunca rode o navegador como root nem abra todos os `hidraw` indiscriminadamente.

---

# PixelCity v286 — Pátios dos marcos especiais

- Removida a placa elevada genérica dos marcos (supermercado, arranha-céu, hospital e demais landmarks). O pátio usa o asfalto global em y=0.
- Calçada externa recortada ao redor do interior, preservando os acessos de estacionamento existentes; marcos sem acesso recebem um recorte para rua adjacente.
- Altura física do pátio acompanha o asfalto. Jardins, escadarias e construções próprias preservados.
- Ícones v285 preservados. Aceita saves v258–285; regenerar/carregar a cidade para reconstruir geometria.
- Validação de sintaxe e recorte geométrico; teste visual em gameplay pendente.

---

# PixelCity v285 — Iconografia do mapa e radar

- Pictogramas originais inspirados na legibilidade dos GTAs clássicos: silhuetas preenchidas, contorno escuro uniforme, detalhes reduzidos e paleta pastel coordenada. Oficina usa chave, concessionária carro frontal, cassino dado, danceteria taça, universidade capelo, estádio troféu e aeroporto avião.
- Mesmos caminhos vetoriais compartilhados entre mapa, minimapa e legenda, sem imagens externas. Marcador GPS agora é um pin amarelo em todos os caminhos de desenho; cor da rota e setas dos personagens preservadas.
- Ícones de locais ligeiramente menores para diminuir sobreposição. Estados do Império mantêm seu indicador colorido e filtros de revelação da campanha permanecem.
- Legenda desktop passa a 320 px, texto 13 px e ícones 28 px, com rolagem e área reservada no topo. Layout compacto mobile preservado.
- Base v284, sonoplastia e câmera longa preservadas. GAME_VER=285; aceita saves v258–284.
- Verificados sintaxe, cobertura dos tipos de ícone e renderização dos caminhos em prancha de referência. Não equivale a teste completo de gameplay WebGL.

---

# PixelCity v284 — Timbres de vozes, motores e armas

- Base v283; câmera longa suave preservada.
- Pedestres: identidade vocal estável, duas ressonâncias de vogais, contorno de entonação, sílabas de duração variável e ruído curto de consoantes/respiração. Continuam falas estilizadas sem palavras inteligíveis; limites de uma voz mobile/duas desktop e panorama existentes mantidos.
- Motores: formas periódicas compartilhadas por categoria com harmônicos de pulsos de combustão, mantendo dois osciladores permanentes. Carga do acelerador suavizada, pequena queda de volume na troca de marcha e ressonância menos aguda. Aplicado ao motor do veículo controlado pelo jogador, incluindo barcos e motos; aeronaves permanecem com seus sons próprios.
- Armas: ataque rápido, corpo grave e cauda de ruído pré-sintetizados em buffers compartilhados (três variantes por perfil), com variação discreta de reprodução. Limite de 10 disparos simultâneos mobile/18 desktop; fontes terminadas são desconectadas.
- Compressor no barramento de efeitos reduz picos de sobreposição. Música/rádio mantêm cadeia e controles existentes. Sem novas opções, downloads de samples ou convolução/reverb global.
- Sprites, gameplay, dano, cadência, missões e economia preservados. GAME_VER=284, aceita saves v258–283.
- Validação estática e testes isolados de síntese/agendamento; timbres, equilíbrio e custo precisam ser avaliados com áudio real no navegador/dispositivo.

---

# PixelCity v283 — Troca longa suave e sem giro no céu

- **Base: v282.** Referência de ritmo: v258 protegida anexada pelo usuário.
- A curva de ascensão longa ganha 0,65 s próprios. A subida principal volta a durar 1,1 s completos, em vez dos 0,72 s restantes da v282; a travessia conserva 1,8 s e a descida vertical 1,2 s.
- Removido o realinhamento ao norte no alto: a orientação vertical derivada da câmera inicial permanece durante a subida, travessia e descida.
- Após a descida, retorno suave de 0,65 s à posição, orientação e lente da câmera de gameplay. Duração total da troca longa: 5,4 s, antes 4,1 s.
- Troca curta, chamadas pelo celular, localização de Lucia, dupla, interiores e sistema protegido de sprites v258 preservados.
- `GAME_VER=283`, leitura de saves v258–v282 e da própria v283.
- Verificação: sintaxe e testes numéricos isolados de trajetória/orientação, fronteiras de fase, conclusão e integridade dos arquivos. Não substituem teste visual WebGL no jogo.

---

# PixelCity v282 — Hotfix da curva de saída LONGA

- **Apenas a primeira fase da troca distante foi corrigida.** O início agora reutiliza `camNadirPitch()` da troca próxima aprovada na v281: inclinação vertical sobre o eixo local da câmera, sem órbita/rotação lateral. A curvinha inicial sobe no mesmo X/Z da câmera real, sem atravessar o cenário de lado.
- Depois da curvinha, ao subir para o céu, a câmera se recentraliza sobre o personagem e alinha o norte do mapa gradualmente **apenas em altitude**, para conectar sem salto à fase de viagem existente.
- **Preservado byte a byte:** a troca próxima inteira, a viagem e chegada da troca longa, localização/seta rosa da Lucia, lógica da dupla, sprites protegidos, interiores e demais mecânicas.
- `GAME_VER=282`, carrega saves `.psave` v258–v281. Alteração sem impacto em geometria, shaders ou novas malhas.
- Verificações automatizadas cobrem sintaxe, continuidade e geometria da trajetória de saída; a experiência visual final requer validação no jogo.

---

# PixelCity v281 — Lucia no mapa e curvas de troca de personagem

- **Lucia já mora na cidade no primeiro instante do jogo:** posição própria criada após gerar/carregar a cidade, sem depender de uma troca prévia. A agenda e a chamada por telefone continuam iguais.
- **Localização itinerante:** quando Lucia está sozinha e livre, seu ponto pode mudar a cada **5 horas do jogo (~5 minutos reais)**. Se estiver acompanhando Jason, no carro, na casa ou em outro mundo, o sistema respeita esses estados e não a teletransporta por conta própria.
- **Seta rosa:** mesmo contorno da seta do jogador, em rosa, no mapa completo e no minimapa quando Lucia estiver próxima. Se Lucia for a personagem controlada, a seta vermelha padrão passa a representá-la, sem duplicação.
- **Otimização:** o NPC de Lucia só é materializado quando o jogador se aproxima; quando distante, apenas suas coordenadas são mantidas. O ponto de Lucia é armazenado no `.psave` da v281; saves anteriores continuam aceitos.
- **Troca distante:** ganhou curva de saída suave nos primeiros 0,38 s, partindo da câmera real e conduzindo ao enquadramento vertical antes da subida longa; descida e curva de chegada originais mantidas.
- **Troca próxima:** retirado o arco de órbita lateral da v280. A câmera agora sobe verticalmente e desce sem salto instantâneo a 25 m, usando uma inclinação no eixo local, preservando a orientação principal. Teste visual é necessário para confirmar a sensação exata.
- **Não alterado:** sistema de sprites/atlas/shaders/geometry-disposal da v258, chamadas de acompanhantes e save externo. `GAME_VER=281`; compatível com `.psave` v258–v280.

---

# PixelCity v280 — Curvinha reversa da troca + acompanhante animado

- **Troca de personagem próxima:** reproduz o movimento inverso da **curvinha final de retorno** da troca longa. Sai da câmera de jogo, sobe e inclina suavemente para o chão, reverte o arco e desce na câmera do outro personagem, sem orbitar lateralmente ou viajar até o céu.
- **Correção do piscar na v279:** removido o salto instantâneo para 25 m e o enquadramento nadir forçado logo no primeiro quadro. Durante o efeito, posição e orientação interpolam suavemente a partir da câmera de jogo; nenhuma textura, material, atlas ou descarte de sprites foi modificado.
- **Jason/Lucia acompanhantes:** estado exclusivo `duoFollow` agora aproveita os quadros de caminhada existentes quando o seguidor se desloca e volta ao quadro parado quando alcança o jogador. O sistema de seguir/entrar no carro não mudou.
- **Seletor Jason/Lucia no carro:** o retrato do personagem controlado permanece colorido mesmo quando a troca está temporariamente bloqueada; o indicador acompanha entrada/saída do veículo, sem liberar ações restritas.
- **Celular:** chamar o outro personagem continua apenas fazendo aparecer e seguir, **sem troca e sem animação de câmera**.
- **Segurança:** troca distante, interiores, saves e sistema protegido de sprites preservados. `GAME_VER=280`; compatível com saves v258–v279.
- **Validação:** sintaxe, verificações isoladas de curva, contato, animação e integridade do ZIP. A aparência final ainda precisa ser testada numa partida WebGL.

---

# PixelCity v279 — Câmera de troca curta, agora vertical

- **Correção:** a mini transição de Jason/Lucia utiliza o mesmo enquadramento **direto para o chão** da primeira etapa de `switchCam()` (câmera acima, `camera.up=(0,0,-1)`, sem órbita nem inclinação lateral).
- **Movimento:** sobe durante aproximadamente 0,46 segundo, inverte no ápice e desce em outros 0,46 segundo. Se estiver trocando entre personagens próximos, desloca-se horizontalmente apenas perto do ápice; se estiverem juntos no mesmo veículo, permanece na mesma coordenada horizontal.
- **Mesma mecânica:** troca de personagem por Alt/seletor, Jason/Lucia juntos ou dentro da casa segura; a troca entre posições distantes mantém a animação longa original.
- **Ligação pelo celular:** continua **somente chamando** o companheiro para aparecer e seguir, sem trocar de personagem ou mover a câmera.
- **Sem impacto em sprites:** nenhum material, geometria, shader, textura ou código de descarte de sprites modificado.
- **Versão:** `GAME_VER=279`, aceita saves v258–v278.
- **Validação:** sintaxe JavaScript, testes isolados de trajetória vertical e travas, integridade do ZIP. O resultado ainda requer avaliação visual em uma sessão WebGL completa.

---

# PixelCity v278 — Hotfix: ligação chama, troca é outra ação

- **Celular (Jason ↔ Lucia):** ao confirmar SIM, apenas cria/reaproveita o acompanhante próximo e ativa `DUO.follow`; o personagem que o jogador controla **não muda**, e a câmera **não executa o mini arco**.
- **Troca de personagem (Alt/seletor):** mantém o mini arco cinematográfico de 0,86 s para personagens próximos, inclusive dupla junta no carro. Trocas distantes mantêm a animação longa.
- **Estabilidade:** modificado somente o acionamento da animação na função `phoneMateCall`, comentário, número de versão e compatibilidade de saves. Nenhuma alteração nos sprites, materiais, shaders, shaders de água, geometria, IA de acompanhantes ou comandos.
- `GAME_VER=278` e compatibilidade com saves `.psave` v258–v277.

## Verificação

Sintaxe JS, isolamento da função de chamada, pontos de troca de personagem, compatibilidade de saves e integridade do ZIP verificados automaticamente. A validação visual na partida permanece a cargo do teste no navegador.

---

# PixelCity v277 — Mini arco da câmera entre personagens próximos

- **Jason/Lucia próximos:** a troca a menos de 45 m usa uma animação de 0,86 segundo que inicia a subida da câmera, sobe pouco e desce imediatamente, sem percorrer a cidade ou mostrar loading.
- **Dupla junta:** `duoSwap()` no mesmo veículo ou lado a lado usa o mesmo efeito breve. Continua mudando quem o jogador controla, sem trocar os assentos.
- **Ligação pelo celular na v277:** a animação curta ao chamar o companheiro foi posteriormente removida na v278; ligação apenas faz spawn e segue.
- **Trocas distantes e entre mundos:** mantidas as animações longas e os fades originais.
- **Interiores fechados:** a subida visual é pequena (1 metro) para evitar atravessar tetos.
- **Transição suave:** a câmera base segue calculada a cada quadro, evitando um salto no fim do efeito. Bloqueia trocas repetidas durante os 0,86 s.
- **Proteção:** preservados os trechos de SpriteMaterial, shaders, atlas, drawRange, geometria compartilhada e descarte da v258. Nenhuma mudança no sistema de sprites.
- `GAME_VER=277`, aceita saves `.psave` v258–v276.

## Verificação

Sintaxe JavaScript validada; testes isolados de câmera com elevação curta, troca próxima e condição de bloqueio; integridade do ZIP verificada. A partida completa em WebGL ainda exige validação visual.

---

# PixelCity v276 — Jason e Lucia na agenda do celular

- O celular de Jason agora tem Lucia como contato (771); o de Lucia tem Jason (770).
- Ligar pelo contato ou discar o número abre confirmação **CHAMAR LUCIA/JASON PARA CÁ? — SIM / NÃO** no mesmo padrão da configuração de notificações.
- Ao selecionar SIM, um único acompanhante surge perto do jogador e começa a segui-lo imediatamente, reutilizando `duoSpawnFollower`/`duoTick`, com embarque no carro quando possível.
- NÃO cancela sem alterar o mundo; ligações repetidas não geram NPCs duplicados.
- O contato ocupa uma só linha na agenda do personagem ativo; a agenda ajusta o espaçamento quando existe bomba remota.
- Impedida a chamada durante interior, helicóptero, barco, táxi ou transições de mundo; o telefone explica por quê.
- Mantidas as regras de Lucia motorista/Jason carona da v275; o sistema protegido de `SpriteMaterial`, shaders, texturas e geometria compartilhada da v258 não foi modificado.
- `GAME_VER=276`, com leitura de saves da v258 à v275.

## Testes

Testar a chamada dos dois personagens em terreno aberto e dentro de carro, em ambos os idiomas, e verificar retorno de viagem entre mundos. Os testes automatizados de funções não substituem uma partida WebGL completa.

---

# PixelCity v275 — armas no veículo, assentos ocidentais e jammer no UZUMYMW

- **UZUMYMW:** entrega também jammer até a capacidade permitida (3 sem mochila; até 50 com mochila). Permanece cheat e desabilita salvar, como antes.
- **Troca de arma dentro do veículo:** scroll, TAB, teclas numéricas, botão de armas no touch e B/○ no controle; o rádio permanece em Q / ← no controle e nas teclas , e .
- **Drive-by:** motorista usa pistola, Colt Magnum, metralhadora e jammer; passageiro Jason com Lucia dirigindo também pode selecionar bazuca. Granadas/bombas programadas continuam a pé. Na entrada, arma não permitida é recolhida com a munição intacta.
- **Conversíveis/Roadster:** posição do motorista passou para o lado esquerdo do carro (padrão ocidental) e carona para a direita; câmera em primeira pessoa acompanha os bancos corrigidos.
- **Dupla:** Lucia é sempre motorista quando ambos estão no carro, Jason é passageiro. Jason sozinho assume o volante; quando Lucia entra, fica ao volante. Alt troca o personagem controlado sem trocar assentos, preservando IA de direção existente.
- **Preservado:** materiais/shaders de sprites e geometria compartilhada da v258, mundos, interiores e economia. `GAME_VER=275`, com compatibilidade de leitura de saves da v258 à v274.
- **Validação:** testes sintáticos e isolados. Interações e posições dos sprites dentro do WebGL requerem confirmação em jogo real.

---

# PixelCity v274 — Jammer apaga semáforos e libera o trânsito caótico

## Mudança nesta versão

- **Jammer**: mantém a ativação original apenas à noite, duração de **60 segundos reais** e raio fixo de **100 m** a partir do ponto de acionamento.
- **Semáforos**: todas as três lentes dos sinais nas interseções atingidas ficam escuras. Isso se sobrepõe ao pisca amarelo de tempestade; sinais fora do raio permanecem normais.
- **Trânsito**: tanto os carros de IA física quanto os que usam os trilhos virtuais ignoram vermelho/amarelo nesses cruzamentos. Carros podem atravessar sem esperar e causar congestionamentos ou colisões; continuam existindo as verificações normais de outros carros, vias e pontes.
- **Fim do efeito**: com o timer encerrado, a sinalização volta ao ciclo original e os motoristas passam a respeitá-la, sem reconstruir a cidade.
- **Noite, iluminação e idioma**: as lâmpadas de rua e fachadas continuam usando a mecânica de apagão anterior. A notificação do jammer agora menciona o trânsito e tem equivalência em inglês. Os reflexos dos semáforos apagados são removidos do brilho molhado.
- **Desempenho**: sem geometria adicional, áudio, novos shaders ou busca espacial global; reaproveita a verificação de distância já usada pelo jammer no momento de consultar cada cruzamento.
- **Compatibilidade**: `GAME_VER=274` e leitura de saves v258–v273. Nenhuma alteração nos dados persistidos.
- **PROTEÇÃO**: nenhum trecho dos sprites (material, atlas, drawRange ou geometria compartilhada da v258) foi alterado.

## Verificações

- `node --check` do script do jogo: aprovado.
- 31 testes isolados: ativação noturna, raio, sinalização apagada, desobediência à sinalização em tráfego próximo e distante, prioridade sobre tempestades, restauração após 60s, uso dentro de carro, restrição diurna/interiores e compatibilidade de saves.
- Comparação de código: apenas a lógica do jammer e semáforos/reflexos, versão e catálogo EN foram alterados.
- **Limitação**: ainda não foi validada a cena 3D completa. O efeito pode causar colisões e filas grandes com a densidade de trânsito alta; isso faz parte da mecânica, mas deve ser avaliado no jogo.

---

# PixelCity v273 — Cassino jogável e P centralizado

- Mesas de BLACKJACK (21) e VIDEOPÔQUER passaram de decorativas a interativas por E/F/controle.
- Blackjack: baralho de 52 cartas, ases flexíveis, pedir/parar/dobrar, banca para em 17, pagamento de blackjack natural 3:2, empate devolve aposta.
- Videopôquer: Jacks or Better de cinco cartas, segurar cartas, uma troca, classificação e tabela de pagamentos; só usa dinheiro virtual do jogo.
- Apostas $10/$50/$100/$500. Rodada abandonada perde aposta em aberto; nenhuma operação na internet nem dinheiro real.
- Malha P da garagem da casa segura deslocada para o centro das vagas amarelas.
- Sem mudança na geometria ou materiais de sprites protegidos da v258, sem alterar a geração de cidades ou o fluxo dos interiores da v272.
- Nova versão 273, com compatibilidade de leitura dos saves v258–v272.
- Testes de sintaxe, regras dos jogos e inspeção de arquivos. Ainda precisa de teste visual no WebGL.

---

# PixelCity v272 — Interiores isolados em todas as entradas

**Build experimental derivada da v271, que tinha casa segura e AMOnições testadas pelo usuário.**

- `roomStageRoot`, `roomStageKind` e `roomStageLocalTick`: novo gerenciador único de interiores.
- Aplicado a casa segura, AMOnições, posto/conveniência, shopping, cassino, danceteria, casas de assalto, penhores, empresas/Império, banco e delegacia/prisão.
- Cassino e danceteria agora têm subgrupos de geometria independentes, embora compartilhem o mesmo sistema de gameplay.
- Somente o interior ativo, personagem e sprites locais necessários participam do desenho; sem descarte de RAM/VRAM.
- Simulação externa interrompida durante o interior; manutenção da lógica local, incluindo timers de heist, shop, cassino, banco, prisão e Império.
- Transição curta de fade com CARREGANDO... na entrada e saída.
- Protegido o sistema de sprites v258: sem alterações em SpriteMaterial, atlas, drawRange ou geometria compartilhada.
- Atenção: ainda exige testes completos em partida, principalmente cassinos, transições de missão, prisão e eventos de TV.

---

# PixelCity v271 — interiores suspensos e pause das cutscenes

## Protótipo experimental
- Casa segura e AMOnições: ao entrar/sair, uma tela breve CARREGANDO... com fade aparece (sem barra).
- A cidade externa fica residente em memória, porém seus objetos de cena são ocultados enquanto o interior está ativo. Não há descarte de geometrias, materiais ou texturas.
- O loop principal deixa de atualizar trânsito, física de veículos, pedestres comuns, clima e demais subsistemas exteriores dentro destes dois interiores. O jogador, diálogos e personagens fixos do interior continuam sendo atualizados. A TV da casa retoma temporariamente o exterior enquanto o canal está ativo.
- Ao sair, visibilidades anteriores são restauradas. Carros, seed, inventário, dinheiro, personagens, progresso e variáveis são mantidos como estavam; não há regeneração do mapa.
- Outros interiores continuam no sistema anterior nesta versão de teste.
- Protótipo precisa de validação WebGL das interações, câmera, NPCs e iluminação no interior.

## Pequeno fix — pause durante cutscenes
- O menu de pause de abertura e créditos exibe apenas MONITOR + REGISTROS na primeira linha e VOLTAR AO MENU INICIAL abaixo.
- CONFIGURAÇÕES e SALVAR JOGO ficam ocultos nessas cutscenes e a função de abrir configurações é bloqueada.
- Fora das cutscenes o layout 2×2 do menu permanece inalterado.

## Garantias
- Nenhum material, atlas, shader, drawRange ou método de descarte protegido dos sprites foi editado.
- O sistema de saves reconhece versões 258–271; não converte tamanhos de cidade.
- Não foi realizado teste de execução WebGL completa neste ambiente.

---

# PixelCity v270 — reflexos, sons e fumaça otimizada

Base: v269. A proteção de sprites da v258 foi preservada.

- **Reflexo solar/lunar:** ajusta o fator especular da água e o reflexo do céu no asfalto molhado conforme o encobertamento (chuva/nuvens/tempestade). Reflexos artificiais dos postes/faróis continuam separados.
- **Áudio espacial:** o listener 3D passa a atualizar independentemente da rádio para que a sirene HRTF funcione corretamente sem estação escolhida. Uma sirene prioritária por vez, como antes; motor do jogador continua centralizado.
- **Chaminés:** taxa reduzida de ~4 para ~1,35 partículas/s de perto, ~0,48/s a média distância; alcance menor. Usa a mesma pool de partículas do jogo.
- **Armas:** estampidos sintéticos mais secos e distintos para pistola, metralhadora e Magnum; RPG preserva efeito de lançamento existente. NPCs mantêm um disparo genérico.
- **Motores:** reduz harmônicos agressivos de modelos comuns, mantém dois osciladores existentes e usa mistura filtrada, marcha, carga e pequena variação de marcha lenta. Sem novos osciladores permanentes. O micro-modulador `soundVary` agora é compartilhado entre disparos, motores e vozes de NPC.
- **Versões:** GAME_VER 270, aceita saves 258–269.
- **Limitações:** precisam ser conferidos em WebGL o visual do reflexo e os timbres no dispositivo real; não há garantia de melhora universal de FPS.

---

# PixelCity v269 — NPCs com grunhidos e conversas procedurais

- **Blablabla sintetizado por Web Audio**: os NPCs que conversam alternam falas curtas com sílabas, timbres e ritmos variáveis. Sem arquivos de áudio externos e sem geração de texturas ou meshes.
- **Encontros reais na rua**: pedestres que se aproximam ocasionalmente param para uma conversa curta e depois seguem andando. O detector busca candidatos próximos do jogador em intervalos de ~1,1–1,7 s, não faz varredura de todos os pares a cada frame.
- **Conversas que já existiam**: pares criados pelo jogo também recebem som. Falas em balões de NPCs próximos geram um murmúrio breve.
- **Grunhidos ocasionais** de pedestres perto do jogador, com intervalo global aproximado de 7–14 segundos.
- **Custo controlado**: um oscilador e um filtro por fala; até 2 falas simultâneas no PC e 1 no celular; alcance de 17–26 m e atenuação por distância. O som segue MUTE e volume de efeitos. Nenhuma voz é calculada em locais distantes, durante o Benchmark ou em mundos sem pedestres comuns.
- **Preserva o sistema v258**: nenhuma alteração em `SpriteMaterial`, shaders, atlas pixelado, iluminação, `drawRange` ou descarte/geometria compartilhada dos sprites.
- `GAME_VER=269`; leitura de saves anteriores da v258 à v268.

## Limitações e validação

- Vozes são sílabas estilizadas *sem palavras inteligíveis*; não dependem do idioma (BR/EN). Não alteram o texto dos diálogos.
- Testes de sintaxe, regras de áudio/limites/encontros com módulos simulados e integridade do pacote não substituem uma partida WebGL real, que requer confirmação de volume e timbre em PC/celular.

---

# PixelCity v268 — aviso de heliponto vazio

- Próximo ao heliponto vazio da casa segura, o jogador **a pé** recebe aviso laranja: **VOCÊ PODE GUARDAR UM HELICÓPTERO AQUI**.
- A dica dura **6 segundos reais**, aparece **uma vez a cada aproximação** (entra até 10 m e reinicia após se afastar além de 14 m), e não aparece se houver helicóptero pousado na vaga.
- Avisa somente; não cria nem guarda helicópteros automaticamente. Regras de armazenamento e salvamento originais preservadas.
- Inglês incluso: **YOU CAN STORE A HELICOPTER HERE**.
- Base v267; `GAME_VER=268`; saves anteriores v258–267 continuam aceitos.
- **NÃO ALTERAR AQUI (v258)**: nenhuma alteração em SpriteMaterial, atlas, geometria compartilhada, iluminação, drawRange ou descarte de sprites.

## Validação

- JavaScript analisado pelo Node.js; testes isolados da lógica de proximidade/vaga; conferência do diff; ZIP verificado.
- **Limite:** a execução da partida WebGL completa ainda depende de teste visual no navegador.

---

# PixelCity v267 — AMOnições com armas reais · Jason e Lucia juntos

## Novidades
- As sete armas decorativas da AMOnições usam a mesma construção geométrica dos coletáveis reais do jogo (pistola, SMG, Magnum, bazuca, granada, bomba remota e jammer). Somente a compra no balcão oferece arma ou munição; a vitrine não possui pickup nem colisão individual.
- Um personagem deixado no mesmo mundo por até 5h de jogo pode aparecer como pedestre persistente quando o jogador se aproxima. Os dois se cumprimentam e aparece `E/F/→ · BORA ROLÊ`. A interação cria o seguidor existente; ao entrar em carro, ele acompanha o jogador como motorista ou passageiro.
- Nos carros conversíveis `conv` e `roadster`, os personagens do jogador aparecem nos assentos usando o **sistema já existente de sprites sentados**. Aparece Jason mesmo sozinho; com duo ativo, aparecem Jason e Lucia. Nas câmeras internas a troca Alt alterna a posição da câmera entre os assentos.
- Limpeza automática dos personagens temporários quando distantes/ao trocar de mundo. Mantidos estilos, cidades 7×7/14×14, gráficos, saves v258–266 e iluminação/material/shader protegidos dos sprites (v258).

## Testes e limites
O código exige validação visual em WebGL: posição dos ocupantes, entrada da loja, convivência perto dos carros e viagens entre mundos. Testes isolados de sintaxe e lógica são descritos nos resultados da entrega; não equivalem a testar o jogo completo.

---

# PixelCity v266 — Árvores originais + sombra de floresta por textura

**Base: v265.** Mantidos os ajustes do trânsito (máximo real equivalente ao antigo 75%) e da ponte levadiça.

## Floresta

- **Mesh restaurado da v264:** a floresta voltou a usar exatamente as mesmas copas arredondadas e o mesmo tronco das árvores da cidade (aproximadamente **200 triângulos por árvore**, em vez dos 116 da v265). Mantidos quantidade, distribuição por seed, clareira, coletável e Demogorgon.
- **Sombras reais desligadas apenas na floresta:** árvores e tufos florestais agora ficam em um **batch separado**, com `castShadow=false` e `receiveShadow=false`; o piso da floresta também não recebe sombras dinâmicas. As árvores urbanas e demais sombras da cidade não foram alteradas. O teste de oclusão da iluminação dos atores não recebe árvores da floresta como obstáculos.
- **Sombra falsa no solo:** **uma única malha plana com dois triângulos**, com textura RGBA procedural **192×192** irregular e bordas transparentes. A clareira e o caminho de entrada ficam mais claros. Textura gerada uma vez na criação do chunk, determinística por seed, sem animações, sem raycasts e sem shadow pass. A mancha permanece visível mesmo com o ajuste global de sombras desativado, pois é decoração.
- **LOD e árvores derrubadas:** o novo batch participa do mesmo LOD de vegetação. Quando uma árvore da floresta cai, o sistema usa a geometria correta desse batch e não passa a gerar sombra real por engano.
- **Limpeza:** textura e material da mancha usam a lista de recursos da cidade e são liberados ao regenerar. Não há criação de texturas por frame.

## Proteções e compatibilidade

- **NÃO ALTERAR AQUI (v258):** `SpriteMaterial`, atlas, iluminação e geometria compartilhada dos sprites mantidos. Não foram introduzidas alterações de shader dos personagens.
- `GAME_VER=266`; leitura de saves `.psave` das versões **258 a 265**, além dos saves da própria v266.
- Estilos, pontes, cemitério, AMOnições, gráficos e clima mantidos da v265.

## Validação

- Sintaxe JavaScript verificada; integridade ZIP verificada.
- Teste isolado em Chromium: textura gerada, semente repetida gera os mesmos pixels, sementes diferentes alteram a mancha; borda transparente e clareira central mais clara.
- Auditoria de código: árvores originais, `castShadow=false` no batch florestal, `receiveShadow=false` no piso, LOD e árvore derrubada ajustados; funções críticas dos sprites idênticas às da v265.
- **Não foi possível executar uma partida WebGL completa.** O ganho real de FPS e a aparência no jogo precisam de confirmação visual; o número de triângulos visíveis das árvores voltou a subir, mas o trabalho extra do mapa de sombras foi removido.

---

# PixelCity v265 — floresta leve, trânsito e pavimento da levadiça

Partindo da v264 confirmada pelo usuário, sem alterar a renderização protegida dos sprites.

- **Floresta:** as árvores rurais usam versões simplificadas de copa (10×6 → 7×5 segmentos), segunda copa (8×5 → 6×4) e tronco (9 → 6 lados). Mantêm as duas copas, cores, posição, escala, sombra, vento, colisão e quantidade de árvores. As árvores urbanas NÃO mudaram. A redução geométrica teórica por árvore está em torno de 40–50%, conforme contagem das primitivas (não é uma medição de FPS).
- **Trânsito:** o slider continua 0–100, mas o gerador usa internamente 75% do valor anterior (multiplicador efetivo `.75`). LOW/MÉDIO/ALTO e configurações salvas continuam funcionando; o controle dos carros da polícia permanece separado. A densidade final pode cair mais de 25% por causa da curva exponencial que já existia.
- **Ponte levadiça:** material de pista com fallback escuro se o mapa de asfalto não existir, leve escurecimento de segurança com a textura presente e guarda/passeio menos claros; UVs atualizadas em todas as faces do tabuleiro conforme posição, com a mesma textura repetida da rua. Preserva a versão de terra das pontes rurais, asfalto urbano, marcações, sombras, articulação e colisão. A causa exata da cor branca na seed fornecida ainda requer teste WebGL visual.
- `GAME_VER=265`, com leitura de saves 258–264. Seed determinística preservada.

**Verificações:** teste de sintaxe JS, integridade ZIP, asserções de código e auditoria do diff. Não houve execução 3D integrada neste ambiente; não há garantia de ganho de FPS ou correção visual na seed sem teste do jogador.

---

## Correção de inicialização — seed vazia e botões inativos

Corrigida a ordem de declaração de `IS_MOBILE` antes de `GRAPHICS_PRESETS`. Na v263, o perfil MÉDIO acessava essa constante antes da inicialização (`ReferenceError`), interrompendo o script antes de preencher a seed e ligar os botões (inclusive BENCHMARK). Preservados o comportamento do benchmark e as proteções de sprites da v258. Não altera saves.

---

# PixelCity v264 — Cemitério rural, floresta e mais prédios em L

- **Cemitério rural/periférico:** a escolha privilegia os terrenos mais distantes do centro, sem depender de o lote já estar classificado como `rural` no Mobile 7×7. Preserva a exclusão da zona de aproximação do aeroporto; o obelisco de 16,9 m permanece íntegro.
- **Floresta:** reserva por seed uma das quadras rurais restantes *depois* de todos os marcos obrigatórios e da indústria. Dezenas de árvores da mesma função existente na cidade, geometrias agrupadas e uma clareira central.
- **Item escondido:** no centro da floresta, um coletável determinístico (jammer, Colt, metralhadora ou granadas), salvo via `city.picked`, sem respawn.
- **Demogorgon:** inimigo que nasce perto do jogador, utiliza o sistema de NPC do Rampage (`DEMO_PAL`), tem 9 HP = 3× o pedestre comum, causa dano corpo a corpo e permanece derrotado no save. Não nasce no Mundo Invertido ou Point Haze.
- **Prédios em L menores:** nos quarteirões urbanos 4×4, a distribuição passa a usar 3 ou 4 conjuntos L curtos em quadrantes disjuntos em vez de 1 ou 2, reduzindo as torres individuais. Lotes grandes e seus edifícios existentes não foram alterados.
- **Correção das sombras de prédios largos e em L no personagem:** o cache de obstáculos estruturais para a iluminação dos sprites agora é preenchido no momento de construir cada chunk, antes de SHADOW DISTANCE alternar `castShadow`; inclui paredes, conectores L, telhados volumétricos e árvores. Impede cache vazio ou incompleto quando o chunk foi visto pela primeira vez com sombras desativadas. Os ornamentos pequenos ficam fora desse teste para reduzir CPU.
- **Renderização de sprites v258:** sem alterações no `SpriteMaterial`, geometria compartilhada, atlas, código de iluminação dos sprites, sombras da GPU ou preparação GPU. O ajuste ocorre somente no registro das malhas estruturais como oclusores.
- **Saves:** `GAME_VER=264` e leitura das versões 258–263. Uma cidade carregada da versão anterior será reconstruída com as novas regras, portanto a posição de terrenos pode mudar.

**Limitação dos testes:** sintaxe, integridade, determinismo por seed e componentes isolados foram testados; a partida WebGL completa precisa ser verificada visualmente.

---

# PixelCity v263 — Presets de Gráficos (BAIXO, MÉDIO, ALTO)

Base: v262, conservando AMOnições, Cassino e Malibu Flash separados, 7×7 / 14×14, 6 câmeras, sistema de sombras independentes e PROTEÇÃO DOS SPRITES DA v258.

## Presets no topo de CONFIGURAÇÕES → GRÁFICOS

| Opção | BAIXO | MÉDIO (provisório, padrão atual de PC) | ALTO |
|---|---:|---:|---:|
| Trânsito | 0 | 50 | 100 |
| Pedestres | 0 | 50 | 100 |
| DRAW DISTANCE | 0 | 50 | 100 |
| OBJECT DISTANCE | 0 | 50 | 100 |
| SHADOW DISTANCE | 0 | 50 | 100 |
| Resolução interna | 0 (mínimo seguro) | 100 | 100 |
| Sombras | OFF | ON (PC) / OFF (Mobile) | ON |
| Qualidade das sombras | 1× | 1× | 4× |
| Sombras Detalhadas | OFF | OFF | ON |
| Bloom | OFF | ON | ON |
| Reflexos | OFF | ON (PC) / OFF (Mobile) | ON |
| Luzes dos postes | OFF | ON (PC) / OFF (Mobile) | ON |
| Quantidade de postes | 1 (inativo) | 4 | 4 |

**Não alteram:** limite de FPS, música/som, língua, HUD/minimapa, controles, seleção do mundo, chuva/temporal, tamanho/seed. O motor de celular ainda não permite luz real dos postes mesmo selecionando ALTO; esse limite original é intencional.

**Observação:** o 0 dos sliders usa seus limites mínimos de segurança existentes: resolução interna mínima nunca zera pixels, 0 tráfego/pedestres pode manter participantes obrigatórios de missões. O perfil MÉDIO está explicitamente provisório, aguardando teste do usuário em PC mais modesto.

**Persistência:** os presets aplicam todos os campos gráficos na configuração já salva em `ps_cfg`. Seleção é detectada a partir dos valores atuais; qualquer ajuste manual torna o painel PERSONALIZADO. O Benchmark mantém perfis temporários próprios e não modifica preferências salvas.

**Proteção:** nenhum trecho de SpriteMaterial, atlas, iluminação de atores, geometria compartilhada, drawRange ou descarte de sprites foi alterado. A única integração é uso da rotina original `applyShadows()` quando o botão muda o estado de sombras, como se o usuário acionasse o checkbox normal.

**Compatibilidade:** GAME_VER=263; permite ler saves 258–262. Não altera tamanho do mapa nem geração. Uma partida WebGL completa não foi validada neste ambiente; testes estáticos e isolados de UI/valores não substituem jogo real.

---

# PixelCity v262 — cassino e danceteria em quarteirões distintos

Base: **v261 com a notificação de câmera de 15 segundos**. Preservados 7×7 e 14×14, os controles de sombra da v259, a AMOnições e a mira 3D.

## Correção
- Cassino PIXEL ROYALE e danceteria MALIBU FLASH agora ocupam **dois quarteirões reservados diferentes**, inclusive no Mobile 7×7.
- Cada edifício tem suas próprias paredes, colisores, fachadas, entrada, marquise e marcador no mapa. Não se sobrepõem mais no mesmo lote.
- Cassino continua voltado para +Z e danceteria para -Z. A entrada, o interior, a pista, o bar, os caça-níqueis e as missões permanecem os mesmos.
- Reserva dos terrenos após aeroporto e marcos essenciais, mas antes da indústria. O novo terreno da danceteria não pode ser reutilizado por indústria, garagem, turismo ou imóveis comuns.
- O carro da danceteria foi movido para a área frontal externa, evitando nascer dentro do volume do prédio.
- O gerador verifica explicitamente que há `clubRi` separado de `casino.ri`. Caso não haja terreno válido, falha claramente em vez de construir sobreposição.
- `GAME_VER=262`; mantém leitura de saves `.psave` das versões 258–261. Uma cidade carregada é reconstruída pela seed com o novo plano, então as posições desses estabelecimentos poderão mudar.

## Precauções
- **NÃO ALTERAR AQUI:** o sistema estabilizado de sprites/atlas/geometria compartilhada da v258 foi mantido sem alterações.
- A construção de cassino/danceteria foi separada por lote, sem aumentar a quantidade de estabelecimentos ou dos NPCs internos.
- Validações: sintaxe JavaScript, 800 simulações **sintéticas** de reserva de terrenos (400 em 7×7 e 400 em 14×14), duas fachadas em ramos independentes, manutenção do aviso de 15 s e compatibilidade declarada de saves. Essas simulações não são uma auditoria de todas as seeds reais.
- A validade visual, navegabilidade e geração completa em seeds reais exigem conferência em WebGL no dispositivo do jogador; o navegador de teste bloqueou acesso HTTP local (`ERR_BLOCKED_BY_ADMINISTRATOR`).

---

**Patch de notificação (v261, sem mudança no save):** o aviso laranja das câmeras isométrica/top-down permanece por 15 segundos reais. Alterados apenas os parâmetros de duração nas duas chamadas de `toast(..., 'camwarn', 15)`; não há mudanças nos sprites, no motor ou na versão do save.

# PixelCity v261 — mira 3D em câmeras superiores e aviso de câmera

Base: **v260**. Preservados os tamanhos Mobile 7×7 e Normal 14×14, todas as câmeras e a AMOnições.

## Alterações
- Alternar pela tecla V, controle ou botão mobile para perspectiva isométrica/top-down mostra aviso **laranja** no HUD: “Alguns recursos podem ser limitados ou inacessíveis nessa câmera”, com tradução EN e duração de 15 s.
- Clique com armas nas câmeras superiores mira no **primeiro ponto real interceptado por um raio 3D** — o eixo vertical não é mais anulado. Permite tiros em paredes, telhados e alvos no alto quando visíveis.
- Com toque/controle (sem cursor), alvo aéreo dentro de cone frontal de cerca de 12,5° e até 230 m pode receber assistência de elevação. Fachadas continuam interceptando a trajetória: não atravessa edifícios.
- `rayHit` agora distingue altura real de prédios, poleiros baixos, solo e aeronaves. Aeronaves têm colisão matemática simplificada (sem raycasts pesados em geometria), HP e consequências de impactos; helicópteros policiais têm cooldown de retorno após abatidos.
- RPG mantém trajetória 3D, ganha alcance para atingir aeronaves no alto e explode ao atingir fachadas de edifícios; colisão é resolvida em passos, como antes.
- **Não foram alterados** SpriteMaterial, atlas, geometria compartilhada, `drawRange`, shader de iluminação, pré-carregamento de sprites ou suas rotinas de descarte (proteção v258).

## Limitações / testes
- Validar no WebGL a precisão de apontar para aeronaves e colisões em prédios complexos, especialmente no top-down reto (que pode não mostrar uma aeronave acima da câmera).
- A colisão aérea usa volumes esféricos simplificados; a colisão de fachadas usa os retângulos e alturas conhecidos pelo gerador.
- Não altera o comportamento da geração das cidades nem a estética e a distribuição de sprites.
- Leitura de saves `.psave` das versões 258, 259 e 260 preservada; esta versão incrementa `GAME_VER` para 261.

---

# PixelCity v260 — AMOnições / sistema de upgrades

Versão baseada em v259, mantendo **intacto** o sistema protegido de sprites e geometria compartilhada da v258.

## Implementado
- Uma AMOnições determinística por cidade Modern/Synthwave, escolhida junto a uma fachada; entrada automática e interior 3D compacto com vitrine estática de sete armas, balcão, caixas de munição e vendedor. Local no mapa.
- Menu interativo de compras. Pistola, metralhadora, Colt Magnum, bazuca, granada, bomba remota e jammer disponíveis; recompra fornece munição respeitando o limite. Lotes de +50 para armas balísticas, +3 para explosivos, +1 jammer.
- Upgrades permanentes para **pistola, SMG e Colt Magnum** (Dano, Cadência e Foco), três níveis cada. Especiais sem upgrades nesta versão para não desequilibrar explosões/jammer.
- Desvio de disparos mesmo mirando, ajustado pelo upgrade de foco; não altera sprites nem material de luz.
- Spawn de armas dos becos e corredores diminuído pela metade. Jammer garantido único e recompensas especiais preservados. Itens coletados não respawnam.
- Upgrades persistem no save v260; a leitura dos saves v258 e v259 continua disponível. Trocas de mundos via snapshot preservam os upgrades.
- UI com PT/EN e sinalização interna; mapa identifica AMOnições.

## Tabela inicial da AMOnições

| Item | Preço por compra | Munição adquirida | Melhorias |
|---|---:|---:|---|
| Pistola | $450 | 50 balas | Dano, Cadência e Foco (0–3) |
| Metralhadora | $1.700 | 50 balas | Dano, Cadência e Foco (0–3) |
| Colt Magnum | $2.300 | 50 balas | Dano, Cadência e Foco (0–3) |
| Bazuca | $12.500 | 3 foguetes | Sem nesta versão |
| Granada | $1.000 | 3 granadas | Sem nesta versão |
| Bomba remota | $2.300 | 3 cargas | Sem nesta versão |
| Jammer | $3.800 | 1 unidade | Sem nesta versão |

Custos de melhorias aumentam conforme o nível; dano recebe +10% por nível, cadência reduz o intervalo entre tiros em 10% por nível e foco reduz o desvio em 20% por nível. Não há respawn de armas dos becos.

## Limitações de teste
- Sintaxe do JavaScript e testes de lógica executáveis; partida WebGL e cenário completo não foram verificados no ambiente.
- A localização da loja em seeds com baixa disponibilidade de portas usa fallback de corredor urbano.
- A compra é feita no balcão por E / F / seta do controle; saída pela porta traseira.
- **NÃO ALTERAR AQUI:** SpriteMaterial, atlas, iluminação, `drawRange`, geometria compartilhada e descartes dos sprites ficam protegidos como na v258.

---

# PixelCity v259 — Sombras Independentes / Sombras Detalhadas

**Base:** v258 protegida, confirmada pelo usuário como estável em todos os mundos.
**Proteção:** nenhuma alteração em `SpriteMaterial`, atlas pixelado, rotina de sprites, `drawRange` ou descarte de geometria compartilhada.

## Novidades

- **SHADOW DISTANCE (0–100)**, na aba **GRÁFICOS**, com alcance independente do OBJECT DISTANCE; valor padrão **50**, correspondente a **125 m no desktop** ou **60 m no celular**, medidos até a borda mais próxima do chunk. Controla projeção de sombras da geometria estática agrupada em chunks: paredes, telhados, vegetação e postes. Não reduz draw distance nem objetos visíveis. Projeção de veículos, personagens e outros objetos dinâmicos fora dos lotes não foi alterada.
- **Sombras Detalhadas**, caixa de seleção **OFF por padrão**. Quando OFF, elimina projeção de sombras nos grupos batelados `detMesh` (detalhes), `binMesh` (lixeiras/caixas), `lodNearMesh` e `lodMidMesh` (ornamentos de fachada). Os objetos permanecem visíveis, sujeitos apenas ao OBJECT DISTANCE como antes. Quando ON, esses grupos podem projetar sombras enquanto estiverem visíveis e dentro de SHADOW DISTANCE.
- Configurações salvas no `ps_cfg`, incluídas no `.psave`, restauradas com **RESTAURAR PADRÕES**. No benchmark, LOW = sombra detalhada OFF + alcance mínimo, MEDIUM = padrão e HIGH = ON + alcance máximo.
- **v259** aceita saves `.psave` das versões **258 e 259** (a única mudança de estado salvo é a adição dessas preferências gráficas). Saves mais antigos continuam sujeitos às regras existentes.
- BR/EN: controles e descrições traduzidos.

**Importante:** diminuir SHADOW DISTANCE desativa a projeção de sombras dos grandes lotes a partir desse alcance, sem esconder os objetos. A sombra do sol em si continua podendo ser limitada pelo frustum da câmera e pelo DRAW DISTANCE; o novo controle não promete custo constante nem FPS específicos.

## Verificações

A validação automatizada verifica sintaxe JavaScript, presença e conexão dos controles, persistência e presets, e ausência de mudanças nos blocos protegidos de sprites. O comportamento visual e o FPS nas praias precisam ser testados no navegador real com WebGL.

---

# PixelCity v258 — Checkpoint PROTEGIDO dos sprites

**NÃO ALTERAR AQUI**: os blocos de limpeza de geometrias (`disposeGroup` e descartes relacionados), o `SpriteMaterial` nativo/atlas/iluminação dos personagens e a proteção do `drawRange` no warmup receberam comentários de alerta no `index.html`.

O usuário confirmou que **Modern, Synthwave, Mundo Invertido, Point Haze, efeitos e viagens entre mundos** estão funcionando na v258. Este é o checkpoint de referência para mudanças futuras. **Nenhuma instrução executável foi alterada.** O `GAME_VER=258` permanece inalterado, assim como os saves e demais sistemas.

---

# PixelCity v258 — protecao da geometria compartilhada dos sprites nas viagens

> Base direta: v257. Correção restrita ao descarte de recursos 3D e ao número da versão. Sem alterações no shader, cores, atlas dos personagens, mundo procedural, arquivos de idioma ou mecanica de viagem.

## Defeito observado
- Modern inicial: sprites visíveis.
- Ida para Synthwave: sprites visíveis.
- Volta para Modern: sprites invisíveis.

## Causa de código encontrada
- Em Three.js r128, a geometria padrão de `THREE.Sprite` é interna e compartilhada por todos os sprites.
- `disposeGroup(city.group)` apagava indiscriminadamente a geometria dos sprites incluídos na cidade (por exemplo, o brilho do farol); `dropCarMesh` também apagava a geometria de sprites anexados a veículos.
- Nas viagens, as duas rotinas são chamadas várias vezes para remover cidade e carro antigos. Isso coloca o recurso compartilhado dos personagens em risco.
- `warmCityGPU` da v257 já preservava `drawRange`, mas não bloqueava o descarte dessa geometria por outras funções.

## Alteração
- A proteção `!o.isSprite` foi aplicada à limpeza de grupos, carros, objetos equipados, pickups, efeitos e instâncias.
- Materiais/objetos não Sprite continuam a ser liberados; materiais `SpriteMaterial` podem ser liberados quando seu objeto é destruído.
- `disposeGroup` evita duas chamadas de descarte para a mesma geometria/material dentro do mesmo grupo.
- Os sprites do jogador e NPCs preservam sua geometria ao atravessar mundos.
- Conservados diagnóstico `pixelCitySpriteStatus()`, camada 1 e proteção de `drawRange` da v257.

## Testes
- Verificação de sintaxe do JavaScript e integridade do ZIP.
- Testes de descarte com grupo contendo Mesh e Sprite que compartilha geometria com personagem persistente: o Sprite não sofre descarte, os meshes liberam a geometria.
- Teste repetido de ida/volta simulado na limpeza de cidade e de carro.
- A visualização do jogo completo em WebGL ainda depende de teste no navegador, particularmente Modern → Synthwave → Modern e mundos alternativos.
- `GAME_VER=258`, com política de compatibilidade estrita com saves anteriores mantida.

---

# PixelCity v257 — proteção de renderização dos sprites nas trocas de mundo

> Base v256. Correção focalizada; arco rebaixado, gatos, jammer, estacionamentos, traduções e os demais sistemas não foram alterados.

- Restabelecida a **rotina de iluminação de sprites da v253** sem o reset de cores por `worldNo` introduzido na v255.
- A preparação de geometrias (`warmCityGPU`) **não zera mais o drawRange de geometrias THREE.Sprite**, que são compartilhadas. Essa é uma causa plausível de invisibilidade completa após recompilar/preparar a cidade, distinta de iluminação escura.
- Após warmup e na primeira renderização de uma nova cidade, verificação pontual de `drawRange` e da camada 1 do renderizador, sem forçar `material.needsUpdate`, sem reupload de textura nem mexer em transparência.
- Disponibilizado `pixelCitySpriteStatus()` no console do navegador para diagnóstico de renderização. `drawnLastSecond` conta callbacks `onBeforeRender`, não prova pixels visíveis no resultado final.
- `GAME_VER=257`. Os saves anteriores continuam sujeitos à regra rígida de versão.

**Limitações:** validação estática e sintaxe não equivalem a uma viagem 3D testada. O navegador neste ambiente bloqueia a abertura do jogo. Necessário conferir Modern, Synthwave, Upside Down, Point Haze e retornos, com e sem sombras.

---
# PixelCity v256 — ajuste vertical dos arcos fluviais

- Mantido o tamanho/espessura atual do arco fluvial.
- O objeto inteiro foi apenas deslocado para baixo no eixo Y.
- A base da curva agora usa `RY + 0.52`, fazendo a ponta inferior do tubo encostar na linha d'água.
- A interseção com a mureta/lateral do canal é intencional, conforme pedido.

---

# PixelCity v255 — Restore do SpriteMaterial da v253 (correção da regressão v254)

> **Base:** v254, preservando as alterações de gatos, jammer, arcos dos rios, estacionamentos e tradução BR/EN. Apenas o gerenciamento de iluminação dos sprites foi alterado. A versão v253, que funcionava no Modern e no Synthwave, foi usada como referência para o sistema de sprites.

## Causa encontrada
- A v254 introduziu `actorSpriteWorldRefresh()`, executado inclusive no carregamento de uma cidade Modern normal. A função forçava `material.needsUpdate` e `material.map.needsUpdate` para todos os sprites, provocando uma recompilação/reenvio global desnecessários. Essa operação **não existia na v253** e introduziu a regressão relatada.
- Além disso, tocava diretamente no estado de draw range dos sprites e alterava o estado das cores fora do fluxo normal do `onBeforeRender`.

## Correção da v255
- Restaurada **literalmente** a função `makeActorLitSprite()` da v253, com `THREE.SpriteMaterial` nativo, sem shader customizado ou atualização compulsória da GPU.
- Removida a rotina global `actorSpriteWorldRefresh()` e todas as suas chamadas no warmup e nas transições entre mundos.
- Introduzido um reset **apenas dos dados temporais de iluminação** (`local.last`, `local.next`, `local.shade`, `local.shadeS` e cor armazenada) quando `city.worldNo` muda. Os sprites recriados ou persistentes acompanham o novo mundo sem recompilar material, alterar atlas ou geometria.
- Mantidas as mudanças da v254 em itens, animais, estacionamento, arcos e idioma; os saves anteriores permanecem sujeitos à política de `GAME_VER` estrita.

## Validações e limites
- Compilação de sintaxe do JavaScript com `node --check`.
- Comparação textual exata do factory nativo de sprites com a v253 e verificação de ausência de `actorSpriteWorldRefresh`.
- Teste isolado de iluminação em que o `worldNo` muda e o sprite mantém o mesmo `material`, `map` e `drawRange`, com cache temporal reinicializado.
- Arquivos PWA, ícones e catálogo de idiomas preservados do ZIP da v254.
- **Ainda não foi reproduzida uma partida WebGL completa** para certificar Modern → Invertido → Modern, Modern → Point Haze → Modern ou Synthwave. Isso precisa ser conferido in-game.

---
# PixelCity v254 — Sprites, jammer, arcos, estacionamento e gatos dos becos

> Continuação direta da **v253**; mantém os sistemas BR/EN e os arquivos PWA. `GAME_VER=254` e o bloqueio de saves de outras versões permanece vigente.

## Correções
- **Gatos dos becos:** o problema era a baixa probabilidade combinada com o limite global de animais (4 mobile / 8 PC), consumido também por cães. O spawner agora prioriza gatos quando há passagens válidas próximas, tenta diferentes posições dentro de vielas reais, verifica colisões, evita aglomerações e reserva espaço para gatos (até 1 mobile / 2 PC), mantendo o orçamento de animais total. Gatos não são gerados todos ao mesmo tempo nem em cada beco.
- **Jammer:** não vem mais automaticamente com o jogador no modo Livre, nem é criado por padrão ao carregar um save que não o possui. Pode aparecer na distribuição de armas dos becos e há uma tentativa adicional de colocar um exemplar no conjunto de passagens válidas. O limite de cargas é **3 sem mochila** / **50 com mochila**. Seu uso bem-sucedido consome uma carga (salvo cheat de munição); tentativas indisponíveis não consomem. Existe o cheat `JAMMER`. Armas coletadas **não têm respawn**, preservando o plano da futura loja AMOnições.
- **Iluminação de sprites ao atravessar mundos:** o cache de iluminação dos sprites e as atualizações locais são reinicializados após reconstruir um mundo ou restaurar o estado de jogo, em particular nas transições com o Mundo Invertido e Point Haze. Mantém `SpriteMaterial` nativo, sem introduzir shader customizado. Esta é uma correção de código; verificar a renderização real no navegador.
- **Arcos tubulares nos rios:** só são candidatos trechos estreitos com um único lote molhado na seção transversal do rio; trechos duplos/largos são rejeitados. A curvatura foi rebaixada para cerca de um terço da altura anterior. Não adiciona colisores sobre a navegação.
- **Estacionamentos:** removidas duas superfícies decorativas desenhadas sobre áreas de vagas, mantendo o asfalto lógico no nível zero, a geometria das calçadas e as posições dos veículos existentes.

## Validação e limites
- Verificação de sintaxe JavaScript com `node --check` concluída.
- Testes isolados do próprio código em Node: reset e limite de cargas do jammer; seleção de loot; ativação noturna e consumo; reinicialização do estado de iluminação dos sprites; gatos nos becos com limite mobile; regras de seleção dos arcos.
- Todos os arquivos originais da v253 permanecem no pacote, incluindo os ícones do PWA e catálogo inglês.
- **Não foi executada uma partida 3D completa.** A correção do sprite após Mundo Invertido/Point Haze, a aparência dos arcos, os carros estacionados e a presença visual de gatos em diferentes seeds ainda devem ser verificados in-game. Não afirmar FPS ou equivalência visual sem teste.

---
# PixelCity v253 — Praia com paraquedas, becos ocupados, OBJECT DISTANCE e arcos no rio

> **Base direta: v252** (inclusive catálogo EN e arquivos PWA). Não foram removidas as câmeras isométrica ou top-down. `GAME_VER=253`; saves de outra versão continuam sujeitos ao bloqueio de compatibilidade vigente.

## Praia e paraquedas — reserva obrigatória
- O gerador reserva por seed um quarteirão seco na frente da faixa válida de praia **antes** de distribuir aeroporto, marcos e indústria. Não sacrifica o banco ou a micro-ilha; procura uma alternativa se o corredor de pouso limitar a quadra escolhida. Continua respeitando o teto aeroportuário existente.
- A quadra costeira reservada recebe `kind='bld'`, `tour=true` e `para=true`; os edifícios podem usar a composição compacta em L sem perder o teto elegível ao salto.
- `paraInit()` verifica se existe ponto de saída em uma cobertura da quadra obrigatória e alvo validado na areia. Se não conseguir, a geração aponta erro, em vez de apresentar uma cidade silenciosamente sem salto. **Não foi possível verificar a garantia em todas as seeds em execução 3D**.
- Os NPCs paraquedistas usam o visual de NPC normal e são agendados em períodos de 50 a 128 minutos do jogo, com verificação de limite de 175 minutos; não dependem mais de o jogador estar próximo da praia ou de chuva. Máximo de dois paraquedistas simultâneos, preservando a rotina de remoção ao pousar. **1 minuto de jogo ≈ 1 segundo real**.

## Quadras de prédios e vida nos becos
- A malha compacta 4×4 agora tem recuo de **1,90 m** para cada lado; o vão livre entre prédios vizinhos chega a 3,80 m em vez de 2,30 m. Na malha menor 3×3, o recuo é 1,65 m.
- O validador de passagens agora testa as *footprints reais* dos prédios com margem compatível com os novos vãos, sem rejeitar automaticamente as vielas próximas às paredes. As pontes de união dos prédios em L foram alargadas na mesma proporção, mantendo todos os volumes conectados e o controle de altura do aeroporto.
- Becos internos válidos agora recebem pelo menos uma lixeira/caçamba e distribuição variável de sacos, caixas e pequenos detritos, usando meshes combinadas. Candidatos a coletáveis/armas e pontos de spawn de gatos continuam filtrados por espaço livre, afastamento e limites de população existentes. Uma semente pode produzir diferentes quantidades de itens; não é garantido um coletável em *cada* beco.

## Gráficos e rio
- `OBJECT DISTANCE` altera diretamente os três limites do `chunkLod()`: **0 = 0,70×**, **50 = 2,00×** e **100 = 4,00×** os alcances-base. No desktop, o desaparecimento pontilhado de detalhe usa limites-base de 50/70/100 m; no máximo, chegam a 200/280/400 m, sujeitos à névoa e ao `DRAW DISTANCE` global.
- A transparência por oclusão da câmera isométrica/top-down é um shader independente: permanece ativa apenas quando apropriado para revelar o jogador. Não é controlada por `OBJECT DISTANCE`.
- Novo arco **tubular oval** de metal claro entre margens do rio, com malha `TubeGeometry` e gerador determinístico por seed. Tenta distribuir **1 ou 2** arcos conforme a contagem das pontes levadiças, afastando-os das travessias já existentes; não gera colisores no canal, permitindo passagem de barcos. Em casos sem seção de rio elegível pode não nascer arco: não há promessa incondicional de um em toda seed.

## Verificações realizadas
- JavaScript extraído do HTML passou por `node --check`.
- Testes isolados dos limiares de LOD, de 48 perfis sintéticos de rio e da temporização de 720 minutos de jogo passaram. Os resultados são testes estruturais, **não uma partida executada**.
- Simulação de 200 sementes-modelo em quarteirões típicos de 52 m: todos apresentaram pelo menos uma passagem válida na malha 4×4 e conectores dos L sobrepostos corretamente aos dois braços; essa simulação não substitui a renderização do jogo.
- **Pendente:** avaliar in-game o visual dos novos arcos, praia de seeds extremas, spawns, áudio, LOD durante movimento, RAM/VRAM e FPS. Como a execução integral do navegador local não está disponível aqui, não afirmamos que o jogo foi testado em partida.

---
# PixelCity v252 — Tradução EN, etapa 3 (placas e relatórios)

> Continuação das etapas v250 e v251, mantendo as alterações da v249 no gameplay. `GAME_VER=252`.

## Tradução adicional
- Os textos de painéis gerados em canvas para lojas, serviços, cassino, presídio e displays são convertidos para inglês quando a textura é criada. Nomes próprios continuam intactos.
- As placas geradas por `mallSignMat` agora separam o cache de texturas por idioma. Algumas placas 3D já geradas não são recriadas automaticamente ao trocar a língua no meio da partida; para ver todas na língua nova, gere novamente a cidade.
- Exportação `.txt` do Benchmark: relatório escrito diretamente em inglês no modo EN, incluindo indicadores, método e limitações, evitando fragmentos portugueses interpolados. O modo BR usa o relatório anterior.
- Mantidas as correções v251 de notificações reversíveis e registros de diálogo com texto original.

## Validação
- JavaScript e ZIP íntegros. A interface, a reversão BR ↔ EN e o relatório do Benchmark devem ser testados em casos isolados; o jogo 3D completo não foi executado.
- Não declarar cobertura literal de 100% sem percorrer cada ramificação da História e cada interação no navegador real.

---
# PixelCity v251 — Tradução EN, etapa 2 (histórico e idioma ao vivo)

> Continuação intermediária da v250 baseada na v249, preservando gameplay e menus. `GAME_VER=251`.

## Melhorias desta etapa
- **Notificações e toasts** não são mais pré-traduzidos antes de entrar no DOM. Assim, alternar EN → BR durante uma notificação recupera o texto português original em vez de deixar conteúdo em inglês.
- **Registros de fala de NPC e da história** guardam o texto-fonte em PT-BR, preservando o histórico ao alternar idiomas, enquanto os balões exibem EN quando necessário.
- **Registros abertos** são redesenhados ao alternar BR/EN, sem alterar o conteúdo persistido no save.
- **Acessibilidade**: tradução ampliada para `aria-description` e `aria-valuetext`, além de títulos, placeholders e demais campos já cobertos.
- Não foi alterada a prioridade de rádio, a geração da cidade, as câmeras ou os critérios de save.

## Validação
- Sintaxe e ZIP verificadas. Os testes isolados de troca de idioma, notificações dinâmicas e histórico são informados separadamente no resultado da auditoria.
- Não foi possível validar uma partida 3D completa no ambiente; nunca tratar estes testes como prova de FPS ou gameplay de todas as missões.

---
# PixelCity v250 — Tradução EN ampliada de interface e textos de gameplay

> Base direta **v249**, sem alterar propositalmente a geometria da cidade, câmeras, missões, desempenho, save de helicópteros, áudio ou regras de geração. `GAME_VER=250`.

## Cobertura
- **1,345 equivalências PT-BR → inglês** incluídas em um catálogo de frases originais, exportado também em `locale_en_catalog.json` para conferência e futuras manutenções.
- A revisão cobre **tela inicial, Configurações (todas as abas), Controles/Comandos, ajuda longa e FAQ, mapa, legendas, HUD, Benchmark, arquivos de relatório, ações de garagem, lojas, serviços, celular, SMS, tutoriais da História, falas de NPCs, diálogos, avisos, créditos e mensagens de gameplay** quando seus textos passam pelos pontos de renderização instrumentados.
- O seletor BR / EN existente continua na primeira aba. A primeira escolha é derivada do idioma do navegador e pode ser modificada/salva. Os termos técnicos **seed**, **chunk**, **draw distance** e **object distance** continuam com seus nomes técnicos quando adequado; nomes próprios de estabelecimentos, estações, personagens e marcas fictícias podem permanecer iguais.

## Mudança no mecanismo de tradução
- Removido o tradutor que substituía pedaços dentro de palavras. Agora usa **frase inteira primeiro** e, nos textos compostos, substituição única com limites Unicode de palavras, evitando trocas sucessivas do inglês recém-gerado.
- O DOM é traduzido de forma abrangente (texto, `title`, `aria-label`, `placeholder`, `alt`) e acompanhado por observador de alterações para mensagens e janelas criadas em tempo de jogo. Textos de `script`, `style`, canvas de textura, dados internos da simulação e valores técnicos de inputs não são alterados automaticamente.
- Pop-ups com HTML são traduzidos preservando marcação. A fala de NPC, o diálogo com efeito de digitação e parte dos textos desenhados em canvas do telefone e mapa também passam pelo tradutor.
- Trocar **EN → BR** restaura textos originais do DOM. O relatório `.txt` do Benchmark respeita o idioma na hora da exportação.

## Validações desta versão
- `node --check` do JavaScript extraído: **aprovado**.
- Chromium isolado: **AUDIO/GRAPHICS/CONTROLS/GENERAL**, ajuda longa/FAQ, avisos inseridos dinamicamente, títulos de botões, alertas com markup e restauração dos textos originais em BR: **aprovados**.
- Varredura textual dos literais JS identificou português remanescente principalmente em **logs de desenvolvimento** e nomes próprios (como NEOGÁS). A amostra estática do HTML não apresentou conteúdo português residual no modo EN com o filtro aplicado.
- **Não houve execução end-to-end da partida 3D**, streaming de rádio, todas as ramificações de missões nem revisão humana de cada evento raro; nenhum teste automatizado de textos pode comprovar literalmente 100% da interface em todos os caminhos possíveis. Para qualquer mensagem rara ainda vista em português, anotar a frase e contexto para adicioná-la ao catálogo.
- Mantenha uma cópia da v249: pelo critério pré-existente de `gv` no PSAVE, saves de versões diferentes não abrem automaticamente na v250.

---
# PixelCity v249 — Auditoria da v248

> Base direta: **v248**. Não houve remoção de modos de câmera.

## Correções pontuais identificadas
- **NPC elevado:** headshot agora usa a altura real `gy + jy`. Na v248, a diferença era medida em relação ao solo e tiros no corpo de NPCs na sacada contavam como headshots.
- **Casa segura:** piscina fixa habilitada para lotes com profundidade de 19 m ou mais, anteriormente exigia mais de 21 m. Churrasqueira recuada lateralmente para manter separação do heliponto em lotes menores.
- **PWA:** pacote inclui três ícones citados pelo HTML e manifest (`180`, `192` e `512 px`), ampliados do ícone original embutido no jogo. Antes os ícones não estavam dentro do ZIP.

## Limites da validação
- JavaScript e ZIP verificados. Interface BR/EN, posição dos controles, MUTE, alcance do LOD, tiro em NPC elevado e gerador de quintal avaliados em testes isolados.
- O navegador deste ambiente bloqueia abrir `file://` e `localhost` (`ERR_BLOCKED_BY_ADMINISTRATOR`). **A execução 3D completa não foi validada.** FPS, geração completa de cidade, rádio real e save/load do helicóptero precisam de teste no jogo.
- EN permanece incompleto para falas e mensagens específicas da História; ainda não é tradução 100%.

## Saves
- `GAME_VER=249`. O próprio PixelCity recusa saves de outras versões, inclusive v248. Guarde as versões anteriores.

---

# PixelCity v248 — Revisão dos pedidos da v247 e correções funcionais

> **Base de código: v246 original**, não a v247 com correções incompletas. `GAME_VER=248`. O histórico das versões anteriores permanece abaixo.

## Alterações efetivas verificadas no código

- **Áudio:** o painel Áudio coloca a seleção **Músicas e Rádios / Fonte / Adicionar MP3** antes de **Volume / sliders / botões de teste**. Ordem de reprodução da v246 permanece rádio KRFM online → pasta `radios/` do servidor → músicas carregadas do navegador, inclusive na introdução da História e nos créditos.
- **MUTE (tecla N):** checkbox marcado = `S.sound=false`; desmarcado = som ligado. A tecla N também atualiza o checkbox na lógica inversa. Configuração persistida usando o campo `sound` já existente.
- **OBJECT DISTANCE:** novo campo `S.objectDistance` (0–100, padrão 50), gravado em `ps_cfg` e `.psave`, aplicado **dentro de `chunkLod`**, nas faixas `near/mid/far` e suas transições dither. No padrão 50, limites da v241 permanecem em desktop 50/70/100 m (mobile 16/40/80 m). Em 0 o fator é 0,48×; em 100 é 2,44×. A visualização final é limitada por DRAW DISTANCE, câmera, névoa e frustum: aumentar Object Distance não cria chunks além do alcance visível.
- **NPCs nas sacadas:** chance por posição cai de 30% para **21%** (30% de redução relativa). Os NPCs continuam no array `peds`, têm HP e são atingíveis pelo `rayHit` usando a altura real `gy + jy`, inclusive antes do colisor da fachada, com registro de morte pelo `killPed`. Não fogem da sacada quando feridos.
- **NPC paraquedista:** removidos cubo de corpo, mochila cúbica e cabeça esférica; usa sprite de pedestre comum com paleta aleatória, junto à lona e cabos originais.
- **Casa segura:** casa reduzida para aprox. **9–10,4 m de fachada e 7,8–9,1 m de profundidade**, dentro do lote privado 2×2 já reservado. Vagas duplas continuam ao lado, com acesso pelo mesmo `garBuild`. Quintal passa a ter **piscina, churrasqueira, 1–2 árvores e heliponto em H atrás da garagem**. Há validação geométrica para reservar a plataforma dentro do lote.
- **Helicóptero salvo:** ao pousar e desembarcar no heliponto, o helicóptero passa a pertencer à base, sem retornar automaticamente ao heliponto de origem. `safeHeli` é gravado no `.psave` e a aeronave estacionada é recriada ao carregar. A restauração não recria aeronaves que não estavam estacionadas. A destruição impede o respawn automático da aeronave da base.
- **LANG:** primeira aba das Configurações, com botões de bandeiras minimalistas BR/EN. Primeira inicialização usa `navigator.language` (português → BR; demais → EN); escolha manual é salva. Troca imediata de textos de menu, configuração, modos, mensagens frequentes e notificações. **Limitação atual:** o jogo contém numerosas falas e textos circunstanciais escritos diretamente no motor; não foi feita auditoria manual de tradução completa de todas as linhas de história e NPCs. Portanto, o EN não deve ser considerado localização 100% concluída.
- **BENCHMARK:** no cabeçalho abaixo de Fechar, visível independentemente da aba somente **no menu inicial**, agora com texto e borda rosa e sem preenchimento rosa. Os presets LOW/MEDIUM/HIGH também mudam OBJECT DISTANCE (0/50/100), além de DRAW DISTANCE.
- **Prédios em L:** o gerador de prédios comuns também atende quadras marcadas `tour` (praia), exceto as marcadas para paraquedas ou restrições especiais preservadas. Quadras com 48 m ou mais em ambos os eixos usam malha 4×4 (em vez de 3×3), maior ocupação e recuo menor, até 2 Ls conectados por bloco; há menor probabilidade de miolo vazio. As regras existentes de altura conjunta e corredor aéreo são mantidas.
- **Becos e coletáveis:** candidatos de passagens internas aumentados até 6 por bloco; armas e coletes deixam de ser forçados apenas para as duas extremidades e respeitam distância de 16 m de outros pickups, além de lixeiras; lixos soltos recebem margem de separação maior. Gatos ativos recebem uma distância mínima de 20 m entre si, mantendo o limite global já existente. O gerador de discos conserva a separação mínima de 28 m.

## Verificações realizadas

- Sintaxe do JS embutido: **`node --check` passou**.
- DOM da aba Áudio verificado: `radioSrc` precede `vol_master` e o checkbox diz `MUTE (tecla N)`.
- Mudança BR ↔ EN dos rótulos principais foi exercitada isoladamente no Chromium, com retorno ao BR.
- Testes isolados da função real `rayHit` aprovados: tiro na altura da sacada atinge NPC elevado e tiro abaixo não atinge.
- Função geométrica real `safeYardBuild` aprovada para as 4 orientações em 16 combinações de tamanho, garantindo heliponto dentro dos limites.
- Fatores `objectDistanceFactor` confirmados: **0,48 / 1,00 / 2,44** para os níveis 0 / 50 / 100.
- **O navegador completo foi bloqueado pelo ambiente** (`ERR_BLOCKED_BY_ADMINISTRATOR` no endereço local). A renderização real de cidade, heliponto, NPCs, Ls, FPS e tiro dentro do jogo precisam de teste no dispositivo; não foram validados end-to-end.
- Mudança de geração de cidade exige criar cidade nova. A política já existente continua recusando saves de versões diferentes (`gv`), portanto mantenha os ZIPs/saves antigos.

---
# PixelCity v246 — Rádio online primeiro, com fallback servidor → navegador

> Base direta **v245**. Alteração focalizada nas prioridades das fontes musicais, sem tocar no gerador de cidade, prédios em L, bairros residenciais, aeroporto, Benchmark, Draw Distance e LOD.

## Ordem automática de áudio
- **1. Rádio online KRFM** passa a ser o modo inicial selecionado na aba Áudio, em vez de `all`.
- **2. Pasta `radios/` do servidor**: se o stream falhar (erro de rede, arquivo inválido, ou 12 s sem início / após travar), o jogo espera a pesquisa de `radios/` e `radios/lista.txt` terminar e tenta as faixas no servidor. Se uma falhar, tenta outra.
- **3. Arquivos do navegador** adicionados no seletor de MP3: usados depois que as faixas disponíveis do servidor falharem ou não existirem. Sem upload, não é possível descobrir automaticamente músicas pessoais do disco (restrição de segurança do navegador).
- A seleção manual de fonte (`Músicas do servidor + minhas` e `Só minhas músicas`) e as preferências explicitamente salvas pelo jogador continuam respeitadas. Para usar novamente a KRFM após queda, basta selecionar de novo o modo online.
- A preferência ao vivo é aplicada ao mundo Modern. As trilhas próprias de Synthwave, Mundo Invertido e Point Haze continuam intactas.

## Cenas História e créditos
- Chegada/abertura do modo História e créditos finais agora **tentam a KRFM online antes** de recorrer ao áudio da pasta do servidor e aos MP3 do navegador. A estação `FLASHBACK FM` continua preferencial **entre as opções do servidor**; demais estações são avaliadas depois.
- A sequência espera a consulta da pasta terminar antes de considerar que não existem arquivos. Tenta outras faixas/estações se a opção local falhar. Um stream que não inicia ou fica preso por 12 s também provoca fallback.
- A danceteria conserva a preferência original pela música local/Flashback FM, por ser música ambiente daquele estabelecimento.
- O botão **TESTAR RÁDIO** da aba Áudio agora também utiliza essa mesma ordem no modo padrão.

## Validação
- `GAME_VER=246`. Saves anteriores continuam sujeitos à checagem estrita preexistente; guarde uma cópia do ZIP v245.
- Sintaxe JavaScript e integridade ZIP verificadas. Fluxo de fallback também possui testes isolados por simulação; a disponibilidade real do stream e a reprodução nos navegadores do usuário precisam de teste prático.

---
# PixelCity v245 — Todos os quarteirões residenciais no mesmo padrão compacto

> Base direta: **v244**. Correção focalizada no gerador residencial; todos os sistemas de prédios em L comerciais, aeroporto, Benchmark, Draw Distance, câmera, LOD e PWA da v244 são preservados.

## Diagnóstico da seed 2157180350
- Na v244, a flag `denseHouse` excluía os quarteirões de `houses` marcados `safe`, `reservedSpecial` (corredor do aeroporto) ou com dimensões abaixo do limiar. Essas áreas voltavam ao `split(...)` antigo, exibindo casas grandes com gramado contínuo e sem os caminhos internos da v232/v235.
- Na v245, a regra passa a **`f.denseHouse = (f.kind === 'houses')`** e **todas** as quadras residenciais usam a mesma malha adaptativa (4×4 nos quarteirões normais; mais células em blocos fundidos).

## Reserva da casa segura
- A casa segura/garagem fica em UMA parcela privada formada pela união real de 2×2 micro-lotes no canto de sua quadra. O restante gera casas pequenas, passagens, cercas e itens como os demais bairros, em vez de uma quadra inteira no desenho antigo.
- A escolha do canto favorece a existência de rua pública para porta e garagem, sem alterar as vias; portas em esquinas testam as faces reais até achar um acesso válido.
- As quatro células reservadas não recebem calçada interna nem parcela L residencial sobreposta. Mantém a casa segura, garagem, spawn/respawn e salva a posição da porta usando o fluxo existente.

## Itens e detalhes
- O desenho uniforme preserva os caminhos públicos de 1,9 m, os terrenos privados em L, cercas de madeira/brancas (garantida pelo menos uma por quadra residencial com casas; sorteio preservado nos demais lotes), casas, quintais, árvores, lixeiras e lixo, pontos de gatos, pedestres e coletáveis. Não introduz novos objetos com atualização por frame nem altera o limite de gatos.
- O bairro baixo do corredor de aproximação do aeroporto também usa esta malha; as alturas das casas continuam limitadas pela função existente de zoneamento aéreo.
- Praças, terrenos rurais, parques, hospitais, aeroporto, demais áreas especiais e o castelo de Point Haze **não** são convertidos em residências.
- A cidade continua determinística por seed, mas a geometria e os pontos de coleta dos bairros anteriormente excluídos mudam em relação à v244.

## Compatibilidade e validação
- `GAME_VER=245`. Saves v244/v242 continuam barrados pela checagem de versão preexistente.
- JavaScript validado com `node --check`, integridade ZIP verificada e **1.440 combinações de geração residencial testadas** (360 comuns, 360 com casa segura, 360 de aproximação e 360 de micro-ilha; 1.200 com lotes fundidos). Sem sobreposição de parcelas em L e sem corredores sobre a parcela reservada para a casa segura.
- **Sem garantia de FPS visual:** medir in-game e conferir visualmente a seed `2157180350` nos pontos dos prints, após gerar uma cidade nova.

---
# PixelCity v244 — Prédios em L conectados, corredor aéreo e Benchmark no cabeçalho

> **Base direta: v243**. Alterações pontuais sem substituir o gerador, as seeds, os outros edifícios ou o sistema de LOD. O ZIP v243 permanece como referência anterior.

## Prédios em L
- Corrigida a filtragem que descartava a emenda estreita: a função de `emit` recusava qualquer peça abaixo de 7 m, inclusive o conector planejado com ~4,3 m de profundidade. Agora aceita conexões L com pelo menos 4 m nos dois eixos, sem afrouxar os mínimos dos demais edifícios.
- Os braços de grupos L não passam mais pelo `proceduralFootprint` dos prédios comuns, que encolhia independentemente um braço em terrenos fundidos, rompendo a conexão com a emenda. Os limites planejados dos lotes continuam sendo respeitados.
- Os três volumes recebem o mesmo teto de fachada, a mesma paleta e corpos sem pavimento superior aleatório. A altura máxima usual da fachada continua 35,2 m.
- **Aeroporto:** a altura de TODOS os componentes do L é reduzida pelo MENOR teto permitido entre suas três footprints. A altura compartilhada reserva 3 m para a cobertura e evita antenas nesse setor. A proteção vale inclusive se apenas uma extremidade do L entrar no corredor; perto da cabeceira, admite um andar baixo.
- O mecanismo de becos internos e as posições de lixo, gatos, portal e coletáveis permanecem intactos e seguem checando footprints efetivas.

## Menu e desempenho
- O botão **BENCHMARK** foi movido de **Gráficos** para **logo abaixo de Fechar**, no cabeçalho de **Configurações** do menu inicial. Permanece visível ao trocar para Áudio, Interface, Controle ou Geral; é ocultado durante a partida.
- O preset **LOW** do benchmark usa `drawDistance=0` (alcance de canto ≈32 m); **MEDIUM** usa `50` (2 chunks); **HIGH** usa `100` (3 chunks). O slider 0–100 e `CS=2` permanecem como na v243; os chunks não são descarregados.
- `GAME_VER=244`. Por causa da política existente de igualdade estrita de `gv`, saves de outras versões não são importados automaticamente.

## Verificações realizadas
- `node --check` no JS extraído e teste de integridade do ZIP PWA completo.
- Regressões por simulação: os conectores não são descartados, e a altura compartilhada de Ls sob restrição aérea é igual para os três componentes e fica abaixo do menor teto aeroportuário após reserva de cobertura.
- A aparência final, o FPS e a continuidade visual ainda devem ser conferidos no navegador e no dispositivo do usuário.

---
# PixelCity v243 — Draw Distance e Benchmark exclusivo do menu inicial

> **Base direta: v242.** Preservados o gerador de prédios em L, becos internos, portal e LOD com dithering. A v242 não foi sobrescrita.

## Configurações → Gráficos
- **DRAW DISTANCE** (0–100, padrão **50**): em 0, neblina curta (~32 m, aparecimento perto da esquina); em 1, aproximadamente 1 chunk (~152 m); em 50, aproximadamente 2 chunks (~304 m); em 100, aproximadamente 3 chunks (~456 m). O limite climático ou do universo especial pode encurtar esse alcance. Os chunks físicos continuam `CS=2` (2×2 quarteirões) e pré-carregados.
- O ajuste limita o culling dos chunks e o alcance da câmera/névoa, com margem escondida de 12 m; não altera seed, ruas, colisores, localização de objetos ou descarrega meshes. O LOD dentro de cada chunk continua com os limiares da v241.
- A preferência é guardada nas Configurações, no objeto de save e restaurada por **Restaurar Padrões**; alteração é imediata durante o jogo.
- **BENCHMARK** está disponível em **Menu inicial → Configurações → Gráficos**. Quando uma partida começa, a linha do Benchmark desaparece completamente das Configurações da partida. O teste só inicia no menu inicial, evitando substituição do mundo e do save atual.
- `GAME_VER=243`; saves `.psave` da v242 continuam sujeitos à verificação rígida de versão já existente. Guarde os ZIPs originais.

## Validação
- Código JavaScript verificado com `node --check`, estrutura PWA reempacotada; teste visual e de FPS ainda depende do navegador/dispositivo real.
- Comparar FPS e aparecimento visual em `DRAW DISTANCE` 0, 1, 50 e 100, especialmente isométrica/top-down e chuva.

---
# PixelCity v242 — Prédios em L, miolos de quadra e becos internos

> **Base direta: v241**, incluindo o LOD por chunks 2×2 e a transição suave por dithering. V241 preservada como fallback imediato; v223 permanece o checkpoint histórico de segurança. O gerador da cidade não corta quarteirões e não modifica a malha de ruas.

## Gerador de quarteirões de prédios
- Novos quarteirões **comuns** de prédios (kind `bld`, suficientemente largos, sem imóveis de missão/safe house, sem zona turística e demais sinalizações especiais) usam composição em 3×3 microáreas por quarteirão, com **1 ou 2 edifícios em L**, outros prédios menores e chance de **pátio/miolo sem prédio**.
- Cada L combina dois braços e uma pequena emenda volumétrica central, com **altura e cores compartilhadas**, criando a aparência de uma única construção articulada. As partes mantêm colisor e footprint para navegação/itens/oclusão isométrica; a emenda não recebe antenas e janelas extras.
- As ruas, calçadas e lotes especiais permanecem com a lógica anterior. O plano dos L usa um RNG local derivado de seed e índice de quadra para garantir **determinismo estrutural**.
- Prédios voltados para a calçada continuam com fachadas de entrada; terrenos especiais de hospital, shopping, prefeitura, banco, aeroporto, lojas de missão, etc. não entram na transformação.

## Becos, portal e distribuição
- Os becos gerados na nova composição são calculados **após os colisores definitivos dos prédios**; só são usados corredores com largura livre e comprimento mínimo, preferindo vãos interiores a pelo menos ~8 m da borda do quarteirão.
- A lista dos gatos e dos coletáveis passa a incluir essas passagens; o número máximo de gatos simultâneos **não muda**. Os discos e pickups são filtrados pela rotina de colisão e espaçamento já existente.
- O lixo nos miolos passa a variar de zero a vários objetos/caçambas por passagem, de forma determinística, para impedir que todos os becos tenham a mesma concentração. Um máximo de quatro passagens por bloco limita custo de geometria.
- O portal Upside Down prioriza becos **internos com uma face de prédio comprovadamente válida**, evitando a borda da rua. Se não existir candidato interno válido, conserva os becos clássicos como fallback.
- Nenhum item, gato ou portal surge propositalmente dentro de prédios; a filtragem de posição pelos colisores foi mantida.

## Desempenho e compatibilidade
- Preservado **LOD/fade de v241** em todos os chunks, sem criar efeitos por quadro adicionais nem luzes dinâmicas.
- `GAME_VER=242`; saves de versões anteriores são incompatíveis por design.
- Testes: `node --check` aprovado e simulação isolada de **320 combinações** de seed/tamanho de quadra (440 grupos L), sem sobreposição entre prédios não relacionados. *O navegador de validação bloqueou a abertura local e não foi possível medir FPS ou jogar a cidade inteira; testar visualmente antes de substituir a v241 no servidor.*

## Como conferir
- Gere uma cidade **Normal**, seed `517551`, Modern, aproxime-se dos quarteirões comerciais e faça um sobrevoo em câmera superior.
- No F12: `console.log('Quadras com L:', city.urbanLBlocks.size, 'Edifícios L:', city.urbanLCount, 'Becos internos:', city.urbanAlleyCount, 'Candidatos portal:', city.alleySites.filter(a=>a.interior).length)`.
- Verifique se o portal aparece mais escondido no miolo e se os gatos/coletáveis e lixo não atravessam as paredes. Monitore `F3` para comparar o custo com a v241.

---
# PixelCity v240 — Chunks 2×2 + LOD 50/70/100 (desktop)

> **Base: v239**, com as funcionalidades de bairros residenciais compactos, lojas, animais, roupas, Jammer, estacionamentos e missões preservadas. A **v223 continua guardada como checkpoint histórico**. Esta versão altera agrupamento de geometria/LOD, não introduz novas atividades.

## Chunks menores (2×2 quarteirões)
- Alterado `CS=3` para **`CS=2`**. Cada chunk passa de 3×3 quarteirões (aprox. 228×228 m) para **2×2 quarteirões** (aprox. 152×152 m), mantendo `BS=60`, `RW=16`, `P=76`.
- As coordenadas de ruas, divisas de quarteirões, gerador principal, colisões, prédios e mapa não são cortadas ao meio: os chunks continuam alinhados com o grid de quarteirões.
- Tamanho Normal (`N=14`): **25 → 49 chunks**. Tamanho Mobile (`N=7`): **9 → 16 chunks**.
- A distância usada pelo LOD é do ponto mais próximo do *bounding box* de cada chunk à câmera. Chunks menores tornam a seleção mais localizada, mas podem aumentar o número de meshes e draw calls. **Não é garantido que o FPS melhore em todas as áreas.**
- O gerador usa a posição do chunk para alguns sorteios locais; por isso, **a mesma seed pode ter diferenças nos detalhes decorativos** e em certos pontos de spawn, mesmo mantendo a mesma estrutura principal.

## LOD geométrico e materiais
- **Desktop:** 0–50 m completo; 50–70 m médio (sem cercas finas/ornamentos); 70–100 m simplificado; mais de 100 m ultra simples/material distante.
- **Mobile:** mantidos os limites econômicos já usados pela v239, **0–16 / 16–40 / 40–80 / acima de 80 m**, para proteger o ganho observado pelo usuário no 7×7.
- Mantida a histerese para evitar alternância em cada frame ao cruzar um limite.
- Correção pequena da v239: a visibilidade das **janelas simplificadas** agora é atualizada quando muda **qualquer uma das duas faixas** que as afetam; antes podia atrasar a transição médio → distante.
- A troca não recria a geometria nem descarrega chunks durante a partida.

## Validação e limites
- Scripts inline extraídos e validados em `node --check`.
- Testes isolados das transições geométricas/material nos três limiares, desktop/mobile, e histerese; teste de cobertura de quarteirões/cruzamentos sem duplicação para N=7, 14 e 15.
- ZIP contém os mesmos cinco arquivos do PWA da versão anterior, com `GAME_VER=240` no HTML.
- **Ainda não foi executado um playthrough 3D completo nem feita medição real de FPS.** Especialmente no mobile 7×7, comparar v239 e v240 em seed, posição, clima e horário iguais antes de assumir ganho.
- Saves são exclusivos de versão: v239 não carrega automaticamente como save v240.

## Teste sugerido
- Mobile: tamanho **7×7**, seed `2812765640`, mesmo horário/clima e câmera usados na versão anterior; registrar FPS/CPU/draw calls no mesmo trecho. Como o trecho de 60 FPS não foi identificado precisamente, não inventamos coordenadas.
- Desktop: seed `2812765640`, Normal / Modern, em X≈936, Z≈145, mesma câmera e posição para comparação.

---

# PixelCity v237 — LOD mais agressivo (60 / 150 m)

> Base: **v236** (mantidos 100% dos bairros residenciais compactos da v235). A **v223** continua intocada como checkpoint estável; a v236 permanece disponível para comparação de FPS.

## Novo escalonamento do LOD geométrico

| Faixa | Desktop | Mobile | Resultado |
|---|---:|---:|---|
| Próxima | 0–60 m | 0–48 m | Casas e prédios completos, cercas e ornamentos |
| Intermediária | 60–150 m | 48–115 m | Oculta cercas detalhadas e ornamentos, preserva paredes/telhados e janelas |
| Distante | acima de 150 m | acima de 115 m | Substitui as janelas detalhadas por formas simples nas casas e usa material econômico |

- As distâncias continuam medidas **do ponto mais próximo do chunk até a câmera**, não do centro de cada casa.
- A troca mantém **histerese curta** (±5 m no primeiro limite e ±6 m no segundo) para impedir piscadas; na prática, a troca ocorre ligeiramente antes/depois do limite, dependendo da direção.
- A desativação de sombras do buffer misto e a ocultação de fios/lixeiras distantes foram alinhadas ao limite distante, economizando também desenhistas de objetos pequenos.
- A v236 tinha 88/158 m no desktop e 72/123 m no mobile; na v237 os limiares **não exigem reconstrução de geometria**, somente alternância de visibilidade de buffers previamente gerados.
- **Não foram alterados** seed, casas, colisões, pickups, animais, veículos, materiais base, PWA ou qualquer lógica de missão.

## Validação

- Teste de sintaxe (`node --check`) e testes isolados de entrada/saída em cada faixa com histerese.
- Arquivos PWA completos preservados no ZIP.
- **Medição real de FPS e aparência precisam ser confirmadas pelo usuário** (não houve partida completa neste ambiente).

### Cena de comparação

Seed `2812765640`, Normal / Modern, perto de `X=936.45`, `Z=144.79`, olhando na mesma direção do print v236; comparar CPU, GPU, triângulos, desenhos e transições visuais v236 vs v237.

---

# PixelCity v236 — LOD geométrico real para bairros e prédios

> **Base: v235, com 100% dos bairros residenciais compactos.** A v235 permanece guardada para comparação e a v223 continua como checkpoint histórico estável. Nenhum recurso da v233 descartada foi reintroduzido.

## O que mudou

- **LOD geométrico real, sem duplicar prédios:** elementos que antes ficavam junto de paredes, cercas e estruturas foram separados em buffers batelados por chunk durante a geração da cidade. Não existe reconstrução de geometria ou recarga de chunk enquanto o jogador dirige.
- **Faixa próxima:** todas as sacadas e detalhes de fachada, cercas com ripas, janelas, portas, beirais e acabamentos residenciais continuam sendo desenhados, com os mesmos materiais e posições anteriores.
- **Faixa intermediária:** a partir de cerca de **88 m no desktop (72 m no mobile)** do limite mais próximo do chunk, cercas detalhadas e ornamentos arquitetônicos (grades de sacadas, molduras, faixas, aparelhos de ar-condicionado) deixam de ser renderizados. Paredes, telhados, janelas e portas residenciais permanecem.
- **Faixa distante:** a partir de cerca de **158 m no desktop (123 m no mobile)**, janelas e portas com muitos detalhes são ocultadas. Para as casas, entram **janelas simples, de um quadrilátero por janela**, enquanto paredes e telhados continuam. Prédios altos já usam atlas de janelas e não precisam de cópias geométricas completas.
- **Sombras dos meshes estruturais/decorativos mistos** param em chunks distantes (mais de 154 m desktop / 108 m mobile) enquanto as paredes e telhados dedicados permanecem como sombras.
- **Histerese** na ida e volta das faixas evita piscar/recalcular o LOD em câmera oscilante. O LOD de materiais da v231 também foi mantido.
- Oclusão isométrica mantém os IDs de edifício nos novos buffers para não reaparecerem elementos ocultos sobre o jogador.
- **Colisões, geração por seed, casas compactas da v235, coletáveis, pedestres, estacionamento, Jammer e outros sistemas não foram alterados.**

## Custo esperado e limites

- Os detalhes continuam residentes na RAM para evitar engasgos de recarga e reaparecem quando a câmera volta. Não é um sistema de descarte.
- Foram acrescentados no máximo três meshes batelados adicionais por chunk, mas parte importante do conteúdo do mesh detalhado anterior foi transferida para eles. Em alguns ângulos próximos, as draw calls podem **subir**; em vistas distantes devem cair os triângulos e sombras.
- A distância de LOD usa o **limite do chunk**, não a distância individual a cada casa. Isto evita centenas de chamadas de desenho independentes, mas também limita a economia.
- Por ser uma otimização geométrica, não garante melhora de CPU/FPS. O usuário deve conferir a mesma seed, distância, câmera e clima.

## Testes executados

- `node --check` aprovado no JavaScript principal extraído.
- Teste isolado do **código real `chunkLod`**: perto/intermediário/longe, retorno, histerese, sombras, restauração de materiais e 240 quadros estáveis sem varreduras adicionais.
- Checagem do diff contra v235 e integridade de todos os 5 arquivos do PWA.
- **Ainda não houve partida 3D completa ou medição de FPS no navegador.**

### Teste visual sugerido

Seed `2812765640`, cidade Normal, estilo Modern. Compare v235 vs v236 com mesmo clima, câmera e sombras, por exemplo na área residencial próxima à micro-ilha do DeLorean (`X≈923`, `Z≈374`, olhando para os bairros e prédios distantes) e num segundo ponto onde v235 ficou pesado. Conferir Monitor F3: FPS, CPU ms, GPU ms, triângulos e desenhos. Verificar também os saltos visuais de LOD avançando e recuando pela rua.

---

# PixelCity v235 — Quadras residenciais compactas como padrão (100%)

> **Base: v234.** A v223 continua preservada como checkpoint estável; a v234 fica preservada como ponto de comparação visual e de desempenho.

## O que mudou

- A seleção de apenas **1/3 das quadras residenciais** foi retirada: o modelo compacto inspirado na quadra do DeLorean agora é **padrão para 100% dos quarteirões residenciais comuns capazes de comportar a malha**. Não há mais sorteio que deixe a maioria com o desenho antigo.
- Mantidos os **terrenos particulares em L com uma casa e braços ajardinados (árvores)**, casas pequenas e próximas, cercas com acessos livres, corredores públicos com pedestres ocasionais, gatos, lixo e coletáveis.
- O **portal Upside Down** permanece restrito aos becos dos prédios, nunca aos caminhos residenciais.
- Quarteirões residenciais **fundidos/retangulares** também usam malha compacta, com número de fileiras e colunas ajustado à área, evitando casas grandes e mantendo tamanho semelhante ao das casas da ilha.
- A **micro-ilha do DeLorean** continua com sua garagem especial voltada para a rua. Os quarteirões normais não recebem garagem ou veículo DeLorean.
- **Exceções técnicas intencionais:** a quadra da **safe house** conserva seu terreno especial para proteger a garagem e o respawn; terrenos extraordinariamente estreitos (menos de 43 m de lado) mantêm o gerador anterior porque não cabem três fileiras de casas com corredor.
- A distribuição é determinística para uma seed e tamanho de mapa; a regra **não consome o fluxo aleatório principal**.
- Removida uma varredura repetida em `city.denseLParcels` durante a geração de cada lote L, substituída por contador por quarteirão. Não foram adicionados sistemas por frame.
- Nenhuma mudança no LOD, materiais, física, estacionamento, áudio ou iluminação da v234.

## Validação

- Scripts JavaScript inline aprovados com `node --check`.
- Seleção residencial e submalha extraídas do código real e testadas em **210 combinações** de seed, tamanho do terreno e índice de quarteirão, incluindo lotes normais, retangulares e a reserva da garagem da micro-ilha. Sem sobreposições das parcelas em L.
- Integridade do ZIP de cinco arquivos PWA verificada.
- **Ainda não houve teste completo de renderização 3D nem medição de FPS.** Como o número total de quadras densas aumenta, conferir CPU, GPU, triângulos e FPS no Monitor F3 principalmente no modo Normal.
- **Saves:** permanece a checagem estrita da versão (`GAME_VER=235`); saves de outra versão não são carregados automaticamente.

---

# PixelCity v234 — Parcelas residenciais em L, fogueiras protegidas e estacionamento cadenciado

> **Base real: v232.** A v233 foi descartada como base por causar caminhos em L nos lotes vazios e reduzir demais a densidade de casas. A v223 permanece preservada como checkpoint histórico estável.

## Terrenos em L (quarteirões densos)
- Conserva o padrão **4×4 da v232** e a distribuição aproximada de 1/3 das quadras residenciais com lotes compactos.
- Em cada quarteirão denso, **1 ou 2 parcelas verdadeiramente em L** unem três micro-lotes adjacentes; nasce **uma casa no cotovelo** e os outros dois setores formam jardins com **1 ou 2 árvores cada**. O restante permanece com casas pequenas e próximas umas das outras.
- O trecho de calçada **interno à mesma parcela** deixa de ser rua de pedestres; os demais caminhos públicos, inclusive cruzamentos, continuam existentes.
- Cercas, quando presentes, ocupam somente as bordas externas da parcela L; não cortam o acesso entre seus três setores. A abertura da porta fica livre.
- A casa/garagem do DeLorean fica reservada em seu micro-lote original, com acesso externo à via/ponte.
- Restringe o crescimento a **12–14 casas por quadra densa** (nas que suportam os 16 lotes), contra 16 na v232. Não replica os grandes lotes vazios da v233.
- Mantém **gatos, lixo, armas, vida, coletes e itens** nos corredores residenciais, sem incluí-los como candidatos ao portal Upside Down (que continua exclusivo de becos de prédios).
- Reaproveita apenas os **pedestres de percurso** da v233: até 4 no desktop ou 2 no mobile, somente próximos ao jogador, seguindo os corredores públicos realmente desenhados.

## Fogueiras na foz do rio
- A escolha de posição das fogueiras da praia agora rejeita **o canal de ligação rio–mar e sua margem de segurança**, além de água, rio, obstáculos e a área protegida do farol. Caso não encontre lugar seguro, não cria fogueira naquele sorteio.

## Entrada e piso de estacionamentos
- Remove os boxes lisos e cinzentos que eram colocados **sobre o asfalto global**, inclusive o acesso recortado; as vagas e a entrada revelam agora a **mesma textura procedimental e o mesmo nível da rua**.
- Preserva o vão físico de 4,8 metros na calçada da v230 e as marcações de vaga.

## Ritmo de carros visitantes — relógio por estacionamento
- Cada estacionamento próximo ao jogador recebe um timer independente. A primeira chegada ocorre após **60–120 segundos de simulação**, com seleção aleatória.
- O carro estaciona e fica **60 segundos**. Depois desaparece com o mesmo fade leve da v232.
- O local aguarda **mais 60–120 segundos sem esse carro visitante** antes de receber outro; nunca cria um novo imediatamente ao desaparecer o anterior.
- Máximo de **3 visitantes simultâneos no desktop e 1 no mobile**; a IA de trânsito normal continua separada. Jogador pode assumir o carro, que sai desse ciclo.

## Testes e limitações
- Sintaxe dos scripts inline aprovada (`node --check`).
- Simulação independente de **200 combinações** de seeds/quadras, verificando que parcelas L não se sobrepõem e não ocupam a garagem reservada.
- Teste com o trecho real de `parkingVisitorTick()` por 350 segundos: chegada aos ~88 s, saída aos ~149 s, próxima chegada aos ~234 s, saída aos ~296 s.
- A tentativa de abrir a página no Chromium headless foi bloqueada por política de rede do ambiente (`ERR_BLOCKED_BY_ADMINISTRATOR`); **não houve validação visual de uma partida completa**. Validar no jogo a textura asfaltada na entrada, os formatos L e o comportamento da fogueira em uma seed com rio desaguando no mar.

---

# PixelCity v232 — Quarteirões residenciais compactos e becos com itens

> **Base: v231**. A v223 continua intocada como referência estável/fallback. Esta atualização altera o gerador residencial, não a otimização geral de LOD nem os efeitos noturnos. O DeLorean continua exclusivo da micro-ilha.

## 1. Micro-ilha do DeLorean: todos os lotes uniformes
- Retirado o quadrante inteiro que produzia a casa desproporcionalmente grande na esquina.
- A quadra passa a ser dividida em **16 lotes compactos**, com **seis corredores** de calçada interligando os terrenos (três no sentido X e três no Z, largura **1,9 m**).
- A garagem/DeLorean fica em um dos lotes compactos de esquina, voltada para a via externa no lado da ponte, evitando que o carro fique preso nos corredores de pedestres.
- As cercas continuam delimitando os terrenos, mas os corredores são lacunas físicas entre os limites. A cerca frontal de uma casa preserva abertura para sua porta.

## 2. Residências da cidade: mistura 2/3 tradicionais e 1/3 compactos
- Distribuição **determinística** por seed, usando fluxo pseudoaleatório próprio, sem consumir o sorteio original do mapa.
- Entre os quarteirões residenciais comuns elegíveis (cerca de **60 m × 60 m**), **1/3 arredondado** recebe a subdivisão compacta de 16 lotes; os **2/3 restantes** preservam o gerador com jardins, árvores e cercas, sem alterações.
- A casa segura e lotes mesclados de dimensões fora da faixa elegível ficam no estilo anterior, para preservar a garagem e evitar casas gigantes em blocos compostos.
- Árvores decorativas nos quarteirões compactos são limitadas por sorteio independente para reduzir a regressão de geometria e permitir a circulação.

## 3. Corredores residenciais: lixo, gatos e itens
- São registrados como `city.denseAlleySites` e em `city.catSpots` para aproveitar **spawn de gatos e seleção de locais de vinis e outros coletáveis**.
- Ocasionalmente aparecem sacos de lixo leves junto às bordas, aproveitando a malha agrupada de `bins` e o sistema de colisão já existente.
- O sistema de vinis pode distribuir discos nesses corredores; além disso, um pequeno número de pickups (armas, vida, colete ou dinheiro) é tentado nos corredores livres, com IDs persistentes e tetos globais (**12 no Normal, 5 no Mobile**).
- A posição de cada pickup é testada contra colisões e pickups próximos antes do spawn; nem todos os corredores obrigatoriamente terão itens.
- **Portal Upside Down não aparece nos corredores residenciais**: esses caminhos **não entram** em `city.alleySites`, usado pelo gerador de portais. Continuam exclusivos dos becos de prédios. O local da casa de penhores, a queda no beco após o clube e a saída do túnel da prisão também continuam escolhendo somente becos de prédios.

## Testes e limitações
- Sintaxe JavaScript checada com `node --check`.
- Teste isolado executou o trecho real da geração de lotes: **16 terrenos**, **6 caminhos**, **15 trechos de calçada** sem coplanaridades, nenhuma sobreposição de terrenos. Foram testadas diferentes orientações da ponte do DeLorean.
- Distribuição repetível de 1/3 entre quadras elegíveis testada com as seeds `1`, `275433547`, `2812765640`, `4294967295`; o resultado permaneceu idêntico a cada repetição.
- Checado que novos caminhos alimentam os locais de gatos e não alimentam a lista de portais.
- **Sem playthrough gráfico completo:** o impacto de FPS de 16 casas por quadra compacta e a aparência da garagem/caminhos precisam de validação no jogo. Não é um LOD low-poly; a redução geométrica discutida anteriormente fica para outra etapa.

## Inspeção visual sugerida
1. Gere `2812765640` no modo **Normal**, estilo Modern. Vá para a micro-ilha do DeLorean e fotografe **de cima**, mostrando as 16 casas, e depois **do lado da ponte**, mostrando o acesso à garagem.
2. No Console F12, com a cidade carregada, execute:

```javascript
const i=city.info.findIndex(f=>f.isle),r=city.rects[i];
console.log('Micro-ilha DeLorean', {x:(r[0]+r[2])/2,z:(r[1]+r[3])/2}, 'garagem',city.delSlot);
setMarker((r[0]+r[2])/2,(r[1]+r[3])/2);
console.log('Residências compactas',city.denseHouseCount);
```

3. Para localizar outra quadra compacta, escolha qualquer entrada `city.info` com `.kind==='houses' && .denseHouse && !.isle` e marque o centro do retângulo correspondente. Compare visual e Monitor F3 com v231.

**Saves:** a checagem rígida de `GAME_VER` continua ativa, não carregando automaticamente saves de outras versões.

---

# PixelCity v231 — Otimização conservadora do LOD (base v230)

> **v231 usa a v230 como base**, preservando o restante de suas funcionalidades (estacionamentos e recortes reais da calçada, lanterna, pets, THEMASK, Jammer, etc.). **v223 continua guardada como referência estável/fallback**, sem ser editada. A v225 com faróis duplos pesados não foi retomada.

## Problema investigado

Na seed **275433547**, perto de **X 0.24 / Z 498.52**, olhando **para leste**, o monitor indicou carga alta da thread principal. O usuário também forneceu captura posterior com **24 chunks visíveis** e quase **4 milhões de triângulos**. Isso *não prova* que o LOD seja o único gargalo; a comparação da v231 deve usar exatamente a mesma seed, posição, direção, clima, resolução e configurações.

## Mudanças específicas

- **LOD por transição, não por quadro:** `chunkLod(ch, d)` agora só reatribui os materiais das meshes quando a condição de LOD do chunk **muda de perto para longe ou vice-versa**. A faixa de distância anterior, com histerese (200 m ± 20 m no PC e 145 m ± 20 m no celular), foi preservada.
- **Detalhes pequenos:** a visibilidade de lixeiras/fios do chunk só é atribuída quando a faixa de detalhe muda, não repetidamente em todos os frames.
- **Sincronização de materiais distantes:** propriedades variáveis de cor, emissão e transparência passam a ser sincronizadas **uma vez por material compartilhado**, sem executar `farMaterial()` para cada mesh visível a cada frame. Não deixa a iluminação dos LODs distantes congelada no ciclo dia/noite.
- **Culling do chunk:** a visibilidade do grupo é reatribuída apenas quando o resultado do teste de frustum muda. A frustum e os limites continuam sendo checados normalmente em cada frame; não houve mudança de alcance, recortes ou geração procedural.
- **Regeneração:** os caches de materiais LOD são limpos ao gerar outro mundo, para não manter os objetos antigos vivos na memória.
- **Pré-carregamento de shaders:** preservado; continua chamando os dois modos de LOD durante o loading.
- **Nenhuma alteração** nas geometrias, número de triângulos, iluminação dinâmica, trânsito, IA, shaders de água, limites de draw distance ou semente do gerador.

## Verificações realizadas

- `node --check` de todos os scripts inline: aprovado.
- Teste isolado de `chunkLod` e `farMaterial`, com **24 chunks, 240 meshes** e cerca de **5.000 ciclos**: material atribuído apenas nas transições; histerese e reversão para o material original verificadas; cores e emissão em materiais distantes atualizadas; limpezas de cache verificadas.
- Cinco arquivos conferidos no pacote: `index.html`, `README.md`, `pwa.js`, `manifest.webmanifest` e `sw.js`.
- **Ainda não houve medição real de FPS no jogo**. Reduz trabalho de CPU do LOD, mas não reduz por si só os triângulos (~4 milhões) ou draw calls. A diferença de FPS pode ser pequena caso o gargalo principal esteja no renderizador.

## Protocolo de comparação para captura

1. Gere a seed **275433547**, no modo **Normal**, estilo **Modern**.
2. Vá para **X 0.24, Z 498.52**, olhando **para leste** com a mesma câmera, horário, chuva e qualidade gráfica da v223/v230.
3. Observe o Monitor F3 após alguns segundos parado e compare **FPS, CPU ms, GPU ms, chamadas e triângulos** com a v230. Se possível, tire print dos dois na mesma situação.
4. Mude de direção e volte para o leste: observe se há travadinhas ao cruzar as faixas do LOD.

**Compatibilidade de saves:** a validação estrita de `GAME_VER` existente no jogo permanece. A v231 não carrega automaticamente saves de versões anteriores.

---

# PixelCity v230 — acesso REAL ao estacionamento (rasgo na calçada)

> Hotfix visual/geométrico sobre a **v229**. Não usa o sistema pesado de faróis da v225. A v223 continua como checkpoint estável; as anteriores permanecem intactas.

## O que mudou
- **Não é mais uma faixa colocada em cima da calçada**. O quarteirão com estacionamento tem a malha elevada da calçada reconstruída em trechos com uma **abertura real de 4,8 m**, conectada ao asfalto.
- **Todo o piso do estacionamento** fica em altura de rua (y=0) e com o material/cor de asfalto do mundo, mantendo as marcações de vaga ligeiramente acima do piso para evitar z-fighting.
- As **passagens de entrada** ligam a borda externa do quarteirão ao pátio, inclusive quando o estacionamento ocupa uma parte interna de um lote especial.
- As superfícies de estacionamento e as entradas são registradas num **índice espacial simples** para o cálculo da altura do terreno. Não há busca linear por todos os estacionamentos a cada frame.
- A geração da cidade mantém o cálculo original de ruas durante a etapa procedural; a física das superfícies rebaixadas é ativada somente após o pré-carregamento dos chunks.
- Estão cobertos os estacionamentos genéricos, os gerados em partes excedentes de marcos especiais e o estacionamento que aparece ao lado do heliponto do arranha-céu. Para pátios sem ligação possível com uma via, não se abre uma passagem fictícia sobre terrenos/rios.
- O gerador do arranha-céu foi ajustado para garantir que o estacionamento criado **após** o heliponto também participe dos recortes.
- Preservados carros visitantes, lanterna do celular, The Mask, Caramelo/gato, Jammer e correções anteriores.

## Verificações
- **JavaScript**: `node --check` passou.
- **Testes de geometria isolada**: retirada da calçada no corredor e sobre todo o estacionamento, preservação dos trechos adjacentes, piso de asfalto acessível e fallback sem rua.
- **Não foi possível executar o jogo 3D completo** no ambiente de teste: confirmar visualmente na partida e mandar print do pátio (de cima e em diagonal a partir da rua).

## Local de conferência recomendado
Use a **seed 2812765640, cidade NORMAL, estilo Modern**. Procure o **estacionamento do supermercado**. O ponto de entrada exato depende dos lotes gerados e pode ser obtido no console do navegador após concluir o carregamento:

```js
const p = city.parkingLots.find(p=>/^mk\d+/.test(String(p.tag)) && p.access) || city.parkingLots.find(p=>city.info[p.ri]?.lm==='mkt' && p.access);
if(p){ const a=p.access; console.log('ENTRADA DO SUPERMERCADO', {seed:S.seed, x:+a.x.toFixed(1), z:+a.z.toFixed(1), lado:a.face}); setMarker(a.x,a.z); } else console.log('Sem acesso ao supermercado nesta seed; use outro estacionamento do mapa.');
```

Isso marca o GPS na entrada e imprime as coordenadas reais, sem inventar uma posição para uma seed que não foi executada aqui. Tire um print **em câmera isométrica a 35–45°**, com a rua em primeiro plano e o estacionamento ao fundo, e outro em top-down mostrando o recorte no meio da calçada.

---

# PixelCity v229 — hotfix do travamento em buildLanes (v228)

## Causa raiz do erro
A v228 criava os carros visitantes dos estacionamentos com `mode='rail'`, mas deixava `rail=null`. No quadro seguinte, `buildLanes()` tentava ler `r.kx` e o jogo parava com `TypeError: Cannot read properties of null (reading 'kx')`.

## Correções v229
- Visitantes de estacionamentos usam agora `mode='parking'`, separado do tráfego de ruas. Não entram na física de carros comuns nem nas faixas de trânsito enquanto manobram autonomamente.
- A atualização de tráfego ignora esse novo modo, mas os modelos continuam atualizando o movimento visual e iluminação.
- Ao entrar em um carro visitante antes do fade, o veículo muda para `mode='phys'` e vira dirigível normalmente, sem rota pendente.
- `buildLanes()` tem uma recuperação preventiva de um veículo com `mode='rail'` sem rota, em vez de travar a partida.
- A contagem de visitantes reinicia ao gerar outra cidade; quando estacionam, a velocidade fica zerada.
- Os materiais temporários clonados para o fade são descartados ao final, evitando vazamento de memória ao longo do jogo.

## Validação
- Sintaxe dos scripts inline verificada com `node --check`.
- Teste de regressão do `buildLanes()`: veículos em `parking` não entram nas raias, veículos `rail` válidos funcionam, e um `rail` sem rota não gera exceção.
- Teste do ciclo do visitante: spawn → chegada à vaga → estacionamento → espera de 1 minuto in-game → fade e remoção.
- Pacote ZIP com todos os cinco arquivos do PWA, reutilizando os arquivos auxiliares da v227.

**Limitação:** testes isolados não substituem uma partida completa 3D. Conferir no navegador, principalmente a geração dos estacionamentos, o acesso pela calçada e a circulação na quadra do DeLorean. A v227 e a v223 continuam preservadas.

---

# PixelCity v228 — lanterna do celular, acessos de estacionamento e passagem entre casas

> Esta versão foi construída **sobre a v227**. O pacote experimental de pets/Jammer/THEMASK permanece separado; aqui entram as correções e ajustes solicitados para o arquivo principal.

## Ajustes de iluminação
- **Postes apagados** agora ficam com a cabeça/lâmpada visualmente escurecida também, em vez de continuar parecendo emissiva quando desligados.
- A correção acompanha o brilho instanciado já desligado, deixando o visual mais coerente com os faróis apagados.

## Lanterna do celular
- O celular ganhou a opção **LANterna / LANTERNA** na tela inicial.
- Ao ativar, o player usa uma **lanterna na mão enquanto está a pé**.
- A luz usa o mesmo sistema leve do emissor do jogador, sem criar um item de loja separado.

## Quadra do DeLorean / casas menos tumultuadas
- Nos quadrantes residenciais subdivididos da **quadra do DeLorean**, agora nasce uma **faixa fina de calçada** em cruz no miolo.
- Isso cria passagem da rua até as portas das casas centrais e evita cerca atravessando esses corredores.
- As cercas de limite dos terrenos permanecem ao redor dos lotes reduzidos.

## Estacionamentos com acesso rebaixado
- Estacionamentos de lotes identificados (inclusive lotes especiais que usam a função de parking) agora geram um **acesso rebaixado / curb cut** na calçada, ligando rua e pátio no mesmo eixo visual.
- Os lotes de estacionamento genéricos também entram nessa regra.

## Carros ocasionais em estacionamentos
- Foi adicionado um sistema leve de **visitantes temporários** em estacionamentos próximos ao jogador.
- O carro surge pela entrada do estacionamento, vai até uma vaga e some com **fade** depois de cerca de **1 minuto in-game**.
- Os visitantes usam malha detalhada apenas quando necessário e o número simultâneo é limitado para não pesar.

## Verificação
- O script foi reextraído do HTML e passou em `node --check`.
- Falta validar em jogo principalmente: 
  - o alinhamento visual do acesso rebaixado,
  - a navegação do carro visitante até a vaga,
  - a lanterna do celular a pé,
  - e a nova circulação na quadra do DeLorean.

---

# PixelCity v227 — Perseguição nos interiores, pets, THEMASK e JAMMER (EXPERIMENTAL)

> Esta versão foi construída **sobre a v226**, que por sua vez partiu diretamente da v224; a v223 continua como checkpoint estável. A v225 de faróis duplicados permanece rejeitada por regressão de FPS. O pacote v226 continua intacto como fallback.

## Perseguição / interiores
- Ocorrências iniciadas em clube, cassino e outros interiores com porta externa usam a posição **da porta externa** como referência da fuga.
- Enquanto estiver num interior, o jogo **não conta** a distância do mapa separado para encerrar a perseguição nem tenta criar viaturas ali.
- Ao sair, a perseguição volta a considerar a distância normal do crime: 500 m em mapa normal, 300 m no mobile (mantendo a regra anterior).
- A safe house ainda apaga perseguição/busca via `safePoliceClear()` ao entrar.

## Caramelo e adoção de gato — somente Free Roam
- Caramelo, um cão caramelo, permanece próximo à entrada externa da safe house.
- O jogador pode adotar **um gato de beco** ao se aproximar devagar a pé; aparece **ADOTAR GATINHO** com a tecla E / interação. Se chegar rápido, os gatos fogem como antes.
- Gato adotado aparece no interior da safe house, mesmo quando sai e volta; a adoção e sua cor são registradas no save.
- SMS aleatório ensina a adoção; ocasionalmente Lucia comenta com Jason dentro da casa.
- Esses dois **pets especiais** ficam desativados no modo História para futura progressão por missões (animais de rua genéricos ainda existem).
- Reutiliza os atlas/sprites já existentes; no máximo dois sprites persistentes adicionais nas proximidades da casa, sem modelos 3D.

## THEMASK — cheat experimental
- Código `THEMASK` inicia tornado de **5 segundos** ao redor do jogador/veículo, com um único objeto `THREE.Points` de 70 pontos.
- Ao terminar, o rosto e cabelo ficam verdes/carecas e o sprite veste terno amarelo de manga longa, parte branca central, gravata vermelha, chapéu amarelo, sapatos pretos com detalhe branco e cinto preto.
- Repetir o código restaura a aparência anterior. O traje é **exclusivo do cheat**, sem item em loja.
- Como os outros cheats, o uso continua marcando a sessão e impede salvar.

## JAMMER — arma de teste, somente Free Roam nesta versão
- Disponível ao começar Free Roam, na **roda de armas** ou tecla **8**; é reutilizável (carga 1 não consumível).
- Clique / disparo **somente à noite** e ao ar livre: apagão num círculo de **raio de 100 m** centrado na posição do ativador.
- Postes de luz (matrizes de instâncias existentes) e emissão de luz de janelas, neon e sinais (shaders dos materiais existentes) desligam dentro da área, retornando após **1 hora in-game / 60 segundos reais**.
- Ativar de novo reinicia posição/tempo do protótipo; os materiais compartilham uniformes sem luzes dinâmicas/meshes adicionais.
- Efeito visual em primeira implementação: se partes do mundo tiverem iluminação especial fora dos sistemas padronizados, podem permanecer acesas e requerer integração futura.

## Verificações e limitações
- `node --check` passou para todos os scripts inline.
- Testes isolados passaram para: origem exterior da perseguição, aproximação lenta para adoção, cálculo do raio de 100 m, duração de 60 s, ativação noturna e injeção de shaders de janelas e sinais.
- **Não houve playthrough completo nem medição de FPS**: o navegador headless não conseguiu abrir a página por bloqueio de acesso do ambiente. Conferir principalmente a aparência do THEMASK, a posição dos pets, a transição entre interior/exterior e o impacto do shader à noite.

---

# PixelCity v226 — faróis estacionados e placas nas blitzes (base v224)

- Reintroduz **somente** a leitura da placa real, inclusive personalizada, nas falas da blitz; probabilidades de prisão/reconhecimento preservadas.
- As lâmpadas dos veículos estacionados ficam apagadas e só acendem em movimento (ou sob controle do jogador conforme seu farol manual).
- O único cone / SpotLight da v224 continua exatamente o mesmo. Nada de feixes duplos, novas luzes, materiais ou buffers de cores dinâmicos.
- Veículos distantes: mesma instância de lâmpadas, com matriz zerada para os desligados; não amplia draw calls.
- Veículos detalhados: apenas altera a visibilidade da malha e do feixe existente.
- A v225 foi rejeitada por regressão noturna. Esta v226 deriva da v224, **não** da v225.

---

# PixelCity v224 — cabos do paraquedas +1/3

**Base:** v223 estável, preservada sem mudanças.

- Somente o **comprimento real (inclinado) dos cabos** entre personagem e lona aumenta em 33,3%: de **4,42 para 5,89 unidades**.
- A lona sobe de **Y=4 para Y≈6,04** em relação ao grupo do personagem; a separação vertical passa de 2,7 para aproximadamente 4,74 unidades.
- Pontas superiores de todos os oito cabos acompanham a lona; fixação inferior permanece em **Y=1,3**.
- Usa o mesmo modelo compartilhado para jogador e NPCs.
- **Sem alterar a largura/diâmetro da lona, materiais, física, velocidade de queda ou complexidade geométrica.**

## Observação de compatibilidade

O jogo atual valida saves pelo número da versão (`GAME_VER`). Saves de v223 não são aceitos automaticamente na v224. A v223 permanece disponível como referência estável.

---

## PixelCity v223 — sol com metade do diâmetro

- **Disco do sol 50% menor** nos estilos Modern e Synthwave, mantendo o brilho atmosférico, as cores do céu, sombras, iluminação e o ciclo dia/noite. Somente o tamanho visual do disco foi alterado.
- **Continuidade da v222:** câmera da introdução duas vezes mais perto do avião; os três testes de áudio nos sliders, volumes em tempo real, rádio integrado a ÁUDIO, controles de MUNDO movidos para GRÁFICOS, e reposição do carro inicial após MISSION FAIL.
- **Base:** v222. `GAME_VER=223`.
- **Testes:** `node --check`; testes isolados de áudio e missão; layout em 1120 e 430 px no Chromium. A aparência do novo sol ainda deve ser conferida no navegador do jogo.

---

## v222 — Áudio em Configurações, gráficos, MISSION FAIL e câmera da abertura

- **Câmera da introdução:** aproximada ao dobro, reduzindo pela metade todos os deslocamentos relativos ao avião (38→19 para trás, 26→13 lateral, 18→9 vertical e ponto de mira ajustado proporcionalmente). Mantém o ângulo, a lente, a trajetória e o comportamento do voo.
- **Configurações / ÁUDIO:** painel **VOLUME** com três testes independentes — **TESTAR GERAL** (música + sirene sintética), **TESTAR RÁDIO** (somente música) e **TESTAR EFEITOS** (somente a sirene). Cada botão é liga/desliga com um clique; trocar de teste interrompe o anterior.
- **Volume em tempo real:** mover os controles atualiza imediatamente a música local, o rádio online e a sirene de teste; o volume geral multiplica música e efeitos. Um teste parado deixa de tocar, sem continuar em segundo plano.
- **Rádio:** os controles existentes de estação/fonte/importação passam à seção **MÚSICAS E RÁDIOS** dentro de **ÁUDIO**, abaixo dos controles de música. A aba separada **RÁDIO** foi removida; a longa mensagem sobre quantidade de rádios encontradas no servidor não é mais exibida.
- **Fallback dos testes musicais:** percorre as faixas disponíveis na ordem, ignora as que falham e tenta a rádio online se necessário; se o online também falhar, informa que o teste foi ignorado.
- **GRÁFICOS:** tráfego e pedestres, anteriormente em **MUNDO**, ficam na seção **GRÁFICOS**, junto dos demais controles visuais. A aba **MUNDO** foi removida de Configurações. A opção de tempestade da tela inicial não foi removida.
- **MISSION FAIL no início da História:** se o carro inicial explodiu, sua entidade é recriada e, em todos os casos, é recolocada na mesma posição de embarque calculada pela introdução, com vida e estado restaurados, sem gerar nova cidade.
- **Base:** v221. `GAME_VER=222`.

### Verificações da v222

- `node --check` do JavaScript: aprovado.
- Testes isolados no Node: acionamento dos três testes, interrupção, avanço da lista local para rádio online, mudança dos volumes em reprodução; recuperação do carro inicial destruído ou sobrevivente.
- Teste de layout no Chromium em 1120 px e 430 px: navegação das abas, três botões de teste, rádio integrado e tráfego/pedestres em Gráficos.
- Ainda é necessário testar áudio de rádio real e a cutscene/missão completa no navegador em condições de jogo.

---

## v221 — Spoilers com o mesmo acabamento brilhante da lataria

- Os dois spoilers do avião do aeroporto usam **exatamente o mesmo `carBodyMat` (`THREE.MeshStandardMaterial`)** utilizado pelas asas e pela fuselagem, com a mesma rugosidade (`0,42`) e metalicidade (`0,18`).
- A geometria dos painéis recebe a **cor por vértice branca das asas (`#e8eaee`)**. Isso corrige o aspecto fosco que ocorria quando os painéis usavam um `MeshLambertMaterial` cinza, sem o acabamento da lataria.
- Sem texturas, shaders, materiais ou peças adicionais: continuam sendo apenas dois painéis finos, com a abertura lenta e a frenagem progressiva da v220 preservadas.
- **Base:** v220; nenhuma alteração em cutscenes, personagens, voo ou física. `GAME_VER=221`.

## v220 — Spoilers proporcionais e desbloqueio visual da Lucia

- **Spoilers do avião:** continuam sendo apenas dois painéis planos, uma face em cada asa (quatro triângulos no total), com a mesma geometria e material compartilhados. Agora têm **1,32 × 3,15 unidades**: são curtos ao longo do avião e largos na direção transversal da asa, em vez de longos e estreitos. A dobradiça foi reposicionada para manter a placa sobre a asa. **Não foram adicionados efeitos, meshes ou atualizações custosas.**
- **Animação e frenagem preservadas:** abertura lenta da v219, desaceleração proporcional à abertura, recolhimento no táxi e espera pela posição totalmente abaixada antes do fade final.
- **Modo História antes de liberar Lucia:** os dois retratos da bola de troca ficam **cinzas e indisponíveis**, reaproveitando o bloqueio já usado durante perseguição e prisão. Apertar Alt, tocar ou clicar antes do desbloqueio **não exibe mais** “SÓ O JASON POR ENQUANTO”.
- **Após concluir a primeira missão:** quando os créditos terminam ou são pulados e o jogador volta ao controle, a bola readquire suas cores e aparece no canto superior esquerdo o quadro laranja **“PERSONAGENS LIBERADOS — Você pode alternar com a Lucia agora.”** A instrução some quando a troca é realizada ou após 30 segundos de jogo; pausas não gastam o tempo de exibição. A liberação não se repete por carregar um save já concluído.
- **Modo Livre:** preservadas as cores normais e os bloqueios já existentes para perseguição/prisão.
- **Base:** v219; ajustes focados no HUD do personagem e na geometria dos spoilers. `GAME_VER=220`.

## v219 — Spoilers retangulares, lentos e vinculados à frenagem

- **Formato:** os dois painéis sobre as asas estão mais alongados (3,65 × 0,84 unidades). Continuam sendo somente duas faces planas, compartilhando geometria e material, sem partículas ou peças adicionais.
- **Subida gradual:** a abertura começa na segunda metade do deslocamento pela pista. Os spoilers aumentam progressivamente o ângulo, com limite de aproximadamente 0,65 por segundo na fração de abertura, bem mais lento que na v218.
- **Frenagem sincronizada:** o avião rola livre no início e a resistência cresce com a abertura real dos dois painéis. Uma proteção calcula a desaceleração mínima de segurança conforme a distância restante, evitando bater na cabeceira oposta em pistas curtas ou FPS baixos.
- **Recolhimento:** no táxi, os painéis baixam lentamente (até ~3 s quando totalmente abertos). A cutscene não inicia o fade para a jogabilidade até que estejam recolhidos, mesmo se já completou o tempo mínimo de táxi.
- **Testes:** `node --check` passou. Rodados 48 cenários isolados com a implementação JavaScript real de rolagem/frenagem, comprimentos de pista de 105 a 520 unidades e simulações a 8, 30, 60 e 120 FPS. Todos alcançaram velocidade de táxi com margem de pista, os painéis seguiram a abertura calculada e terminaram recolhidos antes da passagem cinematográfica. Isso não substitui a validação visual dentro do jogo.
- **Base:** v218, preservando o zoneamento do aeroporto, o fluxo PULAR/ESC, a concessionária, os estacionamentos dos impérios e demais recursos anteriores. `GAME_VER=219`.

## v218 — Frenagem tardia e dois spoilers ultraleves nas asas

- **Pista inteira aproveitada:** após tocar a pista, o avião rola por mais tempo com desaceleração suave e velocidade mínima de aproximadamente 19,5 unidades/s nesta fase.
- **Frenagem forte somente mais adiante:** a decisão ocorre conforme a distância restante até um ponto seguro antes do fim da pista, levando em conta a velocidade atual. A frenagem final é de cerca de 18,5 unidades/s², reduzindo a velocidade para 6,2 antes de iniciar o taxiamento.
- **Segurança:** reserva de espaço para o primeiro movimento de táxi e para o nariz da aeronave, reduzindo o risco de atingir o muro. A posição da freada se adapta ao comprimento disponível da pista, inclusive com FPS baixo.
- **Spoilers simples:** exatamente **dois retângulos finos**, um em cada asa, levantam quando a freada forte começa e baixam ao iniciar o táxi. São duas faces retangulares (quatro triângulos no total), compartilhando geometria e material. São criados **somente** para o avião do aeroporto, sem afetar o tráfego aéreo comum.
- Mantidos a curva de pouso da v217, o zoneamento aeronáutico da v215 e o restante dos sistemas do jogo. `GAME_VER=218`.

### Verificações da v218

- Sintaxe do JavaScript: `node --check` aprovado.
- Modelo matemático isolado de frenagem: combinações de pista entre 105 e 520 unidades, velocidades iniciais entre 20 e 40, e taxas de 8 a 120 FPS. Todos os cenários mantiveram espaço após o táxi inicial; ainda é necessário testar visualmente o jogo no navegador.

## v217 — Touchdown mais cedo e freada reforçada

- O avião passa a buscar toque mais cedo na pista, com altura da final suavizada, velocidade de aproximação ajustada e transição ao táxi refinada. A v218 substitui a frenagem imediata forte desta versão por frenagem em duas fases.

## v216 — ESC nas cutscenes, placa na concessionária e SUVs de gangue nas vagas

- **ESC/Start durante a abertura:** corrigida a ordem de sobreposição. O menu de pausa aparece acima das faixas/tela preta da cutscene, e o botão **PULAR** fica visível acima do menu enquanto a cena está pausada. Ao fechar o menu, a cena continua; ao pular, sai do menu e avança só o trecho atual. O botão recebe foco na pausa, permitindo confirmá-lo pelo gamepad.
- **Concessionária Pixel Motors:** incluído o campo **PLACA** com número atual e botão **EDITAR PLACA** (mesmo editor de texto do tuning). Aceita de 1 a 7 letras/números, converte para maiúsculas e mantém o texto no carro de exibição, no veículo comprado e na garagem/save. Ao trocar o modelo ou a cor, conserva a placa personalizada selecionada; ao entrar novamente na loja, começa uma seleção nova.
- **Impérios / SUV da gangue:** os estacionamentos gerados agora registram as posições e orientações das vagas já pintadas (sem novos polígonos). Quando a propriedade tem estacionamento, o SUV rival ocupa uma vaga **desse mesmo quarteirão**, preferindo uma livre. Somente se todas estiverem ocupadas, substitui um carro decorativo estacionado. Aeroporto e locais sem estacionamento desenhado preservam o posicionamento anterior.
- Preservados o zoneamento aeronáutico da v215, os NPCs das sacadas, o menu compacto, o monitor e as demais funções anteriores. `GAME_VER=216`.

### Verificações da v216

- `node --check` no script principal: aprovado.
- Testes isolados de seleção de vaga por quarteirão, substituição de carro decorativo, normalização de placa e estado do botão PULAR: aprovados.
- Chromium headless: ordem das camadas do menu, tela preta e botão PULAR durante pausa verificada com clique.
- **Limitação:** essas verificações não substituem jogar a abertura inteira e visitar a concessionária/impérios na cidade 3D.

## v215 — Zoneamento aeronáutico e aproximação contínua

**Ideia central:** a cidade respeita a rota de pouso/decolagem; o avião deixa de alterar o ângulo toda vez que encontra um prédio.

- **Ordem de geração:** rios, costa e ruas continuam sendo preparados primeiro; o aeroporto tem prioridade antes dos marcos especiais e das construções comuns. Assim que seu lote é selecionado, o jogo cria uma **zona de proteção aeronáutica** para os dois extremos da pista. Esse cálculo é determinístico, sem adicionar sorteios extras no zoneamento.
- **Teto de altura progressivo:** a restrição acompanha o eixo e a largura das asas, com expansão lateral moderada, até aproximadamente **cinco quarteirões (5 × P)** de cada cabeceira. A altura máxima cresce com a distância da pista. Prédios comuns podem continuar existindo na zona, porém mais baixos: limitam-se a fachada, pisos adicionais, anexos e antenas. Nos primeiros lotes, continuam casas térreas normais da v208.
- **Sem prédios especiais no corredor:** as rotinas de escolha de marcos, indústria, concessionária, oficina e demais locais que usam o seletor de lotes rejeitam quarteirões sinalizados como zona protegida. A escolha prioritária do aeroporto evita, quando existem alternativas, interferir na quadra já reservada ao banco. Os marcos continuam obrigatórios e são realocados para outros terrenos válidos.
- **Rios, pontes e vias preservados:** nenhum deles é desviado ou removido. É só uma regra sobre o que pode ser construído acima do solo. Árvores dentro do corredor têm porte limitado; linhas exteriores de prédios altos são evitadas.
- **Pouso natural:** remove-se o perfil com “degraus” ditado pelos obstáculos e entra uma rampa de altura contínua com arredondamento curto no toque. Na curva, interpolação suave e altura gradualmente reduzida. Controle vertical com limite de variação para evitar “dentes” visíveis. O ponto de toque é estável (não é deslocado para fugir de prédios).
- **Decolagem:** volta à razão normal de subida quando o aeroporto possui zoneamento. Não exige subida de emergência por causa de torres imediatamente após a pista.
- **Memória/performance:** os limites são calculados usando retângulos e gravados nos lotes no momento da geração. Não há raycasts novos no loop de renderização ou varredura de prédios a cada frame.

**Validações realizadas:** sintaxe do JavaScript via `node --check`; 34 layouts de zonas (Normal e Mobile) incluindo as seeds `2812765640`, `2596179711`, `3237015248` e `2542269881`; 24 simulações isoladas de pouso e decolagem nas quatro seeds, lados de curva e 30/8 FPS, com obstáculos aproximados pela geometria dos lotes. **São testes programáticos, não uma garantia de ausência de colisões em todas as malhas do navegador.**

**Base:** v214, mantendo o botão PULAR durante o menu de pausa em cutscenes, o monitor, as placas, as missões e os demais sistemas. `GAME_VER=215`.

## v214 — botão PULAR só no pause durante cutscenes

### Ajuste de UX

Durante cutscenes, o botão **PULAR** não fica mais visível o tempo todo.

#### Novo comportamento
- **Cutscene rodando normalmente:** botão **PULAR** fica oculto.
- **Ao apertar ESC / abrir o menu de pausa durante a cutscene:** o botão **PULAR** aparece no canto, onde já ficava antes.
- **Ao clicar em PULAR:**
  - o menu fecha,
  - o jogo despausa,
  - e o trecho atual da cutscene é pulado.

### Mantido
- A lógica de pular **um trecho por vez** continua igual:
  - abertura: apresentação → avião → jogo
  - final: missão concluída → continua… → créditos → jogo

### Base
- Build feita sobre a **v213**.
- Nenhuma outra mecânica principal foi alterada.

`GAME_VER=214`

## v213 — pouso mais suave + menu de modo simplificado

### Ajustes principais

#### 1) Aproximação e pouso do avião suavizados
A v213 recalibra o perfil de descida para ficar menos conservador e menos brusco.

- Redução da altura mínima exagerada sobre quarteirões de casas.
- “Degraus” do pouso mantidos, porém com transições muito mais suaves.
- Descida começa cedo e de forma gradual, evitando o “dente” perto da pista.
- Correção vertical na final reduzida para evitar mergulhos bruscos em seeds como:
  - `2596179711`
  - `3237015248`
- Mantido o bom comportamento observado na seed `2542269881`.

#### 2) Seleção de Modo História / Modo Livre
- Removidos os textos descritivos abaixo dos títulos:
  - “missões · a cidade se revela aos poucos”
  - “tudo liberado desde o início”

Agora ficam apenas os dois cartões com os títulos.

#### 3) Monitor nas cutscenes
- O monitor agora fica realmente oculto durante cutscenes.
- Após a cutscene, ele reaparece respeitando a preferência atual do jogador.

### Observações técnicas
- Base usada: `v212`.
- Ajustes feitos apenas no `index.html`.
- O comportamento final ainda deve ser conferido visualmente no navegador com as seeds citadas.

`GAME_VER=213`

## v212 — PULAR por trechos, créditos com fade e Monitor reposicionado

- **Botão PULAR:** rótulo simplificado para `PULAR` tanto na abertura quanto no encerramento. Cada ativação avança uma etapa: **logo da produtora → cena do avião → jogabilidade** na abertura; **MISSÃO CONCLUÍDA → CONTINUA… → créditos → jogabilidade** no encerramento. O salto dispensa fade-in/fade-out intermediários, mas a execução normal ainda mantém transições suaves.
- **Créditos sem piscada:** o texto é preparado fora da tela, com posição inicial calculada **antes** de ficar visível. Na entrada normal, o pano preto fica por cima dos créditos e vai clareando enquanto eles já sobem; o botão PULAR pode entrar direto na rolagem sem esperar o fade.
- **Monitor durante cinematics:** fica visualmente oculto na abertura, no reencontro, no encerramento e até terminar a transição para o jogo, sem apagar a preferência F3 gravada; reaparece automaticamente no gameplay.
- **Monitor durante instruções:** com a janela laranja de missão/tutorial (`storyGuide`) visível, o Monitor fica **logo abaixo dela, do lado esquerdo**. A altura é calculada pela borda inferior real da instrução e se adapta ao tamanho da tela. Ao terminar o tutorial, retorna à posição normal; não ocupa mais o espaço de alerta de perseguição/estrelas na direita.
- **Pausa corrigida:** `Esc` e `Start` continuam abrindo o menu durante cinematics, mas agora congelam realmente o progresso da cena enquanto o menu estiver aberto. O menu pode ser navegado com controle durante essa pausa.
- **Validação:** `node --check`, testes isolados das transições de PULAR e do bloqueio de progresso durante pausa; renderização em Chromium da posição do Monitor em 1280px e 430px, incluindo sua ocultação em cinematics. O jogo completo ainda exige verificação manual.
- **Base:** integral da v211, sem alterações no pouso, geração, pedágio, placas, personagens ou PWA. `GAME_VER=212`.

## v211 — Aproximação mais baixa + posição da versão no menu de pausa

- **Pouso menos conservador:** a altura da aproximação deixa de herdar o prédio mais alto encontrado em toda a curva. A rampa final acompanha localmente os obstáculos do corredor, com patamares mais baixos quando não há construções altas; a folga de planejamento sobre os telhados foi reduzida a 5 unidades. Mantidos o toque na pista e o modelo de descida contínua, com trajetórias pré-calculadas uma vez por geração.
- **Lado de aproximação:** quando há dois corredores possíveis, o avião prefere o lado que exige menor altitude média. Isso evita dar uma volta sobre prédios altos quando o outro lado está livre.
- **Seeds verificadas em testes isolados:** `2812765640`, `2542269881`, `2596179711` e `3237015248`. Nas sementes 2542269881 e 2596179711, a altura final sem torres caiu para aproximadamente 17–18 unidades, em vez de superar 50. A 2812765640 ainda exige mais altura na reta por possuir prédios diretamente no corredor.
- **Menu de pausa:** a etiqueta `v.211` agora fica junto da extremidade direita da linha divisória, em vez de colada ao título PixelCity. O layout do menu inicial permanece como antes. Conferido em larguras 420 e 800 px com renderização isolada do menu.
- **Preservação:** v210 (Esc/Start pausam durante cutscenes e Monitor evita sobreposição com texto do tutorial), v209 (pedágio e retorno ao menu), placas, oficina, NPCs nas sacadas, aeroporto, sistemas restantes e PWA.
- **Validação:** `node --check` no JavaScript e simulações isoladas das quatro sementes; não equivale a testar as animações e colisões em uma partida real.

## v210 — Pausa de cutscenes e Monitor sem sobreposição

- Durante a cutscene inicial e os créditos, `Esc` abre/fecha a pausa; `Start` no controle tem o mesmo efeito. O comando de pular permanece separado.
- Enquanto `storyGuide` aparece, o Monitor F3 vai para a direita e retorna ao lado normal quando a dica desaparece.

## v209 — Pedágio do DeLorean e botão para voltar ao menu inicial

- **Pedágio da micro-ilha:** corrigido o cruzamento das cancelas. A abertura de cada braço passa a ser decidida pela **faixa lateral real** em que o veículo está, não pelo lado longitudinal de onde ele se aproxima. Isso vale para o carro do jogador e para o tráfego NPC, preservando a cobrança, a animação lenta e a reação ao furo do pedágio. As cancelas das pontes levadiças permanecem inalteradas.
- **Menu durante o jogo:** incluído **VOLTAR AO MENU INICIAL** na terceira linha, ocupando toda a largura dos dois botões superiores. Os quatro botões anteriores continuam na mesma grade 2×2.
- **Controle:** o novo botão participa da navegação já existente por direcional/analógico e pode ser ativado com **X/A**. Acioná-lo recarrega a página para mostrar o menu inicial, sem exigir F5 ou teclado; o progresso que não foi salvo é perdido. O botão não aparece antes de começar a partida.
- **Validação:** sintaxe JavaScript, estrutura do menu, CSS desktop/mobile e cenários isolados de lado de faixa nas cancelas. Não substituem teste de jogabilidade completo no navegador. `GAME_VER=209`.

## v208 — Casas térreas junto às cabeceiras, mapa verde corrigido e cemitério fiel

- **Aeroporto: apenas o primeiro quarteirão de cada ponta da pista:** removida a faixa de lotes artificiais vazios (`airCorridor==='clear'`) da v207. A geração agora reserva **um quarteirão de profundidade** na cabeceira de aterrissagem e outro na saída da decolagem. Esses terrenos usam o **gerador normal de casas térreas**, com gramado, quintal, cercas e detalhes habituais. Não altera nem abre novos rios; se já houver rio na primeira quadra de uma ponta, ele continua servindo como corredor baixo e dispensa converter mais lotes. Após a primeira quadra, prédios podem surgir normalmente.
- **Reserva determinística e precoce:** a escolha ocorre antes dos marcos especiais, com base na posição da pista e no corredor estreito sob as asas. Não remove ruas, pontes, marcos obrigatórios ou bairro; evita consumir blocos distantes como a v207. Os lotes especiais existentes, a micro-ilha e o banco permanecem protegidos.
- **Pouso com menor altitude desnecessária:** redução de 31 para 26 unidades no patamar mínimo da curva **somente quando não há obstáculos altos exigindo mais**. Continuam válidos o envelope dinâmico, a distância de segurança dos telhados, os patamares suaves e o limite de inclinação da v207.
- **Decolagem protegida após as casas:** quando o corredor depois da primeira quadra contém prédio alto ou marco especial, a razão de subida inicial aumenta apenas até passar essa região; quando está livre, mantém a subida normal. Não prolonga nem aumenta a área reservada.
- **Correção do mapa:** os quarteirões de casas com gramado usam fundo verde no mapa em vez de cinza/bege de asfalto; antigos lotes verdes não são mais tratados como estacionamento. A área do **cemitério** continua identificada como verde, agora com caminhos cruzados, lápides discretas e o obelisco central, em posição coerente com seu lote real, em vez da cruz simples sobre uma área genérica.
- **Validação:** `node --check` aprovado; 56 testes isolados de geração de lotes (Normal/Mobile, incluindo seeds 3237015248, 2812765640, 2542269881 e 2596179711) sem faixas longas/terrenos vazios artificiais. 42 simulações isoladas de pouso e decolagem nas três seeds de regressão, incluindo 8 FPS, aprovação dos critérios de trajetória usados. Esses testes não substituem uma inspeção completa das malhas e cores no navegador.
- **Escopo:** base v207 preservada, inclusive aviões, veículos, tuning, placas, HUD, cutscenes, NPCs nas sacadas e PWA. `GAME_VER=208`; saves continuam sujeitos à incompatibilidade entre builds.

## v207 — Corredores livres para pouso e decolagem (geração protegida)

- **Correção estrutural, não só de animação:** antes dos marcos e da indústria, o gerador reserva um corredor na frente da cabeceira de aterrissagem **e outro após a ponta de decolagem**, usando o eixo real da pista e a largura necessária para asas/pequena deriva. Rios, ruas, pontes, pista e dimensão da cidade continuam intocados.
- **Terrenos imediatamente vizinhos:** os lotes que atravessam o corredor a menos de aproximadamente 137 unidades da respectiva cabeceira passam a ser **terreno verde vazio**, sem prédios, carros estacionados ou árvores altas (somente dentro do lote, sem mexer nas vias). Isso cobre inclusive quarteirões fundidos compridos.
- **Faixa de transição:** até aproximadamente 215 unidades das cabeceiras, os lotes no corredor usam **casas baixas**, protegidas contra a seleção de marcos grandes e prédios industriais. Depois disso, a cidade volta à geração normal. O gerador não cria rios artificiais, nem altera a seed do mapa.
- **Garantia dos especiais:** a reserva ocorre antes da distribuição dos marcos obrigatórios, para evitar que prédios especiais nasçam sobre o eixo da pista. O banco reservado e a micro-ilha são preservados. A disposição de lotes adjacentes pode mudar com a versão, mas continua determinística por seed.
- **Ângulo controlado:** a curva dinâmica da v206 continua sendo usada para obstáculos restantes, mas o pouso limita a inclinação desejada a cerca de 0,36 unidade de altura por unidade horizontal (~20°), a velocidade vertical-alvo a 11 unidades/s e a arfagem visual negativa a aproximadamente 0,38 rad. Em casos insolúveis, não força o avião a um mergulho impossível só para evitar colisão.
- **Decolagem:** seu perfil anterior de aceleração/subida foi preservado; o ganho de segurança vem principalmente de retirar os prédios do corredor de saída.
- **Seed extrema 3237015248:** pista longitudinal no eixo Z, com lote de prédios a cerca de 20 unidades da cabeceira e outro próximo à saída. Os dois são tratados pela reserva. Também verificadas as seeds 2812765640 e 2542269881.
- **Validação:** sintaxe JavaScript aprovada; 42 simulações isoladas de pouso/decolagem com os terrenos reservados (3 seeds, dia/noite, 60/30/8 FPS e dois lados de curva) sem falhas; 36 layouts adicionais de geração Normal/Mobile sem consumo excessivo de lotes. Os testes são geométricos/lógicos; teste visual 3D integral no navegador não pôde ser executado neste ambiente.
- **Escopo:** versão baseada na v206 e mantendo botão de pular abertura, aviões, veículos, placas, UI, save, cidade procedural e PWA. `GAME_VER=207`; a política de saves entre versões continua a mesma.

## v206 — Pouso mais baixo, em patamares suaves, seguindo os telhados

- **Aproximação mais próxima dos prédios:** a v205 mantinha a altitude de segurança do edifício mais alto até perto da pista, criando trechos de voo excessivamente altos. A v206 cria uma sequência de patamares por obstáculo: o avião passa acima de cada telhado e, quando a cauda o ultrapassa, pode começar a descer para a próxima altura necessária. A nova rampa não é horizontal por muito tempo sem necessidade.
- **Descida começa na curva:** a perna em semi-C perde suavemente alguns metros antes de alinhar com a cabeceira; a reta final usa transições cúbicas contínuas, sem alterar a altitude por saltos. Trechos breves de nivelamento podem aparecer entre edifícios, como na referência visual.
- **Envelope dinâmico:** considera alturas reais de prédios, casas, árvores e edifícios do anel; preserva folga para nariz, cauda, asas e motores. Inspeciona também os lotes próximos da curva e da perna do vento nos dois sentidos, evitando baixar demais quando o aeroporto fica perto de quarteirões altos.
- **Desempenho:** planejamento geométrico feito uma única vez na inicialização do aeroporto. A cada quadro o avião consulta apenas os poucos patamares relevantes, sem raycasts contínuos ou novas malhas.
- **Pista e história:** mantém toque perto da cabeceira, desaceleração, decolagem original e o botão **PULAR CUTSCENE** da abertura da v205. Sem mudanças na geração da cidade e no restante do gameplay.
- **Validação isolada:** checagem sintática JavaScript aprovada; 128 cenários de pouso com obstáculos sintéticos, 64 simulações baseadas nos lotes das seeds 2542269881 e 2812765640, além de 96 simulações com múltiplos patamares, incluindo 8 FPS e os eixos X/Z. Nenhum dos casos falhou nos critérios de pista/folga desses testes. A execução visual 3D completa ainda precisa ser conferida no navegador.
- `GAME_VER=206`. Saves de outras versões continuam sujeitos à incompatibilidade vigente.

## v205 — Pouso dinâmico segundo obstáculos + pular cutscene inicial

- **Planejamento por seed:** antes do voo, o aeroporto usa o mapa procedural já pré-carregado para construir uma lista de prédios, casas e árvores relevantes no corredor final, incluindo suas alturas. O cálculo ocorre uma vez ao preparar o aeroporto, não em todos os frames. Considera a largura das asas (envergadura do modelo em escala), o avanço do nariz/cauda e margem sobre telhados.
- **Pouso perto da cabeceira:** a aeronave prioriza tocar aproximadamente **28 a 47 unidades depois do começo da pista**, alterando esse ponto só quando um obstáculo muito próximo exige mais distância. Isso preserva a área de frenagem e elimina a chegada excessivamente longa da v204.
- **Ângulo variável:** sem obstáculos no corredor, descida de referência próxima a 22°; com prédios altos ao lado da aproximação, rampa proporcionalmente mais inclinada, sem mergulho fixo para toda seed. O perfil tem transições com altura e inclinação contínuas entre voo nivelado, descida e flare perto do toque — sem saltos instantâneos de altitude.
- **Medição de cobertura:** edifícios registram a altura até o nível superior; casas registram cobertura e detalhes de telhado; árvores usam copas reais (`ch.trees`). Objetos na margem que não chegam ao envelope lateral das asas não obrigam o avião a subir sem necessidade.
- **Abertura da campanha:** o mesmo botão **PULAR CUTSCENE** já usado nos créditos aparece durante a cinematografia inicial. Ao clicar, a abertura termina e o tutorial começa, sem cancelar a progressão da história. O voo da cena usa a nova rampa dinâmica.
- **Regressões automatizadas:** `node --check` aprovado; 128 simulações de pouso com prédios de alturas sintéticas em dois eixos / modos livre e história / laterais de curva / diversos intervalos (até 8 FPS), além de 64 simulações usando lotes derivados das seeds **2542269881** e **2812765640**. Todas aterrissaram com margem de pista. Na verificação por lotes da 2812765640, a folga aproximada mínima de centro da aeronave até o telhado ficou em **6,1 unidades** na variação de prédios mais altos; os testes não reproduzem a renderização/colisões 3D completas.
- **Limitação:** a trajetória final e a folga visual do modelo inteiro devem ser observadas em uma partida real, especialmente nas duas seeds extremas e na abertura cinematográfica. Seed intacta e geração determinística preservada.
- **Escopo:** v204 → `GAME_VER=205`, sem alterar a decolagem, o aeroporto compacto, o tráfego, a oficina ou os outros sistemas de gameplay. Saves continuam sujeitos à política de incompatibilidade entre versões.

## v204 — Pouso mais alto, rampa final acentuada e teste da seed 2812765640

- **Aproximação sobre prédios:** a aeronave mantém altitude de cruzeiro durante mais tempo e inicia a descida acentuada nas proximidades da pista. O perfil de aproximação (`airLandingProfile`) tem uma região alta, um trecho de descida mais inclinado e uma transição suave junto ao solo para evitar uma queda abrupta.
- **Toque mais adiante na pista:** `airLandingTouch` desloca o ponto de toque para dentro da pista, preservando aproximadamente 50 unidades para frenagem, em vez de tentar encostar na cabeceira. A desaceleração na pista passa de 8 para 10 unidades/s².
- **Física reaproveitada:** a movimentação 3D, curvas, arfagem, alinhamento na pista e o taxiamento continuam usando a IA existente (`airTick2`); a decolagem permanece igual. O pouso cinematográfico da campanha também usa o novo perfil.
- **Teste direcionado à seed `2812765640` (Normal, Modern):** o planejamento determinístico reproduz um aeroporto com pista de 128 unidades, orientada no eixo Z, e identifica um lote urbano diretamente na aproximação (x=692–752, z=692–752). Simulei a aeronave na pista gerada, com margem lateral de 4 unidades, nos dois sentidos da curva, em história/livre e em 5 intervalos de atualização (20 trajetórias). Menor altitude observada acima do lote: **53,04 unidades**. O avião pousou e manteve ao menos 50 unidades de pista disponíveis para frear nos testes. Essa é uma verificação geométrica do corredor com folga conservadora, não uma renderização 3D completa.
- **Regressões adicionais:** 60 simulações isoladas de pouso (3 comprimentos de pista × 5 intervalos de atualização × 2 modos de entrada × 2 lados), todas concluindo dentro da pista; sintaxe JavaScript validada com `node --check`.
- **Limitação:** a execução visual real do jogo e a colisão com todas as malhas exatas dos prédios ainda precisam ser verificadas em navegador. O ambiente bloqueou o carregamento local do jogo no Chromium.
- Sem alterações em aeroportos compactos (sobrevoos) e na decolagem; preservadas as demais mecânicas da v203. `GAME_VER=204`.

## v203 — Editor da placa corrigido, aeroporto mais central e acabamento dos veículos

- **Editar placa:** o campo utilizado pelo terminal/cheat saía atrás da janela da oficina porque pertencia ao HUD. Ao abrir a edição, ele agora é movido para o `body`, com posicionamento fixo acima do modal, foco e até sete caracteres alfanuméricos. Enter confirma; Escape cancela. O terminal de cheats continua usando o mesmo campo.
- **Oficina:** título alterado para **Veloz e Nervoso**.
- **Placas sem duplicação:** retirados os retângulos brancos/azuis extras da v199–v202. Os caracteres agora são aplicados diretamente sobre a placa branca/azul que já faz parte do modelo detalhado do veículo. Nas motos continua só a placa traseira; no Vortex foi adicionada a base ao próprio modelo.
- **Economia gráfica:** o texto usa **um atlas de caracteres compartilhado** entre todos os carros, com uma malha de texto por carro detalhado, em vez de uma nova textura de canvas para cada placa/número. A placa original continua no modelo; nenhum painel extra fica flutuando.
- **Aeroporto:** lotes grandes continuam prioritários, mas a seleção não procura mais a distância máxima rural. Prefere quarteirões compridos na zona urbana/próxima ao núcleo, alvo de distância normalizada ~0,36 e preferência por terrenos com `d<=0.56`, quando existentes. A reserva continua acontecendo antes dos marcos/indústria; no fallback de quadra compacta aplica o mesmo viés central. Seed informada para inspeção: `2596179711`.
- **Neon:** removido o paralelepípedo de cor sólida embaixo do carro; o plano de `glowTex` aditivo fica preservado para manter o brilho projetado.
- **Teste:** `node --check` do JavaScript, e teste isolado dos caracteres de placas (carro, roadster, moto e Vortex). Execução visual completa do mundo não validada neste ambiente.
- `GAME_VER=203`. Continua a política vigente de saves incompatíveis entre versões.

## v202 — Seed atual no Monitor, com botão próprio de copiar

- **Seed visível:** o Monitor (F3) exibe `SEED: <número>` em uma linha imediatamente acima das coordenadas `X/Y/Z`.
- **Botão COPIAR independente:** ao lado da seed, um botão copia apenas o número puro (sem o texto `SEED:`). O botão já existente de coordenadas permanece na linha seguinte e continua copiando somente `x,y,z`.
- **Seed sempre atual:** o valor acompanha alterações no menu inicial, geração de outra cidade, restauração de save e transições de mundo; é atualizado ao abrir o Monitor e durante as amostras de desempenho.
- **Reaproveitamento:** ambos os botões usam o mesmo mecanismo de cópia pelo navegador (`navigator.clipboard`, com fallback `execCommand`) e a mesma confirmação visual `COPIADO` ou `ERRO AO COPIAR`.
- **Escopo:** nenhum ajuste na cidade, veículos, NPCs, armas, saves ou desempenho. `GAME_VER=202`.

## v201 — Placa traseira nas motocicletas

- **Motocicletas com placa visível:** corrige o ponto da v200 em que a moto já recebia um número, mas a placa com texto ficava baixa e o modelo simplificado não a exibia. Agora existe suporte atrás da rabeta, afastado da roda traseira, com fundo claro e tarja azul também no modelo instanciado de longa distância.
- **Texto alfanumérico real na proximidade:** quando a moto chega perto do jogador, seu LOD detalhado mostra a mesma placa persistente de sete caracteres (`LLLNLNN` na geração automática; até sete letras/números quando personalizada). Sem placa dianteira, como na moto real.
- **Desempenho:** para não elevar muito a geometria, o orçamento adicional de motos detalhadas é limitado às duas mais próximas no Mobile e quatro no Normal, em alcance de aproximadamente 54 unidades (com histerese até 64). As motos restantes seguem com a base da placa, sem renderização individual do texto a longa distância.
- **Integração:** não altera a edição de placa na oficina nem a persistência no save/garagem já presentes na v200. Não mexe na física, no tráfego, nos pedestres ou nos NPCs das sacadas. `GAME_VER=201`.
- **Validação:** `node --check` passou; testes isolados de placa, suporte da moto, preservação das placas de automóveis e limite de LOD passaram. Não substituem um teste visual de jogabilidade.

## v200 — Ajustes de posição das placas por modelo

- Placas traseiras/dianteiras reposicionadas por modelo, inclusive SUV, caminhão, ônibus e carros especiais. A partir desta versão, a moto já recebia placa traseira no modelo detalhado, com as limitações de visibilidade corrigidas na v201.

## v199 — Placas alfanuméricas e personalização na oficina

- Removida a tarja preta do modelo antigo de placa. Carros novos recebem texto aleatório no padrão brasileiro de sete caracteres `LLLNLNN`; as letras e números são desenhados em textura sobre a base branca e faixa azul.
- Oficina de tuning inclui `PLACA → EDITAR PLACA`, usando o input reaproveitado do terminal. Aceita até sete caracteres alfanuméricos, em maiúsculas, sem obrigatoriedade do padrão aleatório para a edição manual.
- O número da placa é persistido no veículo atual, na garagem e no save.

## v198 — Ajuste do pânico dos motoristas

- Motoristas assustados pela arma à mostra mantêm o trajeto viário, aceleram forte, ignoram semáforos e buscam desviar de carros, com ultrapassagem no mesmo sentido quando segura. Evitam a fuga em linha reta da v197, que fazia veículos baterem em muros. Cancelas de pontes continuam sendo respeitadas.

## v197 — Motoristas em pânico ao ver arma à mostra

- **Carros civis fogem de armas:** usa o mesmo gatilho do pânico dos pedestres (`GUN.has`, a pé no mundo aberto). Exibir uma arma, incluindo granada ou bomba, já provoca fuga em veículos do tráfego num raio de 25 unidades: não é necessário atirar.
- **Fuga descontrolada:** carros de trilho próximos passam para a física existente (`toPhys`), aceleram forte, desviam e podem usar a faixa contrária, sem obedecer ao semáforo durante o pânico. As colisões físicas e danos continuam ativos; podem acontecer acidentes.
- **Escopo seguro:** exclui viaturas, veículos em perseguições, carros usados em missões, táxis/ambulâncias em serviço, veículos especiais e estacionados e o carro do jogador.
- **Recuperação:** a fuga dura 5 a 8 segundos e é mantida após esconder a arma. Depois a IA tenta reassumir uma via usando `reacquire`; se não houver uma acessível, o carro freia e pode ser removido após sair da área visível, evitando objetos sem IA acumulados. Cooldown de 17 segundos evita retrigger constante.
- **Custo:** varredura a cada 0,5 segundo, junto com a rotina existente `panicTick`. Sem assets ou dependências externas adicionais.
- **Preservado da v196:** NPCs fixos em 30% das sacadas, menus, pontes e demais sistemas. Testados sintaxe JavaScript e cenários isolados de reação, conversão para física, exclusão policial e retorno à IA; jogabilidade completa ainda requer verificação no navegador. `GAME_VER=197`.

## v196 — NPCs em cerca de 30% das sacadas

- **Figurantes nas sacadas:** prédios residenciais com sacadas agora podem receber NPCs em aproximadamente **30% das sacadas geradas** no mapa. A chance é avaliada por sacada, mantendo distribuição espalhada sem lotar todas as fachadas.
- **Reaproveitamento leve:** usa o sistema existente de sprites de pedestres, mas em um modo fixo de figurante (`fare` + `fixed`) para evitar custo de IA de caminhada. Eles apenas ficam parados na varanda, olhando para fora.
- **Posicionamento correto:** cada NPC é colocado exatamente sobre a laje da sacada correspondente, com altura travada no andar da varanda. A sombra no chão é ocultada para não parecer que o personagem está na calçada.
- **Escopo:** nenhuma mudança em tráfego, missões, interiores, granadas, pontes ou densidade dos pedestres de rua. `GAME_VER=196`.

## v195 — Pedestres fogem de granadas

- **Fuga da granada:** assim que uma granada é lançada, pedestres civis num raio de 18 unidades ao redor do objeto entram no mesmo estado de fuga (`flee`) usado quando veem uma arma na mão do jogador. Eles correm para longe da posição da granada, durante o voo e enquanto está no chão aguardando a explosão.
- **Prioridade da ameaça:** mesmo um NPC que já estava correndo do jogador muda a rota para se afastar da granada próxima. Cada NPC reage uma única vez a cada granada, evitando reiniciar sua animação/temporizador a cada quadro. Quem se aproximar depois também pode reagir.
- **Reutilização:** mantidos velocidade, temporizador, colisões, guarda-chuvas e balões de fala existentes; frases de alerta específicas para granadas. Policiais, personagens fixos e estados especiais continuam com as mesmas exclusões da fuga de armas.
- **Escopo:** não altera o arco, duração de 5 segundos após pousar, danos/explosões, cancelas ou restante do gameplay. Verificação de proximidade limitada a ~3 vezes/s por granada. `GAME_VER=195`.

## v194 — Cancelas da ponte levadiça na faixa correta

- **Inversão das cancelas de segurança:** corrigida a posição lateral do poste e da haste nas duas cabeceiras da ponte levadiça. Cada cancela agora ocupa a faixa que **entra** na ponte (não a contramão), conforme os offsets de faixa usados pelos veículos.
- **Colisão e animação:** o colisor acompanha a nova posição da haste e a verificação de carros usa a faixa correta; invertido também o sinal da rotação para que as hastes continuem subindo, e nunca atravessando o asfalto.
- **Escopo:** sem alterações em IA, temporizador, velocidade de fechamento, regras de pedágio, geração de cidade ou outras mecânicas. `GAME_VER=194`.

## v193 — Cancelas de segurança, bombas, pedágio independente e ícones transparentes

- **Pontes levadiças:** duas cancelas sem cobrança nas cabeceiras de acesso, em suportes à direita e fora da pista, cada braço cobrindo apenas o sentido de entrada. O tráfego automatizado freia antes da cancela. Ao iniciar a subida, as barras descem e há pelo menos **5 segundos de aviso** antes de a folha começar a levantar. Se houver carro ou jogador sobre a parte móvel, a subida é adiada até a travessia estar livre. Ao baixar totalmente a ponte, as cancelas abrem e os veículos podem retomar. Colisores das barras são desativados quando levantadas, e o suporte não ocupa as faixas.
- **Pedágio da micro-ilha:** cada cancela passa a abrir independentemente pelo carro que pagou em seu lado ou pelo NPC que concluiu sua parada. Não abre mais ambas por uma única cobrança. Cancelas do pedágio e da indústria operam aproximadamente **três vezes mais lentamente**; as barras novas da ponte usam velocidade proporcional.
- **Ícones do mapa/radar:** sem medalhão preto, sem anel ou disco de fundo; símbolos recuperam o tamanho e a paleta vivos anteriores, mantendo pictogramas internos refinados. A missão **!** foi redesenhada como glifo amarelo com contorno para alto contraste. O indicador de Império permanece.
- **Granada e bomba programada:** além de `blastAt`, ambas usam a ignição e o ciclo `fireTick`/`explode` para fazer carros e motos num raio próximo explodirem, independentemente do HP inicial. O dano comum por explosão fora dessa área é preservado.
- **Bomba remota:** discar **1** no teclado do celular aciona a mesma sequência da Agenda; o LED vermelho de cada carga pulsa independentemente usando material emissivo próprio, sem criar 30 fontes de luz.
- **Placas de bairro:** mantida a v192, levando placas de todas as pontes para as calçadas terrestres e recalculando as setas após o deslocamento.
- **Validação:** verificação sintática e testes isolados de lógica (não substituem um teste de jogabilidade no navegador). `GAME_VER=193`; saves ainda não são compatíveis entre builds.

## v192 — Placas de bairro em terra firme nas pontes comuns

- **Todas as pontes:** a mesma realocacao feita anteriormente nas levadicas agora procura as placas das pontes convencionais (incluindo travessias fluviais comuns) e as leva para a calcada de acesso em terra firme. Os postes e a extensao dos paineis deixam de nascer sobre o vao ou acima da agua.
- **Escolha de margem:** o deslocamento prioriza a cabeceira mais proxima e, se ela ainda estiver sobre um trecho de rio, avanca pela avenida ate encontrar uma calcada seca e ligada a uma rua existente. Quando nenhuma margem terrestre e valida, a placa desse ponto nao e criada, evitando flutuacao. As placas urbanas distantes das pontes continuam onde estavam.
- **Setas recalculadas:** posicao geografica do poste e dos destinos (Praia, Centro, Industria) so e avaliada depois de definir o novo ponto, mantendo angulos e indicacoes consistentes com a margem escolhida. Em encruzilhadas com avenidas nos dois eixos, prioriza a orientacao da ponte real.
- **Escopo:** nenhum modelo de ponte, guarita, transito, rio ou mecanica de gameplay foi modificado; preservadas todas as funcoes da v191. `GAME_VER=192`; saves sujeitos a compatibilidade entre versoes.

## v191 — Ponte levadiça obrigatória, guaritas externas e placas afastadas

- **Pelo menos uma ponte levadiça por cidade urbana (Mobile/Normal):** o gerador sempre reserva um rio no Mobile (antes havia 15% de chance de nenhum), escolhe e protege uma travessia transversal real ainda na fase do grafo da seed, antes de dividir os lotes. A via escolhida vira avenida de quatro faixas antes de calcular faixas e tráfego; o seletor prioriza essa ponte e tenta uma segunda quando houver outra posição válida. O sorteio usa RNG local derivado da seed, preservando a repetibilidade. Point Haze, cujo mapa não possui rios, mantém sua exceção intencional.
- **Guaritas corrigidas:** invertido o lado lateral de cada cabeceira para o **lado direito de quem se aproxima**, e reposicionadas perto das extremidades da travessia. Ambas ficam inteiramente **fora do parapeito/calçada**, suspensas em vigas sob a borda do tabuleiro, sem colisores na pista que pudessem causar acidentes. O atendente permanece visível.
- **Interação a pé:** <kbd>E</kbd> (ou controles equivalentes) continua acionando a ponte a partir da calçada ao lado da guarita, sem ser necessário entrar na cabine pendurada. O acionamento a partir do meio da pista não alcança a cabine.
- **Placas direcionais:** postes e painéis gerados sobre a ponte levadiça ou perto das guaritas são realocados para uma margem terrestre, afastados do trecho móvel. Continuam indicando Praia/Centro/Indústria conforme a cidade.
- **Validação:** `node --check` do JavaScript principal; simulação isolada do grafo fluvial, reserva e seleção de ponte em **6.000 combinações** (3.000 seeds para cada tamanho) sem uma única cidade urbana sem ponte, incluindo verificações geométricas de placas, lados das guaritas e acesso pela calçada. A execução gráfica completa no navegador não foi validada neste ambiente.
- `GAME_VER=191`. Base: v190 com bomba programada e demais sistemas preservados. Saves de outras versões continuam incompatíveis conforme a política do jogo.

## v190 — Bomba programada (C4) acionada pelo celular

- **Nova arma: BOMBA PROGRAMADA** no inventário, roda de armas e tecla **7**; selecionável também em touchscreen e gamepad, como as demais. Aplica a animação e o som do soco ao plantar; apenas a pé. Pacote 3D pequeno cinza-oliva, cinta escura, placa e LED vermelho, com geometrias e materiais compartilhados.
- **Fixação:** procura um colisor de edifício a até 3,2 metros na direção apontada, fixando na face da parede; se não houver, põe no chão à frente. Permite diversas cargas na mesma área (pequeno afastamento apenas visual).
- **Agenda do celular:** com pelo menos uma bomba plantada, aparece o contato dinâmico **BOMBA REMOTA**. Selecioná-lo inicia a detonação das cargas plantadas **na ordem de instalação**, com **1 segundo de intervalo**. A primeira detona imediatamente e o contato some após todas serem detonadas ou descartadas; novo plantio reativa o contato.
- **Alcance/mundos:** cada carga compara sua distância ao jogador com o limite `scene.fog.far` vigente no instante da detonação; fora do horizonte visual, ela **desaparece sem explodir**. As cargas não atravessam mudanças de mundo (Modern/Synthwave, Point Haze, Upside Down), seed ou regeneração: são removidas sem efeito na troca, inclusive se houver uma sequência ativa. Os explosivos plantados não são persistidos em saves, somente a munição.
- **Explosão:** reutiliza `blastAt` da bazuca e da granada (dano em carros e NPCs, fogo, consequências policiais, som, partículas e câmera). Não cria novo sistema de dano.
- **Munição:** 3 bombas sem mochila / 30 com mochila, pela função `ammoCap` atual; gastas no plantio. Colecionável garantido no cemitério, ocorrência rara no loot, e cheat `UZUMYMW` entrega 3.
- **Escopo:** conserva os registros, o menu compacto e as funcionalidades anteriores. `GAME_VER=190`.

## v189 — Granada arremessável reutilizando soco, bazuca e inventário

- **Nova arma: GRANADA** no ciclo e na roda de armas, seleção direta pela tecla **6**, com disparo no clique, botão mobile ou gamepad como as demais armas. Arremesso apenas a pé.
- **Animação:** reutiliza `MELEE.t` / `MELEE.d` e `swingSnd()` do soco, com a mesma mão animada na câmera em primeira pessoa. Segurar disparo não arremessa novas granadas automaticamente.
- **Modelo:** granada de mão ovalada verde-oliva, aproximadamente metade do corpo da pistola pequena; tampa e argola metálicas. Geometria e materiais são compartilhados entre coletáveis e objetos arremessados.
- **Física:** lançamento em arco balístico com velocidade horizontal, impulso vertical e gravidade. Ao tocar solo, água ou obstáculo, permanece parada; o cronômetro de **5 segundos começa somente depois de pousar**.
- **Explosão:** chamada à função existente `blastAt` da bazuca, preservando raio, danos, partículas, fogo em veículos e postos, vibração, câmera e consequência policial.
- **Obtenção:** coletável garantido no cemitério; aparição rara entre demais armas distribuídas no mapa; o cheat `UZUMYMW` também entrega três granadas. Munição compartilhando o limite do tipo explosivo: 3 sem mochila, 30 com mochila; salvo normalmente no inventário da personagem.
- **Limpeza:** arremessos ativos são apagados junto com os foguetes quando a cidade é reconstruída. Nenhuma biblioteca ou arquivo externo adicionado.
- `GAME_VER=189`. Base integral: v188.

## v188 — Ponte, conversíveis, telhados, ícones e dupla após a história

- **Ponte levadiça:** guarda a IA dos veículos que ficam sobre a folha quando sobe; ao fechar completamente, restaura direção e retomada sem remover carros diante do jogador. A fila do tráfego sobre trilhos detecta obstáculos adiante, inclusive carros físicos, desacelera progressivamente e freia com maior margem.
- **Conversíveis:** passageiros em sprites passam a aparecer tanto no `conv` quanto no `roadster` no tráfego; ao roubar um deles, os ocupantes podem sair. A exibição é limitada a veículos com motorista NPC.
- **Antenas residenciais:** parabólicas passaram da borda lateral abaixo do telhado para um suporte sobre a cumeeira, com base e altura coerentes com a cobertura.
- **Mapa e minimapa:** desenho renovado dos pictogramas em medalhões discretos com contorno de cor, brilho e símbolos de cassino/danceteria mais elaborados. Permanecem no raio original, com ponto de estado do Império visível. Marcadores de cassino e danceteria foram separados nas entradas frontal e traseira do mesmo lote. Casa, oficina, postos de combustível e itens desconhecidos do radar seguem o estilo. Ícones 3D de missões usam margem interna para não recortar o contorno.
- **Jason e Lucia:** após os créditos da missão do modo história, garante o NPC do personagem não controlado ao lado do jogador na casa segura; mantém Alt para troca e E para sair juntos, seguir, embarcar e dividir motorista/atirador, como já implementado.
- **Registros:** permanece o limite de altura e rolagem existente, sem mudanças.
- `GAME_VER=188` (saves exclusivos desta versão). Base: pacote integral v187.

## v187 — Rodapé do menu inicial em uma única linha

- **Menu inicial:** CONFIGURAÇÕES, MONITOR, CARREGAR SAVE e GERAR NOVA CIDADE alinhados na mesma linha, nessa ordem. Removida a segunda fileira de ações, reduzindo a altura da janela central sem ocultar as opções de geração, seed ou carregamento.
- **Responsividade:** em telas com largura de até 600 px, o rodapé se adapta a 2 × 2 para impedir cortes de texto. Controles adicionais exibidos condicionalmente, como tela cheia e save legado do navegador, continuam acessíveis.
- **Menu durante a partida:** preservado integralmente o layout compacto 2 × 2 (CONFIGURAÇÕES / REGISTROS; MONITOR / SALVAR JOGO) da v186.
- **Escopo:** somente layout CSS da tela inicial, atualização da etiqueta estática de versão e `GAME_VER=187`; lógica de geração, save, gameplay, desempenho e mundo inalterada. Saves continuam sujeitos à compatibilidade por versão definida pelo jogo.

## v186 — Registros de diálogos e estatísticas; menus reorganizados

- **Menu inicial mais baixo:** removidos os botões COMANDOS e BENCHMARK do rodapé; MONITOR agora fica à direita de CONFIGURAÇÕES. Preservados a criação de cidade, o campo de seed, o carregamento e os demais elementos. Espaçamentos verticais reduzidos sem ocultar controles.
- **Configurações → Geral:** COMANDOS alinhado à borda esquerda do conteúdo; RESTAURAR PADRÕES à direita. Ao fechar Comandos, retorna à aba Geral. Continua disponível o atalho de ajuda já existente.
- **Configurações → Gráficos:** BENCHMARK movido para a parte superior da aba, com a restrição anterior de somente poder iniciar antes de começar uma partida. Fechar a escolha de benchmark retorna à aba Gráficos.
- **Menu durante a partida:** o botão COMANDOS virou REGISTROS; mantido o retângulo 2 × 2 do menu compacto v184, com CONFIGURAÇÕES / REGISTROS na primeira linha e MONITOR / SALVAR JOGO na segunda.
- **Registros → Diálogos:** últimos 10 balões emitidos por NPCs visíveis pela câmera, mesclados cronologicamente com as falas exibidas pela barra de conversas de missões (`dlgOpen`/`dlgNext`). Cada linha registra o autor (incluindo vendedor, policial, NPC aleatório e personagens nomeados quando possível), o texto, a categoria e a hora do jogo. Captura feita **somente no nascimento do balão ou quando uma nova linha da conversa é exibida**, sem custo por quadro e sem inserir HTML dos diálogos.
- **Registros → Estatísticas:** `Quantidade de vinis coletados: X / 15`, obtida diretamente de `VINYL.got`; reflete progresso real, inclusive após abrir um save.
- Os últimos 10 diálogos também são preservados em `records` no `.psave`; salvamentos antigos sem esse campo são aceitos pelo código de leitura, sujeitos às regras usuais de compatibilidade entre versões.
- Mantidas integralmente as correções de sprites com `SpriteMaterial` nativo (v184), o desempenho das portas antigas (v182), o gerador de passagens e vinis (v185), a proteção de rios e a distribuição dos edifícios especiais.
- `GAME_VER=186`. Arquivo principal validado com `node --check` e layouts verificados em navegador para desktop e 800×480; teste gráfico completo com geração de cidade não executado.

## v185 — Coletáveis entre prédios e corredores transitáveis

- Corrigida a distribuição de 15 vinis em seeds como `1355799981` e `2893741180`: antes o sistema só examinava posições perto de contêineres em becos raros. Agora gera candidatos também no eixo livre dos becos sem contêiner e **entre fachadas de prédios efetivamente construídos**, verificando água, altura do solo e colisores ao redor de cada posição. Mantida separação mínima entre vinis de 28 m, inclusive os fluviais.
- Recuo interno dos prédios comuns aumentado: passagens entre edifícios adjacentes mais largas, sem invadir a calçada ou mudar dimensões do quarteirão. Parte dos becos explicitamente reservados deixa de ser criada (probabilidade reduzida de 30% para 20%); os que permanecem mantêm sua largura original para permitir circulação; casas, hospital, banco, aeroporto, cemitério e reserva de especiais não foram alterados.
- Armas, coletes, kits e dinheiro também podem surgir pontualmente nas passagens abertas, com IDs por seed, distância mínima de outros itens e limite de quantidade para evitar custo extra.
- Removidas chamadas redundantes de `toNonIndexed()` nos dois icosaedros já não indexados, evitando os dois avisos da Three.js. Promises de áudio canceladas intencionalmente durante `pause()/load()` (`AbortError`) não disparam fallback indevido da rádio. A mensagem do banner PWA é informativa: o aplicativo já captura o evento de instalação para oferecer o próprio botão, não um erro fatal.
- Preservadas a correção dos sprites usando cor nativa do material (v184), o menu compacto, o sistema de reservas individuais dos especiais e a proteção dos rios. `GAME_VER=185`.

## v184 — Sprites sem shader customizado ao regenerar mundos

- Substituída exclusivamente a injeção do uniforme `actorLight` via `onBeforeCompile` em `makeActorLitSprite()` pelo uniforme nativo `SpriteMaterial.color` do Three.js.
- Preservado o cálculo de luz suavizada dia/noite, iluminação local e testes de sombra nos pés/cabeça; resultado aplicado por sprite no momento do desenho.
- Fantasmas e sprites especiais preservam cores próprias via `actorTint`, multiplicado pela luz calculada sem modificar shaders.
- Objetivo: eliminar fragilidade do cache de shaders personalizados durante a reconstrução dos mundos (Synthwave, Upside Down, geração), especialmente com sombras ativas.
- Mantido integralmente o menu compacto da v183 e toda a geração de cidade da v182. Sem novas funções de regeneração.
- Sintaxe e testes isolados verificados; a transição visual em HTTPS permanece pendente de verificação em navegador real.
- `GAME_VER=184`; saves continuam exclusivos da versão.

## v183 — Menu compacto durante partida

- Janela do menu durante a partida reduzida para a area ocupada pelo titulo e os quatro botoes, com pequena folga lateral.
- CONFIGURACOES, COMANDOS, MONITOR e SALVAR JOGO em retangulo uniforme 2×2, com largura/altura iguais e layout responsivo.
- Menu inicial preservado integralmente: gerar cidade e carregar save continuam disponiveis so antes de iniciar uma partida.
- Nenhuma alteracao de gameplay ou de regeneracao/shaders de sprites nesta entrega. O diagnostico dos sprites esta em andamento.
- `GAME_VER=183`, saves por versao.

## v182 — Menu de partida seguro (sem reiniciar a cidade dentro da mesma pagina)

- Ao abrir o menu **durante uma partida**, aparecem apenas **CONFIGURAÇÕES e COMANDOS** na linha de cima e **MONITOR e SALVAR JOGO** na linha de baixo; SALVAR fica alinhado ao lado direito de COMANDOS, com uma distancia maior entre MONITOR/SALVAR. As restrições anteriores de quando é permitido salvar continuam valendo.
- **GERAR NOVA CIDADE**, **CARREGAR SAVE**, **SAVE ANTIGO** e os campos de seed/tamanho/hora inicial não aparecem na partida. Ações de regeneração/carregamento pelos controles do menu também são bloqueadas enquanto `played=true`, incluindo leitura assíncrona de .psave iniciada anteriormente.
- Para jogar outra seed ou carregar .psave, atualizar a página com **F5** e usar o **menu inicial original**, que não foi reorganizado. O fluxo de modo História/Livre e os botões da tela inicial seguem iguais.
- Fechar o menu não reinicia a cidade silenciosamente caso haja divergência no estilo selecionado. As transições de mundo internas à gameplay (portais, viagem temporal) e o Benchmark de menu inicial não foram alterados.
- Este bloqueio evita o caminho identificado de invisibilidade dos sprites após regenerar ou carregar uma cidade em HTTPS na mesma página. **Não é correção do defeito de shader em todos os caminhos internos.**

## v182 — Downgrade pontual das portas dos prédios para v166

- **Regressão de desempenho (seed `1355799981`):** a v181 melhorou o FPS com culling de portas, porém ainda havia queda para 60–65 FPS ao mirar determinados quarteirões densos. As portas animadas adicionadas na v167 e refinadas na v175 acrescentavam vários meshes independentes, materiais e o plano preto em cada entrada.
- **Reversão exata da mecânica:** retornado o registro de portas (`regDoor`) da v166, **antes da adição das folhas 3D e do fundo preto**. As entradas voltam a ser apenas detalhes estáticos existentes nas fachadas combinadas, sem `THREE.Mesh` individual por porta, moldura preta ou sombras/atualização de abertura.
- **Pedestres preservados no comportamento anterior:** continuam entrando e saindo pelos pontos registrados. Removidos apenas os estados de espera introduzidos para aguardar a animação das portas; movimento restaurado ao comportamento v166. Missões, assaltos, acesso aos telhados e outros sistemas continuam usando os mesmos registros de portas.
- **Proteção de recursos:** nenhuma função nova foi criada; removidos os recursos compartilhados e a chamada de tick das portas animadas. O restante da v181 (geração, sementes, especiais, rios, sprites, UI, pontes e draw distance) permanece inalterado.
- **Versão:** `GAME_VER=182`. Este patch não garante FPS específico sem teste gráfico no navegador na seed indicada.

## v181 — Otimização local de portas em regiões densas

- **Diagnóstico:** na seed `1355799981`, na quadra `47.04, 272.67`, ocultar o chunk `0,1` restaurou 75 FPS e deixou cerca de 779 draw calls. Isso comprova custo de renderização do chunk, **não identifica individualmente o componente**.
- **Otimização conservadora de portas:** cada prédio/casa usa molduras e folhas independentes que permaneciam desenhadas com sombra mesmo a grandes distâncias. Essas peças pequenas continuam existentes, interativas e animadas, mas deixam de lançar sombras individuais; as portas ficam ocultas visualmente apenas a mais de 100 m da câmera (68 m no mobile), reduzindo draw calls sem alterar geometria fundida ou o número de quarteirões.
- **Preservação:** nenhuma modificação nos algoritmos de sementes, prédios, fachadas, texturas, lotes comuns ou especiais, rios, micro-ilha ou aeroporto. Só as rotinas existentes `regDoor` e `cityDoorTick` e `GAME_VER=181` foram alteradas no HTML.
- **Limitação:** não foi medido o FPS real no navegador na seed indicada. Se não houver melhora, é necessário separar o custo das malhas estáticas do chunk e de outras entidades — este patch não afirma ter provado que as portas são a única causa.

## v180 — Draw distance alinhada à névoa

- **Distância de desenho:** câmera e recorte 3D seguem o `scene.fog.far` em tempo real. Na cidade Moderna, o padrão passa de 740 m para **608 m** (fim da névoa a 600 m, com margem mínima de segurança). Durante chuva, tempestade e eventos que aproximam a névoa, o recorte acompanha o novo limite.
- Projeção atualizada só quando o alcance muda de faixa de 8 m para evitar trabalho por quadro. A esfera do céu é reposicionada para ficar atrás do recorte visível, evitando esconder geometria no horizonte.
- **Não muda** a névoa visual, gerador de cidades/seed, lotes especiais, pontes, colisões, alcance das sombras, física, instâncias ou cachês de recursos. O FPS resultante precisa ser medido no jogo; reduzir o alcance não garante por si só a eliminação de 2.047 draw calls.
- `GAME_VER=180`, com saves exclusivos desta versão.

## v179 — sprites preservados após gerar outra cidade (sombras / HTTPS)

- **Causa identificada na v175–178:** `actorRefreshPrograms()` percorria toda a cena e descartava os materiais de todos os sprites **duas vezes** durante o aquecimento da GPU. Esse comportamento não existia na v174 e podia interferir nos programas de shader compartilhados quando se gerava outra cidade sem atualizar a página. Removidos a função e os dois chamados, sem introduzir novo sistema de renderização; a preparação normal do Three.js continua ativa.
- **Cronômetro de iluminação:** `generateCity()` zera `simT`, mas o sprite de Jason/Lucia permanece entre gerações. `actorLighting0()` agora detecta o retorno do relógio a zero e reinicializa `last`, `next`, `shade` e `shadeS`, impedindo que a interpolação da luz/sombra fique travada no tempo da cidade anterior.
- **Monitor (F3):** a linha logo após “medido de dentro do jogo (estimativa)” exibe **X, Y, Z do jogador** com duas casas decimais. A altura Y acompanha chão/salto a pé e o veículo ou helicóptero quando embarcado; atualiza no mesmo intervalo do monitor para ajudar no debug sem custo extra por quadro. Ao lado das coordenadas, o pequeno botão **COPIAR** copia somente os três números no formato `X,Y,Z` (exemplo: `497.40,0.20,598.80`), sem letras ou rótulos. Usa a API de clipboard em HTTPS e um fallback para HTTP.
- **Preservado:** sombra suavizada da v175 (amostragem em duas alturas, interpolação gradual, luz dos postes), materiais de cada sprite, texturas dos personagens e proteção de `drawRange` após o warmup.
- **Escopo:** somente essas rotinas e `GAME_VER=179`; não foram modificadas a geração de cidades, lotes em L, regra de 1 quarteirão por especial (exceto cemitério/aeroporto), rios, micro-ilha, pontes ou gameplay.
- **Validação:** testes isolados do relógio de iluminação, verificação das chamadas de descarte e sintaxe JavaScript. **A reprodução visual completa em HTTP e HTTPS ainda precisa ser conferida no navegador do jogo.** Em HTTPS, confira que o menu mostra `v.179` e atualize o cache da PWA caso continue carregando uma versão antiga.

## v178 — Ponte estaiada na micro-ilha e ruas de duas mãos

- Corrigida a estrutura da ponte estaiada quando gerada em ruas estreitas, especialmente na ponte com pedágio para a ilha do DeLorean. A via `ISLE_TWO` era classificada como `two` por `lineType()`, fazendo a estaiada usar 7,5 m, embora o tabuleiro da ponte tenha a largura física `RW=16` m, assim como os arcos. Agora pilares, cabos e âncoras acompanham os **16 m do tabuleiro**, independentemente da classificação da rua.
- A travessa superior passa a alcançar as extremidades dos próprios pilares, sem ficar desconectada deles. A altura do mastro e o número de estais não mudaram.
- **Alteração isolada:** não foram modificados os algoritmos de cidades, rios, micro-ilha, aeroporto, banco, especiais ou a classificação de pistas. Geração determinística e regra de um quarteirão por especial (exceto cemitério e aeroporto) preservadas.
- Versão `GAME_VER=178`; saves específicos desta versão.

## v177 — Correção de quarteirão e estrada atravessando o rio

- **Seed de regressão:** `4080619258` (cidade Normal). A condição que proibia juntar células de rio com lotes terrestres ficou acidentalmente dentro de um comentário (`//`) na linha de fusão de quarteirões da v176. Isso permitia ocupar células alagadas e reativar trechos indevidos de estrada.
- **Correção mínima:** restaurada a verificação `if(cells.some(c=>city.riv.has(c[0]*1000+c[1])))continue;` antes de remover qualquer trecho de rua ou combinar os lotes. Nenhum algoritmo de rio, ponte, ilha ou seleção de especiais foi substituído.
- **v176 preservada:** a regra de especiais de **um quarteirão sempre que houver disponível**, exceto cemitério e aeroporto; banco com lote individual, lotes comuns de 2 e ocasionalmente 3 quarteirões em L, micro-ilha e o ajuste automático de seed continuam com o código original intacto.
- Saves da versão **v177**, seguindo a política de `GAME_VER` exclusivo.

## v176 — Lotes, especiais e micro-ilha

- **Banco sem calçada:** no fim do planejamento da cidade, uma linha recortava o lote do banco de 60×60 para 37×37 m. Como calçada e chão são desenhados a partir do lote, sumiam. O recorte foi removido.
- **Especiais em 1 quarteirão:** todos os marcos (arranha-céu, prefeitura, hospital, universidade, estádio, banco, supermercado, shopping, delegacia, postos) e os especiais (cassino, concessionária/posto, oficina, casa segura) agora escolhem 1 quarteirão sempre que houver um livre, em qualquer tamanho de cidade. Antes isso só valia no mobile (7×7), e no desktop alguns preferiam lotes maiores. **Exceções:** o cemitério continua preferindo lote fundido e o aeroporto mantém prioridade pelo lote grande.
- **Lotes comuns:** residenciais, prédios e indústrias continuam podendo ocupar 2 quarteirões. Agora, às vezes, também ocupam 3 em **L**, só nesse formato.
- **Micro-ilha:** o 1º quadrante continua inteiro para a casa e a garagem do DeLorean. Os outros três viram 4 lotes cada, do tamanho de um lote residencial comum (antes eram lotes de ~26 m e as casas ficavam gigantes). A frente de cada casa vira para a borda mais próxima.
- **Seed que não fecha o plano:** se faltar espaço para um especial obrigatório, o jogo tenta a seed seguinte, até 6 vezes, e avisa ("SEED AJUSTADA"). Se mesmo assim falhar, o jogo para em vez de continuar com uma cidade pela metade (era isso que deixava o mundo "gerar mesmo assim" com coisas estranhas).

## v175 — Sprites, sombras e portas

- **Sprites sumindo ao recriar a cidade (com sombras ligadas):** o material do sprite do jogador sobrevive entre cidades, e o aquecimento da GPU compila uma variante de noite (23h) além da do horário escolhido. Ao trocar de cidade, os pedestres antigos são descartados e o programa de shader compartilhado podia ser apagado na GPU enquanto o jogador ainda o usava. Desligar as sombras forçava um programa novo, por isso "consertava". Agora, depois de cada geração ou aquecimento, os materiais dos sprites são descartados e recompilados limpos. O cálculo de luz do sprite também ficou protegido contra erro e contra valores inválidos.
- **Luz do sprite suave de dia:** a sombra do sol é testada nos pés e na cabeça. Perto da borda da sombra o sprite fica em meia sombra, e a transição dura ~0,25 s, em vez de virar de uma vez. Postes e céu continuam rápidos. O jogador é testado com mais frequência.
- **Portas:** as folhas agora cobrem o vão inteiro. Antes eram 1 m de porta para 2 m de fundo preto. Elas abrem para dentro e somem atrás do fundo preto, que passou a ficar na frente da porta pintada na fachada. Prédios têm porta dupla de 2 m; casas, porta única de ~1,1 m com maçaneta.
- Jet ski do tráfego do rio não tenta mais adicionar um piloto vazio à cena.

## v174 — Legenda do mapa ajustada

- A legenda não é mais desenhada sobre o canvas usando espaçamentos multiplicados por 3 com colunas estreitas. Passou a ser um painel lateral independente, responsivo, limitado à tela e com rolagem própria.
- **M** abre/fecha o mapa; **L** alterna a exibição da legenda **somente com o mapa aberto**. Mapa abre com a legenda oculta. ESC continua fechando o mapa.
- Botão de legenda visível ao abrir o mapa, também acessível por toque no mobile. Botão ✕ fecha apenas a legenda.
- No desktop, os símbolos/textos são grandes, com quebra de linha e scroll; no mobile, preservam dimensão reduzida.
- O mapa não é redesenhado ao percorrer a legenda, e os demais símbolos da v173 são preservados.
- Versão `GAME_VER=174` (saves próprios desta versão).

## v173 — Inicialização e ícones: correção do congelamento

- Corrigida a regressão da v172 que apagou a função `drawMissionIcons()`, usada continuamente pelo minimapa e pelo mapa principal. A ausência causava `ReferenceError` durante o desenho da tela.
- Recriados os auxiliares `empBadge()` e `gasIconPath()` usados pelos ícones novos da v172: antes, ambos eram chamados mas não existiam, podendo interromper a renderização de ícones especiais.
- Restaurado o ícone do assalto noturno (`heist`), acidentalmente omitido na reformulação.
- Restaurado o sinal da rotação dos ícones conforme o minimapa.
- Saves exclusivos da v173 (`GAME_VER=173`). Restante das alterações da v172 preservado.

## v171 — versão no menu, áudio da falha da missão, ponte estaiada

- O título **PixelCity** no menu exibe ao lado, em texto pequeno, **v.171**; a etiqueta lê `GAME_VER` automaticamente nas próximas builds.
- Ao falhar a missão inicial por prisão/morte/afogamento, áudio de rádio (local, ambiente ou online) e sirene são desligados imediatamente, sem serem retomados durante a tela de falha. O estado de reprodução é limpo e a música recomeça somente em **ZOIO PRESENTS**, preferindo outra faixa da Flashback FM se disponível. O mesmo contexto de áudio é reutilizado, sem recriar a cidade.
- A **ponte estaiada** agora usa a largura real da via onde foi construída (avenida ou rua comum): pilares nas duas bordas, travessa superior de ponta a ponta e cabos presos perto do guarda-corpo. Altura máxima da travessa igual à crista dos arcos.
- `GAME_VER=171` (saves exclusivos da versão). Somente `index.html` e `README.md` foram alterados.

## v170 — ponte estaiada, navios e ícones do clube/garagem

- **Garagem / estacionamento:** a letra **P** da vaga foi mantida em pé no ângulo atual, mas agora fica mais centralizada dentro da vaga para leitura ao entrar com o carro.
- **Danceteria:** o ícone do minimapa passa a usar uma **taça rosa**, distinguindo melhor o clube do cassino.
- **Pontes:** adicionada uma nova variação decorativa de ponte **estaiada**. Ela entra como opção visual ao lado da ponte com arcos, respeitando a mesma altura máxima aproximada do arco; os estais usam linhas finas no mesmo espírito visual dos fios dos postes.
- **Navios cargueiros:** retrabalhado o mesh visual para um casco menos quadrado, com proa/popa mais afuniladas, convés melhor definido e superestrutura/cabine com mais detalhe, mantendo o custo low poly. A lógica de colisão, pouso no convés e contêineres continua a mesma.
- **Versão do jogo:** `GAME_VER=170`; saves próprios desta versão. Alterados `index.html` e `README.md`.

## v167 — abertura com rádio, jardim residencial e fade final

- **Modo História:** a rádio da cutscene começa junto de **Zoio Corporation Entertainment presents**, no próprio início da abertura. Não reinicia quando a câmera mostra o avião, preservando a continuidade da música.
- **Casas comuns:** a árvore opcional do jardim passa a ser posicionada na faixa frontal externa do terreno e só nasce se estiver afastada da planta efetiva da residência. Evita troncos dentro de paredes/cômodos nos lotes estreitos e orientações norte/sul/leste/oeste.
- **Créditos finais (completos ou pulados):** fade para preto, retorno da câmera para a **safe house** enquanto a imagem está totalmente escura e fade de volta ao jogo. Usa a mesma saída, inclusive pelo teclado/gamepad/botão PULAR.
- Versão do jogo: `GAME_VER=167`; saves próprios por versão. Alterados apenas `index.html` e `README.md`.

## v158 — correção do botão de alternar personagem e auditoria do Benchmark

- **Jason/Lucia:** a área clicável agora corresponde ao botão inteiro, inclusive retrato selecionado, borda e nome. Antes, somente os aproximadamente 27 px da metade oposta no Mobile funcionavam.
- Em dispositivos de toque, o botão passa de 54 × 54 px para **72 × 72 px** e responde ao fim do toque via `pointerup`. Um toque não dispara uma segunda troca por causa do `click` sintético; mouse e navegação por teclado (Enter/Espaço) também funcionam.
- Mantidas todas as restrições originais para troca de personagem (missão inicial, procurado, menus, interiores não permitidos etc.). Não muda os comandos de teclado ou gamepad.
- **Benchmark auditado:** as ondas usam os tipos de veículo já existentes, `sports` e `police`, instanciados pela função existente `makeVehicle()`, e a IA/colisão/explosão original. Nenhuma geometria ou novo tipo de carro foi criado. Essas instâncias temporárias são eliminadas ao encerrar o benchmark.
- Somente `index.html` e `README.md` alterados. Versão do jogo: `GAME_VER=158` (saves exclusivos).

## v157 — correção da HUD após usar o Benchmark

- Corrigida a regressão da HUD/minimapa: os perfis temporários do Benchmark (que ocultam esses indicadores) não podem mais sobrescrever as preferências gravadas em `ps_cfg`. A migração de volume do perfil temporário também deixa de agendar uma gravação indevida.
- Ao sair do Benchmark, restaura o estado gráfico anterior e preserva exatamente a configuração persistida antes do teste; `saveCfg()` fica bloqueado enquanto o Benchmark estiver ativo.
- Recuperação automática, ao carregar a página, de configurações antigas **idênticas** aos presets LOW/MEDIUM/HIGH que foram indevidamente salvas com HUD e minimapa desligados. Não modifica configurações manuais diferentes desses presets.
- Na entrada de uma partida normal, a visibilidade do HUD é sincronizada novamente com a preferência do jogador.
- JavaScript verificado e testes de regressão de gravação/recuperação executados. Sem alterações ao benchmark, câmeras, menu, animais ou controles.
- `GAME_VER=157`; saves exclusivos desta versão. Alterados `index.html` e `README.md`.

## v156 — Benchmark, menu e iluminação dos animais

- **Benchmark:** MONITOR deslocado apenas durante a transmissão do benchmark, abaixo do selo AO VIVO. Fora do benchmark, a posição do monitor da gameplay não muda.
- **Menu durante a partida:** o botão MONITOR fica imediatamente abaixo de CONFIGURAÇÕES, como antes. BENCHMARK continua disponível somente no menu inicial; SALVAR JOGO permanece verde e alinhado com CARREGAR SAVE.
- **Faixa de notícias:** uma mensagem contínua apresenta mínimos, médias e máximos coletados até aquele momento (FPS, CPU de thread principal, GPU relativa quando disponível, heap JS, VRAM estimada, chamadas de desenho e triângulos). A rolagem é mais lenta e o conteúdo é atualizado somente ao completar cada volta, sem saltos no meio da leitura.
- **Câmera geral do benchmark:** ângulo de aproximadamente 30° e abertura maior para mostrar o céu quando a geometria permitir. Durante as perseguições, uma viatura escolhida pseudoaleatoriamente por onda é seguida de perto em terceira pessoa, sem troca de câmera pelo jogador.
- **Resultados:** CANCELAR mostra imediatamente o relatório com todas as amostras já coletadas. CANCELAR durante a construção da cidade solicita encerramento após o carregamento, sem inventar medições.
- **Ao terminar ou cancelar:** tela de resultados e EXPORTAR .TXT; depois, VOLTAR AO MENU INICIAL restaura configurações e abre diretamente o menu, sem chamar nova geração de cidade.
- **Cães e gatos:** agora usam exatamente o mesmo shader e cálculo de iluminação dos sprites de Jason, Lucia e pedestres, incluindo sol, sombra, ambiente e postes quando ativados. Abrange também os cães dos assaltos, sem criar novas luzes nem um segundo sistema de iluminação.
- **Validações de código:** JavaScript sintaticamente válido, cinco ondas e 30 explosões, ticker, cancelamento parcial, retorno ao menu sem `startGame()` e geometria dos botões em desktop/mobile. A reprodução gráfica e a iluminação real ainda devem ser verificadas no jogo.
- `GAME_VER=156`, com saves próprios desta versão. Somente `index.html` e `README.md` alterados.

## v155 — ajustes pontuais no menu

- O botão **BENCHMARK** aparece apenas no menu inicial, antes de iniciar/carregar uma cidade; no menu durante uma partida, fica oculto. O funcionamento do benchmark não foi alterado.
- **SALVAR JOGO** continua verde e na linha superior, mas agora compartilha a posição horizontal e largura de **CARREGAR SAVE** na linha inferior, com alinhamento calculado pelo layout real, inclusive ao redimensionar a janela.
- Comandos, presets, benchmark, gameplay e demais menus preservados.
- `GAME_VER=155` (saves por versão). Alterados apenas `index.html` e `README.md`.

# PixelCity v154 — Benchmark com transmissão estilo TV

- Benchmark agora usa a MESMA função de câmera aproximada da TV, incluindo ângulo, checagem de prédios e acompanhamento do foco; usa a mesma camada visual de transmissão AO VIVO, logo e faixa horizontal de notícias. A faixa rola estatísticas reais do monitor de oito em oito segundos (média e extremos de FPS, CPU relativa, GPU quando disponível, RAM JS e número de explosões).
- Em cada onda, 1–5 suspeitos ficam na fileira da frente e 1–5 viaturas na fileira de trás, em um mesmo trecho de rua da cidade. Os veículos usam a física, IA e efeito de explosão já existentes. Cada onda explode todos os veículos no mesmo quadro: 2, 4, 6, 8 e 10, totalizando 30 explosões.
- Presets, clima e ciclo de 24 horas, monitor, exportação .TXT, snapshot de save e layout da v153 preservados.

## v153 — correção pontual das posições no menu

- Restaurada a disposição horizontal dos botões do rodapé, sem a grade em várias linhas introduzida na v152.
- **SALVAR JOGO**, verde, foi movido para a primeira linha, à direita de CONFIGURAÇÕES e COMANDOS (área vermelha da referência).
- **BENCHMARK** permanece na segunda linha, imediatamente à direita de MONITOR (área verde da referência). CARREGAR SAVE e GERAR NOVA CIDADE continuam à direita, lado a lado quando houver largura.
- Não foram alteradas as funções dos botões, os três presets nem a lógica do benchmark. Atualizado `GAME_VER=153` (saves por versão).
- Modificados apenas `index.html` e `README.md` em relação à v152.

## v152 — Benchmark gráfico, trânsito mínimo e novo menu

- O botão **SALVAR JOGO** fica em verde diretamente acima de **GERAR NOVA CIDADE**, separado dos controles de carregamento. O botão **BENCHMARK** fica à direita do botão MONITOR.
- Menu Benchmark com **LOW, MEDIUM, HIGH**. LOW: sombras, bloom, reflexos e postes OFF, resolução interna mínima segura (12%), trânsito e pedestres em 0% nos sliders. MEDIUM: perfil PC original (50% de tráfego/pedestres, resolução 100%, sombras 1×, bloom, reflexos e postes ativos). HIGH: resolução 100%, sombras 4×, iluminação completa, bloom/reflexos ativos e ambos os sliders a 100%. FPS sem limite nos três presets.
- Na cidade moderna, 0% no slider de pedestres **não zera a geração**: mantém pelo menos um pedestre ambiente. Com trânsito em 0% o jogo verifica se há ao menos um carro NPC no entorno e, se não houver, gera um em via válida. As exceções dos mundos especiais sem população (Inverted/Point Haze) permanecem.
- O benchmark gera uma cidade **Normal 14×14** em modo **Livre** e usa a **seed de referência fixa 3031265903** em todos os presets, permitindo comparar resultados. A cidade do benchmark é temporária e não substitui o save anterior; se existir uma partida em andamento, o benchmark exige conseguir capturar o estado em memória antes de começá-lo e volta a carregá-lo ao sair.
- Sequência de cerca de **88 segundos reais** (tempo de parede): câmera aérea, ciclo de 24h, nuvens fechando até chuva forte, cinco ondas de perseguições com 1, 2, 3, 4 e 5 pares de carros de suspeitos e policiais durante aproximadamente 10 s por onda, explosões individuais escalonadas dos suspeitos e viaturas usando o sistema original, e limpeza gradual do céu. Os veículos em cena ficam detalhados enquanto duram as perseguições.
- Reaproveita o **MONITOR**: amostras aproximadamente a cada 0,5 s, relatório com mínimo, média e máximo de FPS, ocupação relativa da thread principal, tempo relativo da GPU (quando `EXT_disjoint_timer_query_webgl2` é permitido), heap JavaScript (quando `performance.memory` está disponível) e VRAM estimada por malhas/texturas/buffers. **Atenção:** os percentuais CPU/GPU não são a utilização real total do hardware; o navegador não disponibiliza esse dado. Itens indisponíveis aparecem N/D, nunca números inventados.
- Tela final inclui **EXPORTAR .TXT** e **VOLTAR AO JOGO / MENU**; cancelar também restaura as configurações anteriores. O relatório registra seed, preset, configurações, metodologia e limitações. Também inclui chamadas de desenho e triângulos renderizados, para ajudar a comparar carga de geometria. As ruas das cinco cenas são selecionadas a partir da mesma seed em LOW, MEDIUM e HIGH. Sirenes e giroflex das viaturas usam os recursos existentes.
- Alterados apenas `index.html` e `README.md` da v151. A atualização marca `GAME_VER=152`, mantendo saves exclusivos da versão.

## v151 — iluminação dos postes desligada por padrão no Mobile

- Confirmado e reforçado o padrão econômico da v150: no **dispositivo mobile**, `lampLighting` começa em `false`, antes mesmo da leitura das configurações salvas; o checkbox também aparece desmarcado por padrão no HTML.
- Desativa os halos de iluminação dos postes no celular. As luzes reais de proximidade já são desativadas no mobile por otimização; a opção manual permite religar os halos.
- Uma preferência **salva manualmente** continua valendo; o padrão não apaga configurações existentes. No desktop, a iluminação dos postes permanece ligada por padrão.
- Apenas `index.html` e `README.md` foram modificados em relação à v150; sem mudanças na geração de cidade ou outros recursos. Saves exclusivos da v151 (`GAME_VER=151`).

## v150 — aviso de orientação obrigatório no mobile vertical

- A tela "Gire o celular para jogar" com o único botão "ABRIR EM TELA CHEIA" aparece **sempre** que um dispositivo mobile estiver na vertical: no primeiro carregamento, no menu, no loading, nas cutscenes ou durante a gameplay.
- O aviso é ativado ainda antes do carregamento do motor 3D, para não deixar o menu aparecer por trás enquanto as bibliotecas carregam.
- Girar para paisagem oculta o aviso automaticamente e mantém o estado anterior (não força a abertura do menu); ao voltar para vertical, reaparece.
- Durante o aviso, o loop do jogo fica pausado, evitando que a missão ou o veículo continuem se movendo invisivelmente. O botão existente continua solicitando tela cheia e bloqueio de orientação em paisagem quando permitido pelo navegador.
- Desktop e celulares em paisagem permanecem com o fluxo normal. Somente `index.html` e `README.md` foram atualizados. Saves exclusivos da v150 (`GAME_VER=150`).

## v149 — Flashback FM sintonizada no rádio original durante as cutscenes

- Pouso e créditos usam diretamente o elemento `RADIO.el`, a estação detectada em `RADIO.list`/`RADIO.srv`, `loadStation()` e `radioPlay()`, como no rádio dos veículos. Não existe um reprodutor de música separado.
- A cutscene espera a descoberta da lista de rádios terminar; a versão anterior caía para a transmissão online depois de apenas 3,5 segundos, mesmo com a pasta ainda carregando.
- Com Flashback FM disponível, ela toca independentemente da preferência de fonte de rádio escolhida pelo jogador; a estação do carro não é alterada permanentemente.
- Durante a cutscene, não é possível mudar de estação, pular música ou desligar o rádio. O fim natural da faixa ainda avança para a seguinte na mesma estação.
- Os créditos tentam iniciar uma música diferente da abertura quando a estação tem pelo menos duas faixas válidas.
- Em cada cena separadamente: se a estação local realmente não existir, os arquivos falharem ou a leitura da lista exceder 18s, tenta a KRFM online; se esta falhar, segue em silêncio. Áudio bloqueado pela política do navegador pode exigir uma interação do usuário; não é um erro da música.
- **Importante:** este pacote não contém músicas. Para tocar Flashback FM, o servidor precisa disponibilizar `radios/Flashback FM/` com arquivos suportados, através de listagem de diretório ou `radios/lista.txt`. O código da estação sozinho não é um arquivo de áudio.
- GPS e restante do jogo v148 preservados. Saves continuam exclusivos por versão conforme a política atual do jogo.

## v148 — Alvos de missão (!) e GPS; Flashback FM nas cutscenes

- Pouso de aviao e creditos usam o conteudo da pasta `radios/FLASHBACK FM/` via sistema de radios ja existente. A faixa e sorteada e os creditos evitam a mesma faixa da abertura, quando a pasta tem mais de uma.
- Cada cena pesquisa independentemente a estacao Flashback FM: se nao existir ou se a faixa falhar, tenta a transmissao KRFM online ja configurada (`LIVE_URL`); se ela tambem falhar ou nao iniciar, a cena continua silenciosa e sem travar.
- A abertura toca a partir da curva do pouso e a musica cessa no fade final; a trilha dos creditos termina ao acabar a rolagem ou ao pular. Audio e volume seguem as configuracoes do usuario, enquanto o aviao mantem seus proprios sons.
- Nenhuma nova estacao ou arquivo de musica foi incorporado; a emissora online precisa de conexao com a internet.
- Saves exclusivos da v148 (`GAME_VER=148`).

- Dentro de uma missão, o GPS permanece fixo no alvo atual e não pode ser desmarcado nem substituído no mapa. Ao mudar de etapa, a rota acompanha o novo destino.
- A exclamação (!) é independente do GPS: identifica objetivos de história, trabalhos de veículos e checkpoints de corrida no mapa e minimapa.
- Fora de missão, pontos de início de missão disponíveis mantêm o ! e uma seta dourada de direção no radar, mas marcar/remover outro destino do GPS é livre.
- A direção do ! continua visível mesmo quando o alvo está fora do recorte do minimapa, inclusive quando o GPS está desligado ou aponta para outro lugar.
- O modo Livre preserva marcação e remoção manual de destino.

## v147 — barras cinematograficas, aviao no taxi e Modo Livre apos creditos
- As barras de cinema ocupam **100% da largura real do viewport**, incluindo celular em paisagem, sem herdar a largura fixa de 210 px e as bordas do HUD. Altura `clamp(26px,10dvh,96px)`, a partir da borda superior/inferior da tela.
- O aviao permanece visivel durante todo o pouso, o taxi e o fade final. O acompanhamento da aproximacao continua usando o mesmo aviao e a mesma fisica do Modo Livre; a abertura agora mostra 5,5 s de taxi antes de escurecer, em vez de 2,5 s.
- Nos creditos ha botao **PULAR CREDITOS**, acessivel por mouse/toque, Enter, Espaco, Esc, F e A/B/Start do controle. Pular e deixar os creditos chegarem ao fim executam **a mesma rotina**.
- Ao final, `STORY.cleared` libera todos os recursos/locais de `STORY_LOCKED` e os icones do mapa. O gameplay continua com a estrutura do Modo Livre, mas a selecao segue 'Historia' e a conclusao e preservada no save. O mesmo desbloqueio vale ao carregar esse save.
- A conclusao da missao nao gera um checkpoint prematuro durante a cinematografia; o checkpoint final ocorre na liberacao da cidade. JavaScript, ZIP e testes de fluxo devem ser validados; conferencia visual e auditiva no navegador ainda recomendada.
- Saves exclusivos da v147 (`GAME_VER=147`).

## v146 — som do aviao do aeroporto nas cutscenes e no modo Livre
- O aviao do aeroporto agora compartilha o gerador de turbina `skySound(false)` dos avioes que cruzam o ceu; nenhuma amostra externa ou segundo modelo de aviao foi introduzido.
- Na abertura da historia, audio acompanha a camera durante a curva, a aproximacao, o pouso, a frenagem e o taxiamento. A turbina entra quando a cena aerea comeca e silencia nos fades e creditos. O modelo permanece visivel mesmo que Jason esteja longe do aeroporto.
- No modo Livre, o volume varia com a distancia do jogador e o estado do aviao (voo e manobras em solo). Ao trocar de cidade/estilo, a instancia anterior e interrompida, evitando som fantasma.
- Ajuste de som apenas; fisica, rota de voo, controles e demais conteudos da v145 preservados. Saves exclusivos v146. Teste auditivo no navegador recomendado.

## v145 — primeira missão, cinematografia, Lucia e correções visuais
- Cutscenes com duas barras pretas de cinema (superior/inferior), removidas automaticamente na gameplay; reuniao com Lucia mostra barras sem encobrir o dialogo inferior.
- Abertura: corrigido "Zoio Corporation Entertainment". O aviao e a mesma entidade e animação (base, final, pouso, frenagem e taxiIn) do modo Livre; a camera segue a entidade existente. Em aeroportos compactos, mantem o sobrevoo original por limitações da pista.
- Encontro na safehouse: Lucia aparece fisicamente no interior, fala "Foi difícil sobreviver na prisão mas estou bem meu amor!" e a conclusão só é confirmada ao apertar OK. Missão concluída em pixel amarelo, recompensa, tela "CONTINUA . . ." e créditos rolando sobre câmera aérea. O serviço do píer vira etapa intermediária da primeira missão.
- Setas 3D obedecem à profundidade e deixam de ser vistas através dos prédios; removido o depthTest=false forçado pela safehouse.
- Casa de penhores escondida no mapa e bloqueada na história até missão futura liberar `pawn`. Modo Livre sem bloqueio.
- NPC paraquedista ao se aproximar da praia, usando o mesmo modelo/movimento já existente e balão no carro: "Será que eu consigo saltar também?". Evita repetir continuamente.
- Preservados controles, ilhas, aeroporto grande prioritário, 15 especiais obrigatórios, estradas de terra, ponte e correções da v144.
- Saves continuam separados por versão (v145). Requer teste visual de integração nos modos Normal/Mobile.

## v144 — ponte, troca dentro de casa e preços nos postos

- Ponte levadiça: conserva a gravidade/escorregamento durante a subida. Perto dos 45° (aprox. 43°), pedestres e carros encontram uma barreira, em vez de conseguir escalar a folha como rampa. Quem estava sobre a folha desliza de volta para a dobradiça sem teleporte instantâneo.
- Jason/Lucia: alternar **dentro da casa segura** agora é sempre uma troca local; não ativa o teleporte cinematográfico nem usa coordenadas externas salvas. Preserva contexto da porta, estado de interior, roupas e inventários. A câmera TPS, com e sem arma, permanece limitada à caixa da casa.
- Postos: o totem de preços GAS/ALC/DSL ganhou colunas com limites de largura, para evitar textos sobrepostos nas telas menores e com fontes diferentes.
- Correções concentradas no código; controles, geração de seed e reserva dos especiais continuam os mesmos.

## v144 — primeira missão: abertura cinematográfica e comandos

- Ao gerar uma cidade, loading totalmente preto e opaco: a cidade não aparece atrás da barra de progresso.
- Ao iniciar **nova campanha**, independentemente da seed, hora inicial 07:00, clima sem chuva, sem tempestade e sem evento meteorológico inicial; as condições meteorológicas podem voltar a variar durante o jogo. O modo livre e o carregamento de saves não reproduzem o filme.
- Créditos centralizados em fonte pixelizada: “Zoio Corporation Entertainemnt” e, abaixo, “presents”, com fade in/out. Após o loading, câmera aérea segue o avião da aproximação final ao toque na pista do aeroporto, transição preta e revelação do jogador numa esquina do aeroporto com seu carro inicial. Reutiliza o avião e o carro existentes.
- SMS da primeira missão (carona para o píer) entregue na revelação da cena, aproveitando o sistema atual de missão, sem SMS duplicado.
- Sequência de tutoriais laranja no canto superior esquerdo: entrar no carro, acelerar, virar, faróis, rádio. Cada popup some após a ação correta ou 30 segundos; avança um de cada vez, com textos próprios para desktop/mobile.
- Comandos da v143 preservados: **F = entrar/sair**, **W/↑ = acelerar**, **A/D ou ←/→ = virar**, **H = faróis**, **E = buzina**, **Q = rádio**. No controle: direcional → para faróis e direcional ← para rádio. No mobile, os botões existentes permanecem inalterados. Os tutoriais apenas detectam essas ações.
- Aeroporto compacto de fallback: a cena usa uma aproximação de avião; o sistema normal continua operando sem pouso na pista curta.
- Save exclusivo da versão v144; gerações livres e saves carregados mantêm a inicialização existente.

## v143 — aeroporto grande prioritário e especiais expansíveis no Mobile

- **Aeroporto grande tem prioridade** também no mapa Mobile. Antes até dos marcos municipais, reserva-se prioritariamente um lote fundido de aproximadamente 136×60 m com pista longa, hangar, terminal, torre e heliponto. Caso esse lote não exista, usa-se o aeroporto compacto da v142 para garantir a presença do especial.
- **Cemitério é a segunda prioridade para lote grande**, logo depois do aeroporto. Somente com lotes grandes sobrando, universidade, estádio e shopping podem crescer. No máximo dois marcos municipais ocupam terrenos fundidos no Mobile. Os demais marcos continuam funcionando em 1 quadra; todos os 15 especiais permanecem obrigatórios.
- Aeroportos grandes usam a rotina normal de aviões (pouso, táxi e decolagem); a versão compacta mantém apenas sobrevoos. O modo Normal continua priorizando aeroporto grande.
- Mantida a prioridade **15 especiais > indústria > rural**, sem obrigar grande zona rural, e ilha do DeLorean no Normal. Mudanças no mapa para mesma seed são esperadas pela nova seleção de lotes. Saves exclusivos v143.

# PixelCity

Jogo de mundo aberto para navegador, inspirado no GTA 1: personagens em pixel art 2D exploram uma cidade 3D procedural, com veículos, física de pneus, polícia, armas, missões, interiores, rádio, clima dinâmico e segredos.

**Documentação atualizada em 6 de novembro de 2026**, a partir do código atual e das anotações de mecânicas do projeto. O nome atual do jogo e dos novos saves é **PixelCity**. A versão atual do jogo é **v148** (`GAME_VER=148`), com compatibilidade estrita de saves.

## v141 — espaçamento entre os 15 discos de vinil

- Seed de referência: `89674377`, que criava dois vinis lado a lado no mesmo beco. A geração de vinis não reduz mais a distância para zero ao tentar completar a coleção: os discos mantêm distância horizontal mínima de **28 metros** uns dos outros (inclusive entre os de rios e becos).
- O algoritmo considera agora os contêineres e ambos os lados de cada beco, testa posições alternativas e distribui os vinis por vários becos antes de repetir a localização. Mantidos os até três discos fluviais, prioritariamente afastados 90 m entre si.
- Esta regra só se aplica aos vinis: armas, coletes, kits de vida e dinheiro permanecem com a geração original. O gerador avisa no console se o mapa não apresentar posições válidas para os 15 discos, sem colocá-los sobrepostos para completar a coleção.
- Save exclusivo da v141, seguindo a política de incompatibilidade entre versões.

## v140 — micro-ilha, auditoria de marcos e cancelas

- Seed de referência `2594915299`: micro-ilha protegida de fusões de quarteirões, da seleção da indústria e das demais ocupações opcionais. Sempre que houver micro-ilha, o lote fica residencial, com quatro terrenos amplos e espaço reservado para a casa e a garagem do DeLorean.
- Cancelas industriais abrem quando jogador/veículo se aproxima a **14 m do centro** da cancela, sem abertura antecipada proporcional à velocidade; a proteção de fechamento durante a travessia permanece. A cancela do aeroporto usa o mesmo mecanismo.
- Auditoria: **os marcos obrigatórios** (arranha-céu, prefeitura, hospital, universidade, estádio, banco, supermercado, shopping, delegacia, cemitério e posto) têm reserva explícita nos mapas Mobile e Normal. Outros especiais, como o aeroporto, cassino, concessionária, oficina e a própria micro-ilha, ainda têm condições específicas no gerador e **não são garantidos em toda configuração**. A micro-ilha com pedágio é construída no Normal (14×14), não no Mobile (7×7) ou Point Haze. Foram adicionados avisos no console para marcos obrigatórios ausentes e para garagem da ilha ausente.
- Saves mantêm a regra de exclusividade por versão (`v140`).

## v142 — todos os locais especiais obrigatórios no Mobile

- Mobile 7×7: os **11 marcos** (arranha-céu, prefeitura, hospital, universidade, estádio, banco, supermercado, shopping, delegacia, cemitério e posto) e os **4 especiais antes opcionais** (aeroporto, cassino, concessionária e oficina) passam a ser reservados antes da indústria, das garagens e da zona rural. A casa segura também tem reserva.
- Marcos do Mobile priorizam 1 quarteirão de 60×60 m, evitando grandes lotes fundidos quando há quadras simples. O cemitério não exige dois quarteirões.
- Aeroporto Mobile compacto: terminal, torre, hangar, área de manobra, pista curta e heliponto dentro de uma quadra. Aviões fazem sobrevoos em vez de pousar na pista curta; o aeroporto Normal conserva a pista longa e seu ciclo de decolagem/pouso.
- Indústria vem depois de todos os especiais, com preferência por até duas quadras no Mobile se houver terreno. Apenas então são escolhidas as até **duas quadras de terra** (sem forçar uma extensa zona rural).
- A ilha do DeLorean permanece exclusiva do Normal. As posições dos prédios podem mudar para a mesma seed porque a ordem de reserva mudou.
- Gerador falha explicitamente se faltar qualquer um dos 15 tipos de especiais, em vez de entregar silenciosamente um mapa incompleto. Saves exclusivos da v142.

## Visão geral

- Jogo concentrado em **um único `index.html`**, com HTML, CSS e JavaScript.
- Renderização WebGL com Three.js; sprites, texturas e grande parte dos modelos gerados por código.
- Sem servidor de aplicação, banco de dados ou etapa de build para jogar.
- Dois tamanhos: **Mobile · 7×7** e **Normal · 14×14**.
- Cidade estática gerada por seed e pré-carregada antes da partida.
- Teclado e mouse, controle e interface de toque.
- Progresso exportado manualmente para arquivos `.psave`.

A proposta continua a mesma: ser simples, completo e divertido, preservando o visual low poly e a mistura de personagens 2D com cenário 3D.

## Como rodar

1. Baixe e extraia o pacote completo, mantendo o HTML, os arquivos PWA e a pasta de ícones juntos.
2. Abra no navegador com WebGL ou sirva o arquivo por HTTP/HTTPS em uma hospedagem estática.
3. Escolha o tamanho e a hora inicial.
4. Use **GERAR NOVA CIDADE** para sortear uma seed ou **GERAR COM ESTA SEED** para usar o valor do campo.
5. Aguarde a geração e a preparação das regiões, texturas e materiais.

O arquivo concentra o código do jogo, mas **não é um pacote totalmente offline**: bibliotecas e fontes externas são carregadas pela página. Rádio online também depende de conexão. Para usar músicas próprias, adicione arquivos em **CONFIGURAÇÕES → RÁDIO** ou disponibilize a pasta `radios/` junto ao HTML, com uma subpasta por rádio.

Servir por HTTP/HTTPS é preferível para recursos de áudio, leitura das músicas do servidor e políticas do navegador. Ao abrir via `file://`, alguns desses recursos podem ficar limitados. O navegador pode exigir um clique ou toque para liberar o áudio.

## Atualizações recentes

- **v139 — chuva nas folhas das pontes levadiças:** cada folha de asfalto ou terra agora contém uma película de chuva presa à malha que abre e fecha, com shader do piso original compartilhando uniforms de umidade, poças, céu e reflexos (sem depender da máscara 2D que marcava água sob a ponte). Asfalto usa reflexo úmido, terra conserva poças de lama; as duas recebem redução progressiva da rugosidade do material conforme chuva/umidade na posição da ponte. Os filmes são ocultos quando o solo está seco ou ao desenhar o reflexo planar, evitando realimentação; estrutura, faixas, colisão e animação mantidas. Incorporado no mesmo pacote v139 das correções dos vinis e coletáveis.

- **v139 — altura dos vinis no rio e brilho dos coletáveis:** posição inicial dos discos na água passou a usar o nível efetivo (`waterLevel`, rio/mar a `-3`) em vez de um valor fixo `+0.3`; corpo do vinil flutua a 0,85 unidade acima da água. Todas as manchas luminosas de pickups (incluindo armas, coletes, vida, dinheiro e vinis) agora são objetos separados dos respectivos ícones, fixos a 0,075 unidade acima da superfície de terra, asfalto, estruturas ou água — a mesma folga dos halos dos postes — enquanto apenas o ícone sobe e desce. Há afastamento de polígonos para evitar z-fighting, liberação correta dos halos ao recolher/remover e atualização do armamento exibido na mão, que nunca deve carregar o halo. Não foi mudada a seleção de 15 pontos por seed, mapa, lógica de coleta ou recompensas. Seed de referência: `89674377`. Saves aceitos somente da v139. Base: v138.

- **v138 — ponte levadiça em região rural:** o piso móvel agora consulta `isRural()` no centro do mesmo segmento usado pelas estradas geradas, antes de escolher o acabamento. Em trecho de terra, aplica a mesma cor (`#9a7b52` / `#4a3a40` no estilo noturno), material Standard e iluminação emissiva da estrada rural, alinha a altura do piso ao decalque de terra e omite as faixas amarelas/brancas de asfalto. Em trecho urbano, preserva o asfalto texturizado e as UVs globais da v136. Não foram alteradas as regras de escolha/posição de pontes, animação, colisões, trânsito, pedágio ou jet skis. Seed de referência: `2430619886`. Saves aceitos somente da v138. Base: v137.

- **v137 — jet skis da praia corrigidos por seed:** os pontos de jet ski estacionados passam a ser distribuídos dentro da faixa real de praia de areia (mesmo que ela ocupe apenas metade da costa), em 3 faixas na cidade Mobile ou 4 na Normal, com pequenas variações reproduzíveis da seed. Cada ponto valida navegabilidade, píeres e saída de rio; caso um ponto esteja bloqueado, procura outra posição dentro da faixa e usa uma varredura de contingência. A vaga próxima à marina é extra somente quando válida. A seed `3031265903` (costa leste, praia na segunda metade) antes tinha dois dos três pontos aleatórios fora da faixa; agora tem vagas distribuídas na praia. A detecção de novo mundo inclui o número de geração para evitar pontos antigos ao recriar a mesma seed. Os jet skis continuam nascendo apenas quando o jogador se aproxima, evitando custo permanente. Tráfego fluvial, veículos dirigíveis e demais sistemas inalterados. Saves aceitos somente da v137. Base: v136.

- **v136 — textura do asfalto nas pontes levadiças:** as folhas móveis usam agora a mesma textura procedural de asfalto e o mesmo material PBR (`MeshStandardMaterial`, rugosidade e metalicidade) do piso das ruas, substituindo o material Lambert de cor sólida. As UVs do topo são projetadas em coordenadas globais com escala de 9 m, preservando granulação, contraste, saturação e continuidade visual com a pista nas duas orientações das pontes, mesmo quando as folhas se movem. Mantidos calçadas, faixas, mecanismo, abertura, colisões, trânsito e correção do pedágio da v135. Saves aceitos somente da v136. Base: v135.

- **v135 — pedágio da micro-ilha (jet ski e lancha):** a cobrança de $10 e o gatilho de perseguição por furar a cancela só se aplicam ao jogador em veículos terrestres trafegando pela ponte. Jet ski e lancha que navegam por baixo dela não pagam nem geram nível de procurado; os dois já são classificados internamente como veículos aquáticos (`boat:true`). Pedestres e veículo flutuante também não acionam o pedágio. Mantidas a cobrança e a penalidade para carros/motos, bem como a parada dos carros NPCs nas cancelas. Saves aceitos: v135. Base: v134.

- **v134 — cela da delegacia refinada:** a cela/corredor da delegacia ganhou malha mais caprichada e mais detalhes visuais (banco, armário, salinha do guarda, molduras e iluminação adicional). A rota do policial agora faz mais sentido visualmente porque há uma porta ao fundo do corredor, alinhada ao ponto em que ele some. O buraco de fuga na parede da cela foi retrabalhado com uma textura de barro/sujeira inspirada na lama da chuva: ele começa como uma mancha discreta, cresce aos poucos durante a escavação e vai escurecendo conforme o túnel avança. Saves aceitos: v134. Base: v133.
- **v133 — casas para assalto, contêineres e tomada do Império:** entre 22h e 8h, até 15 portas residenciais sorteadas na cidade são marcadas por pontos brancos pequenos no minimapa e mapa completo; ao se aproximar a menos de 34 m, uma seta amarela indica a entrada. Mantidos os 5 interiores diferentes e a possibilidade de repetição. Os contêineres dos navios ganham registro de colisão e altura por pilha: o jogador não atravessa as caixas pelo convés, pode caminhar sobre elas após desembarcar, e o helicóptero pode pousar no topo quando estiver alto o suficiente. Depois de destruir o carro rival para tomar um negócio do Império, quatro capangas saem em sequência pela porta com metralhadoras e 30% de chance de acerto por disparo; demais confrontos não foram alterados. Saves aceitos: v133. Base: v132.


- **v132 — bancos, supercarro, helicóptero e controle:** acabamento do assento do roadster separado da lataria para eliminar z-fighting; supercarro da concessionária preserva aceleração original, porém não possui luzes de viagem (barras laterais e esfera dianteira) nem viaja ao Synthwave. O recurso temporal é exclusivo de veículos com `special=true` (modelo secreto da ilha/garagem). Save do veículo agora registra `special` para distinguir o supercarro comum do especial ao carregar. Helicóptero aceita R2/L2 e analógico esquerdo, Y pousa/desembarca e X salta de paraquedas; comandos documentados. Som do helicóptero do jogador e policial restaurado para o efeito anterior de rotor, sem alterar os motores dos demais veículos. Save compatível somente com v132. Base v131.


- **v131 — ícones originais com cores do Império:** os seis locais controláveis (arranha-céu, supermercado, universidade, estádio, indústria e aeroporto) deixam de usar o ícone genérico de prédio do Império no minimapa e mapa completo. Cada local mantém seu símbolo original, tingido conforme o status do negócio: laranja = tomar/comprar, verde = seu, vermelho = indisponível na história; sob ataque = alternância entre laranja e vermelho. O símbolo do aeroporto passou a constar da legenda, que também exibe as cores atuais dos estabelecimentos. Removidas da legenda as três entradas de prédio genérico. Ícones de outros locais, posições, geração, física e regras de progresso não mudaram. Saves aceitos: v131. Base: v130.

- **v130 — HUD de procurado e ícones de mapa:** estrelas e texto de fuga reposicionados junto ao canto superior direito no desktop e mobile, abaixo do indicador de busca regional. Casa de penhores recebe ícone de moeda dourada com cifrão no minimapa e mapa completo, incluída na legenda; posição usa `HEIST.pawn` da mesma seta amarela que indica a entrada do estabelecimento, sem introduzir pontos falsos. Salto de paraquedas não é mais ocultado no mapa pelo bloqueio de revelação da campanha quando a seta 3D já existe; casa de penhores segue a mesma regra por estar acessível no mundo. Auditados os filtros `storyMap`, `mapPoiEntries`, `drawMapIcon` e `drawPOISet`: outros marcadores de eventos ou prédios deliberadamente bloqueados permanecem condicionais. Saves aceitos: v130. Base: v129.

- **v129 — Agenda do celular e letreiro da capelinha:** novo app **AGENDA** na tela inicial, acessível com os controles habituais, reunindo POLÍCIA (190), AMBULÂNCIA (192) e TÁXI (555). Selecionar o contato liga pelo fluxo telefônico existente, sem duplicar lógica de serviços; discagem manual e outros aplicativos permanecem. A palavra TAXI agora acompanha a inclinação lateral da capelinha 3D, posicionada a cerca de 0,008 unidades da superfície, eliminando o afastamento visível sem gerar z-fighting. Saves aceitos: v129. Base: v128.

- **v128 — táxis livres, serviços chamados e aviso de cheats:** a capelinha **TAXI** existente alterna entre acesa (livre) e escura (indisponível), com táxis de trânsito sorteados; apenas os que têm letreiro aceso atendem ao chamado. Durante a viagem como passageiro ela apaga e volta a acender na saída. O texto das faces foi aproximado do corpo preservando folga contra z-fighting. Materiais e geometria do letreiro são compartilhados e não são descartados quando o LOD do táxi muda. Táxi seleciona o destino e começa a viagem imediatamente, fechando o mapa sem exigir clique de captura do mouse; pular viagem segue **T no teclado / toque curto em ↓ no controle**, com lembrete permanente no HUD durante o percurso. Serviços chamados pelo celular aparecem só no minimapa: táxi amarelo, polícia azul e ambulância branca, enquanto se aproximam. Ao usar cheats, aviso explícito de que podem quebrar o jogo e o salvamento fica proibido até novo jogo; bloqueio anterior foi preservado. Saves aceitos: v128. Base: v127.


- **v127 — assaltos, caronas, GPS e rádio:** roubo de picape com dois NPCs na carroceria faz o motorista e ambos os caronas descerem correndo; em cerca de metade das abordagens, um ou dois ocupantes disparam durante alguns segundos. Conversíveis de tráfego recebem 1–2 passageiros em sprite, com remoção segura ao sair do veículo ou regenerar a cidade. A roda de rádio mostra no centro o nome da música da estação selecionada. Rota GPS é calculada/desenhada apenas em veículos; o marcador continua visível a pé. Ao concluir a primeira missão no píer, a casa segura é marcada como próximo destino. Travessias do Upside Down, Point Haze, Synthwave/Modern (DeLorean) e troca de personagem entre mundos passam a atenuar apenas a música antes do carregamento e elevá-la suavemente na chegada; som de motor, explosões, vozes e efeitos são preservados. Saves aceitos: v127. Base: v126.

- **v126 — piloto mais baixo na moto:** reduzido o offset vertical do sprite do jogador ao montar na moto, para que o corpo fique mais encaixado no veículo e o tanque alinhe melhor com a região do cinto/cintura. O ajuste só afeta o player montado na moto; jetski, NPCs, física, suspensão e o conserto do chassi da v125 permanecem intactos. Saves aceitos: v126. Base: v125.

- **v125 — chassi da moto desaparecendo ao montar:** corrigida a divisão por zero do cálculo de inclinação lateral da suspensão (`vtw=0` para motos). O resultado anterior era `NaN`, contaminando a rotação do grupo da carroceria, enquanto as rodas — transformadas individualmente — continuavam visíveis. A nova lógica fixa a inclinação lateral da suspensão em zero quando não há espaçamento entre as rodas e limpa possíveis valores anteriores inválidos. Mantidas a inclinação da moto durante curvas (`c.roll`), a física, as rodas, o sprite do piloto e toda a iluminação da v124. Saves aceitos: v125. Base: v124.

- **v124 — transição de iluminação ultrarrápida:** coeficiente de suavização exponencial de `actorLighting()` elevado de `24` para `48` (`1−exp(−dt×48)`), dobrando novamente a velocidade de resposta de sprites à luz e sombra (6× a velocidade de v121). Cores, intensidade, consultas de sombra, shader e outras mecânicas preservados. Compatibilidade estrita de saves: v124. Base: v123.

- **v123 — iluminação dos sprites mais responsiva:** coeficiente de suavização exponencial de `actorLighting()` elevado de `12` para `24` (`1−exp(−dt×24)`), duplicando a rapidez de adaptação à luz e à sombra em relação à v122, sem modificar intensidade, amostragem ou shader. Compatibilidade estrita de saves: v123. Base: v122.

- **v122 — transição de iluminação dos sprites 50% mais rápida:** a suavização exponencial de `actorLighting()` passa de `8` para `12` (`1−exp(−dt×12)`), tanto ao entrar nas sombras quanto ao sair para a luz. Intensidades, cores, amostragem das sombras, limites de desempenho, shader e demais sistemas continuam inalterados. Saves aceitos somente da v122. Base: v121.

- **v121 — ajuste de giroflex, concessionária, clima e moto:** ao usar uma viatura ou lancha policial, um toque curto na buzina liga/desliga giroflex e sirene juntos; em ambulâncias, toques curtos alternam entre só giroflex, giroflex + sirene e tudo desligado (segurar continua sendo buzina). Plataforma giratória da Pixel Motors recriada ao gerar nova cidade, reposicionada no piso da vitrine e levemente elevada para ficar visível. Círculo azul da tempestade limitado às bordas do mapa, sem alterar raio real da chuva. Malha da moto garantida ao montá-la, sprite do piloto elevado para não encobrir o veículo e vibração contínua do motor removida (impactos, terreno e nitro preservados). Vinis não são gerados nem concedem recompensas no mundo invertido. Saves v121. Base: v120 estável em HTTPS.

- **v120 experimental:** sombra local dos sprites passa a consultar os triângulos das malhas estáticas que projetam sombra nos chunks atravessados pelo raio, em vez dos grandes volumes do recorte de câmera. Mantém orçamento distribuído e luz dos postes da v119; piso de brilho menor preserva diferenças à noite. Teste visual e medição mobile pendentes. Saves v120.

- **v119 experimental:** iluminação dos sprites recomposta de ambiente + luz direta antes da limitação de brilho, com maior diferença entre sol/sombra. Player tem prioridade de amostragem; alcance de sombra ampliado. Luz local dos postes intensificada e medida no centro do personagem. Respeita luzes reais ativas e configurações. Saves v119.

- **v118 experimental:** sprites próximos recebem sombra aproximada dos volumes registrados de prédios/coberturas e luz dos postes reais ativos. Testes de sombra distribuídos: até 1 sprite/frame no mobile ou 2 no desktop, intervalo por sprite de 180–300 ms, transição suave; distantes mantêm luz global. Não é sombra por pixel: volumes simplificados podem sombrear vãos. Saves v118; v117 preservada como alternativa.

- **v117:** corrigida a geometria das duas metades da luminária: conversão para triângulos não indexados antes de passar a MB.geo, como exigido pelo construtor. Mantém cobertura superior e lâmpada inferior. Saves v117.

- **v116:** luminárias com casco superior metálico e luz só na metade inferior; tráfego fluvial com 35% de jet skis usando o modelo existente; P da garagem separado da moldura horizontal e colocado em pé; seta externa da safe house reposicionada e protegida de oclusão; bloom de todos os interiores multiplicado por 0,3 (shopping mantém seu redutor anterior). Saves somente v116.

- **v115:** personagens pixel recebem tonalidade da iluminação ambiente/solar/lunar; noites com nova no brilho anterior da cheia, quartos intermediários e cheia dobrada. Aeroporto sem avião estático e com helicóptero fora da rota de taxiamento. Limiares internos da polícia sorteados a cada 30 s de simulação: 5–15 vítimas e 1–3 veículos (demais gatilhos policiais mantidos). Carros de gangues recuados para terrenos e aviso de destruição com raio de 14 m. Tempestades sem pancadas residuais: céu limpo por 30 s antes da previsão e 30 s após dissipar antes de formação de chuva comum. Saves v115.

- **v114:** removidas as dez notificações expositivas aprovadas (GPS, cemitério, conveniência, penhores, liberação de carro roubado na blitz, área de busca, pedágio, carregamento, coleta de vinil e estatísticas da dupla). Removidos os avisos de formação de chuva comum e de esperar cobertura total do céu. Previsões de tempestade e todas as mecânicas preservadas. Base v113 com slider de sombras mantida; saves aceitos somente da v114.

- **v113 – sombras e câmera aérea:** Configurações → Gráficos inclui controle de resolução das sombras (1× padrão, 2× e 4×, limitado pela GPU). PC 1024² / 2048² / 4096²; celular 512² / 1024² / 2048². Persistência em `ps_cfg` e em `cfg` do `.psave`; RESTAURAR PADRÕES volta para 1×. 8× não foi incluído (8192² no PC seria desproporcional à resolução renderizada). Na câmera top-down, ao voar de helicóptero ou paraquedas a janela de sombras cresce para abranger a área visível no solo, evitando a borda quadrada acompanhar o voo; o deslocamento da janela usa a escala real do texel para diminuir tremulação. Esta versão aceita apenas saves v113.

- **v112:** corrigida a troca de armas pela roda do mouse ao selecionar punhos. O ciclo continua nos dois sentidos pelas armas adquiridas, sem precisar abrir a roda com TAB. Saves seguem a checagem estrita de versão: esta atualização aceita apenas saves v112.

- **v111:** no helicóptero o minimapa gira com a frente do helicóptero e acompanha a posição dele.
- **v110 – aeroporto suave:** o avião segue uma trajetória contínua (velocidade, subida, rolagem e arfagem filtradas, curvas de raio limitado): sai do hangar, taxia em curva até a cabeceira, espera 10 s alinhado, acelera, rotaciona e decola, faz um semi-C (curva de 180° inclinado) e segue reto até a borda do mapa. A chegada vem pela perna paralela à pista, faz o semi-C até alinhar na final, desce na rampa, arredonda, toca, freia, faz o retorno, taxia pela pista paralela e entra no hangar.
- **v109:** cruz lateral da ambulância centralizada no painel traseiro (não cruza mais a junta da porta corrediça).
- **v108:** NPCs da caçamba aparecem da cintura pra cima (pernas escondidas pela caçamba).
- **v107:** setas piscando também na frente (antes só atrás); frisos laterais, vincos de porta, soleira e faixa do táxi agora são fitas contínuas coladas na curva da lataria (não mais pedaços retos “tortos”); ambulância refeita: faixa fina de ponta a ponta, cruzes laterais coladas, cruz no teto e giroflex sobre o teto reto; marcas de pneu não somem mais na grama das praças/quintais; posto explodido reabre após 6 horas de jogo (6 min) quando você está longe; picapes com 2 NPCs em pé na caçamba apoiados no santantônio (comum na zona rural).
- **v106:** caixas de roda sem cortar a curva do para-lama em nenhum carro (o ombro da lataria fica mais reto sobre as rodas) e com ~5 cm de curso pra roda subir; batente de suspensão: se uma roda chegaria ao topo do arco, a carroceria é empurrada pra cima (a roda nunca entra na lataria — testado subindo e descendo calçada com todos os carros); esportivo com pneu um pouco menor e para-lamas mais cheios; palhetas do para-brisa finas e proporcionais; concessionária só com veículos de terra (+ Vortex) e o carro do giratório não congela mais.
- **v105:** novos modelos arredondados (mesma técnica dos carros: seções + loft + normais suavizadas) — helicóptero (fuselagem em gota com bolha de vidro, cone de cauda, deriva e estabilizador com perfil, carenagem do motor, rotor de 4 pás com ponta pintada, esquis com ponta curva), avião (fuselagem tubular, asas enflechadas com diedro e winglets, motores em naceles com pilone, cauda convencional, janelas, portas e trem de pouso), lancha (casco em V com quina, proa alta, faixa e friso de borda, console com para-brisa envolvente, bancos, volante, motor de popa) e Vortex (saia inflada em gomos, cabine em bolha, duto do ventilador com grade e lemes); subida na calçada mais suave (a roda rola sobre a quina); câmera TPS corrigida dentro da casa de penhores, banco, cassino, assalto e império; logo do jogo ao lado do título no menu.
- **v104:** suspensão por roda — cada roda sente a calçada (20 cm) e a carroceria amortece com mola (sobe, inclina e balança), uma roda de cada vez; viatura que vê seu crime e parte pra cima liga giroflex + sirene (inclusive as estacionadas na delegacia); som de helicópteros e aviões pausa no ESC; carros detalhados a partir de ~1 quarteirão (até 14 carros, 7 no celular) sem custo extra graças ao cache de malhas; racks de teto (crossover, perua, SUV) acompanham a curva do teto, santantônio da picape apoiado nas laterais da caçamba e faixa do táxi colada na lataria; no Império, o aviso “destrua o carro da gangue” só aparece quando você está perto do carro.
- **v103 – meio-termo nas caixas de roda:** o arco agora sempre fica um pouco acima do topo do pneu (o pneu não escapa mais do para-lama), sem invadir a curva do capô; folga de ~5 cm. Esportivo e superesportivo ganharam para-lamas levemente mais altos sobre as rodas (o super também tem rodas um pouco menores); a viatura trocou o alargador preto por friso na cor da pintura; dobra do arco em tom mais suave.
- **v102 – acabamento das caixas de roda:** recorte mais justo (folga de ~3,5 cm em volta do pneu, como em carro de rua), o arco nunca sobe até a curva do capô/para-lama (topo achatado quando a roda é grande pra carroceria), dobra da lataria pra dentro do arco antes do forro preto e friso fino rente à pintura. SUV, crossover, picape, viatura e caminhão mantêm o alargador de plástico preto.
- **v101 – carros mais detalhados:** caixas de roda de verdade (a lateral é recortada e tem forro escuro, então a roda aparece inteira dentro do arco, inclusive esterçada, sem atravessar a lataria; o antigo truque de esconder a metade de cima da roda foi removido), rodas de liga com 5 raios, friso nos arcos (plástico preto em SUV/picape/viatura), vincos de porta, soleira, grade com frisos, placas Mercosul, escapamento (duplo nos esportivos), palhetas, setas âmbar, luz de ré, faróis de neblina e antena. Por tipo: estepe no SUV, santantônio e frisos na caçamba da picape, porta corrediça e portas traseiras com vidro na van, porta de vidro, colunas e grade do motor no ônibus, chaminés, tanque, para-barros e luzes laterais no caminhão, quebra-mato na viatura, aerofólio no hatch, rack no crossover e guarda-corpo no barco. Os detalhes só existem na malha de perto, então não pesam no tráfego distante.
- **v100 – som dos motores:** cada tipo de veículo tem seu próprio ronco (timbre, faixa de rotação, número de marchas e volume). Populares, compactos, esportivos, superesportivos, SUVs/picapes/vans, caminhão/ônibus, moto, barco, jet ski e Vortex soam diferentes; barcos e jet ski não trocam marcha e oscilam com as ondas; o Vortex tem zumbido de turbina. Cada carro ainda tem variação própria de ±6%, e turbo/nitro deixam o som mais agudo e brilhante.
- **v99:** ilhas naturais formadas pelo rio voltaram (agora são feature): além da micro-ilha do pedágio, o rio pode cercar quarteirões, ligados por pontes.
- **Império (v98, estilo Vice City Stories):** arranha-céu, supermercado, universidade, estádio, indústria e aeroporto viram negócios de gangue (ícone original de cada local tingido de laranja; verde quando é seu; vermelho = indisponível no modo história). Tomada: destrua o carro da gangue na frente → derrube 4 membros armados de pistola → entre (seta) e derrube os capangas de punho/taco e destrua os 3 bens do negócio (tiros ou E) → compre o prédio na porta ($2.500 a $6.000). Depois escolha o ramo: DROGAS (aporte $1.500, $400/dia, risco alto, atacantes de metralhadora), CONTRABANDO ($1.000, $250/dia, risco médio, pistolas) ou ROUBO ($500, $150/dia, risco baixo, tacos). O lucro cai num cofre (até 3 dias) que você recolhe na porta; em ataque o ícone pisca e o lucro para até você derrubar os rivais. Mortes de membros de gangue não contam para a regra dos 10 assassinatos. Progresso salvo no save.
- **Shopping: 4 lojas novas com interior (v97):** CAFÉ (térreo; café $5 = +15 vida; clientes tomando café), JOIAS (térreo; colares e cor da fivela do cinto, $25 cada; o colar saiu da Moda Pixel), MÚSICA · DISCOS (1º andar; clientes de fone; perto das prateleiras você ganha um fone de cortesia e as rádios tocam enquanto estiver na loja) e FARMÁCIA (1º andar; remédio $60 = +100 vida).
- **Banco: interior e assalto (v96):** porta com seta amarela na calçada da frente do banco. Dentro: saguão de mármore, colunas, balcão com vidro e 3 caixas, cofre redondo. No balcão, com arma, E anuncia o assalto: 3 estrelas na hora e 8 policiais entram em ondas atirando; derrubando todos, o cofre abre e paga $1.000. Saída conta como fuga normal (área do crime = porta do banco). Sair antes = assalto fracassado. Banco fecha 1 dia de jogo depois. No modo história o assalto fica trancado (base para a futura missão).
- **Cassino Pixel Royale (v95):** fachada neon com marquise e letreiro num quarteirão perto do centro (ícone de ficha no mapa). Dentro: salão com carpete, 5 caça-níqueis, bar e mesa. No caça-níquel (E/A): $10 por jogada, 3 rolos giram e param em sequência; chance de 1 em 25 de sair três iguais = $1.000. Funciona com teclado, mouse, toque e controle. No modo história fica fechado até ser liberado.
- **Aeroporto (v94):** hangar 3× mais fundo (em direção à pista), com porta voltada para o pátio; aviões do aeroporto com metade do tamanho.
- **Aeroporto (v93):** ciclo completo: o avião sai do hangar, taxia até a cabeceira, decola, faz a curva e some; ~12 s depois outro pousa, freia, taxia de volta e entra no hangar; ~14 s depois o ciclo recomeça (cerca de 1 min e meio por volta).
- **Aeroporto (v92):** prédio especial num quarteirão duplo (2 quadras), longe do centro: pista com marcações, taxiway, pátio, terminal com letreiro, torre de controle, hangar, um avião estacionado e cerca com cancela automática (a mesma da indústria). Um avião (mesmo modelo dos que cruzam o céu) decola, faz uma curva para um lado aleatório e some; depois outro pousa, freia e o ciclo recomeça. Nada controlável; ícone próprio no mapa.
- **Navios cargueiros (v91):** 2 navios no horizonte da praia, em pistas invisíveis a 150 m e 200 m da areia, em sentidos opostos; no fim do mapa param, giram e voltam. Containers com cores e pilhas aleatórias (paleta da indústria), casco de cor aleatória. Lanchas, jet skis e Vortex batem no casco; o helicóptero pousa no convés e dá para descer e andar nele (você e o helicóptero vão junto). Uma malha por navio (leve).
- **v90:** passageira da missão do píer fala pela barra de diálogo com retrato; menus 100% no controle (D-pad e analógico navegam, foco amarelo visível, ←→ ajustam sliders e listas, A confirma, B volta; CARREGAR SAVE entra na navegação).
- **Correção (história):** a 1ª missão não dependia mais do celular fora do modo avião, e agora chega com aviso "NOVA MISSÃO" + GPS apontando para o "!". Se a cidade não tiver a marina, usa outro píer ou a orla como destino.
- **Checagem de versão do save:** o .psave guarda a versão do jogo (`GAME_VER`, igual ao número da versão publicada; hoje v136). Ao carregar um save de outra versão (ou antigo, sem versão), aparece um erro e ele não é carregado. O número sobe a cada atualização entregue.
- **História: só o Jason na 1ª missão.** A troca de personagem fica bloqueada até liberar a casa segura.
- **Escolha do modo ao gerar cidade:** os botões HISTÓRIA/LIVRE saíram do menu. Ao clicar em GERAR NOVA CIDADE (ou GERAR COM ESTA SEED) abre uma janela com dois quadros em pixel art no estilo do seletor de personagem: Jason = modo história, Lucia = modo livre; preto e branco, colorindo o que estiver em foco. Escolher segue para o carregamento; Esc/○ volta ao menu.
- **História: casa segura trancada no início.** Só libera ao concluir a 1ª missão; então chega o aviso "vá até sua casa dormir" (toast + SMS da Lucia) e o ícone aparece no mapa. Antes disso a porta diz "CASA TRANCADA" e a garagem não funciona.
- **Base do modo história:** começo em ponto aleatório, mapa vazio só com o "!" da missão; recursos trancados (shopping, oficina, concessionária, Point Haze, fenda, synthwave, eventos, dupla) até missões liberarem (`STORY_MISSIONS`: needs/unlock/reveal, `storyOK`, `storyMap`, `storyComplete`). Missão 1 (carona até o píer) termina só com "MISSÃO CONCLUÍDA · +$X". Dicas aleatórias por SMS só no modo livre.
- **Pontes levadiças:** 2 por cidade, em pontes de pista dupla sem arco (nunca a do pedágio nem a da foz/borda). Trecho móvel = 1/3 da ponte, duas folhas até 45° com dobradiças e engrenagens visíveis por baixo. Ciclo 5 s sobe · 60 s aberta · 5 s desce · 60 s fechada. Trânsito reduzido (máx. 3 por ponte) e parado em fila antes da folha, sem tentar desviar; carros sobre a folha escorregam e podem cair. Procurado: sobem e o ícone vira X vermelho; guaritas nas duas cabeceiras (na calçada) forçam a descida ou levantam manualmente.
- **Mapa:** a legenda agora mostra só o que existe na cidade atual e inclui missão, área de busca da polícia, chuva, itens raros "?" e viaturas do radar; corrida e arrancada indicam o horário (22h–8h); ícones da legenda maiores. Os marcadores de rampage (caveira), corrida (bandeira quadriculada) e arrancada (carrinho com fumaça) no cenário viraram objetos 3D pequenos girando, em vez de ícones grandes virados para a câmera.
- **Vortex:** hovercraft anfíbio (terra e água, entra e sai do mar pela praia, desliza mais na terra). Sempre na areia ao lado do farol; reaparece 2 h de jogo depois de levado.
- **Oficina: turbo e neon:** turbo ($1.500) dobra a velocidade final; neon embaixo do carro ($300, trocar cor $50) com 8 cores ou cor livre, feito como brilho no chão (sem luz real). Salvos no carro e na garagem. Removido o aviso "serviços grátis".
- **Salvar na cama:** deitar na cama da casa segura abre o download do save; ao carregar, o jogo começa na casa segura.
- **Eventos pelo mapa:** RAMPAGE (caveira; demogorgons infinitos com 3× a vida, arma do ponto com munição infinita, 90 s), CORRIDA (bandeira quadriculada; ilegal, só das 22h às 8h; checkpoints contra 2 rivais) e ARRANCADA (carro com fumaça; só das 22h às 8h, exige nitro, 1 rival). Ícones no radar e no mapa; cada ponto volta depois de um tempo.
- **Novos veículos:** perua, crossover, compacto e roadster (variações de sedã, SUV, hatch e conversível) e jet ski (mais rápido que a lancha, chega rente à areia; parado na praia e ao lado do píer, alguns andando no mar). Todos na concessionária. Lanchas do rio agora colidem com lanchas e jet skis.
- **Menu de pausa:** botão CONTINUAR trocado por um ✕ no canto (Esc continua funcionando); SALVAR JOGO aparece à esquerda de CARREGAR SAVE; saiu o aviso "o jogo não salva sozinho". O seletor HISTÓRIA/LIVRE fica na linha de CONFIGURAÇÕES e só vale ao gerar uma cidade nova; o save guarda o modo da partida.
- **Modo história × livre:** seletor no menu inicial. No modo história, a primeira missão é um SMS opcional pedindo carona até o píer; no desembarque a passageira fala de uma transmissão vinda do mar (pista para Point Haze). O SMS volta no dia seguinte se ninguém atender. A dica de SMS sobre a lancha virou charada.
- **Jason e Lucia juntos:** chamar o outro na casa segura ou entrar no carro onde ele ficou. No carro, Alt troca o controle na hora: motorista dirige e o parceiro atira na polícia (70%); atirador atira e o parceiro dirige sozinho (GPS ou passeio/fuga), carro 70% mais resistente. Bullet time do Jason de carona; câmera lenta da Lucia dirigindo.
- **Correções:** plataforma da concessionária sem z-fighting; árvores não nascem mais dentro das garagens (casa segura e DeLorean); alvo do paraquedas paga por anel ($60/$150/$300); moto inclina com as rodas.
- **Concessionária Pixel Motors:** showroom com estacionamento e plataforma giratória (ícone de carrinho no mapa). O vendedor abre um menu com o veículo girando, troca de modelo e cor, e compra. Todos os 14 veículos aparecem com preço ($1.200 a $25.000), mas só se compra o que cabe na garagem. O carro comprado ocupa uma vaga (a mais antiga é substituída) e você sai dirigindo; comprar outro em seguida tira o anterior da rua. A garagem agora é a sua frota: o carro sai e continua seu; se sumir, volta para a vaga; destruído, libera a vaga. Carro roubado guardado substitui o que estava fora.
- **Documento e blitz:** carros comprados são legais. Na blitz, carro roubado é sempre descoberto: 50% de prisão, 50% de liberação.
- **Economia rebalanceada:** táxi $15 + distância/10; vigilante $150 por nível; conveniência $120–260; lojas do shopping $120–280; penhor paga 60% do valor; atropelamento $0–20; Upside Down $1.500; alvo do paraquedas $150. Custos: hospital ao morrer 10% do dinheiro ($100–1.000), fiança 15% (mínimo $500), roupa $25, lanche $20, pintura $100, nitro $500. Removida a dica falsa de roubar banco.
- **Micro-ilha com pedágio**: cidades **Normal (14×14)** geram 1 quarteirão residencial cercado de água (os canais novos se ligam ao rio e as lanchas da IA navegam em volta), com uma única ponte de pista simples (uma faixa para cada lado, mesmo que a rua seja avenida). No máximo 2 carros na ponte; cada carro para 2 s na cancela, ela abre e ele segue. Na ponte há guarita com atendente ("São 10 dólares, amigo." / "Obrigado! Boa viagem.") e duas cancelas: com $10 ela abre e cobra; sem dinheiro não abre; furar a cancela = ★. Na ilha fica a casinha com garagem coberta de 1 vaga e o DeLorean dentro. As garagens "Back to the Past" espalhadas pelo mapa saíram. DeLorean levado ou destruído: outro aparece 3 h de jogo (3 min) depois, quando você estiver longe.
- **Polícia em 3 níveis** (estrelas amarelas no lugar da faixa "PROCURADO"): ★ 1 viatura; ★★ 2 viaturas, que atiram; ★★★ 2 viaturas e helicóptero da polícia, que segue de cima e atira. Todos acertam 40% dos tiros. Explodir 3 coisas durante a fuga sobe um nível; pegar helicóptero durante a fuga vai direto para ★★★. Na água vem a lancha da polícia (azul, giroflex, sirene e tiros), 2 lanchas no ★★★. Policiais a pé também passaram a acertar 40%.
- **Blitz** (só em rua de mão única): as 2 viaturas ocupam uma faixa e os cones na divisória levam o trânsito para a outra. O trânsito no trecho fica limitado a no máximo 2 carros. Um policial fica no meio da rua e põe um cone na sua frente quando você chega; o outro caminha até a janela. Depois de uma perseguição, se você ainda bate com a descrição (só a roupa ou só o carro iguais): "Deixe eu ver seus documentos." → "Eu acho que te reconheço…" → 50% de ser preso (com os dois iguais, preso). Blitz de rotina: "Documentos, por favor." → "Ok, tudo em ordem. Pode seguir." Liberado, o cone sai da frente. Furar a blitz = ★★.
- **Helicóptero na delegacia** com pintura de polícia (azul-marinho, faixa branca e giroflex).
- **Point Haze de helicóptero**: voando 300 m mar adentro você chega à ilha, e a polícia é despistada. Lá não tem heliponto, mas dá para pousar e decolar à vontade, e voltar voando.
- **Barro voando nas poças de lama**: ao passar pelas poças na estrada de terra molhada, as rodas traseiras jogam barro marrom para trás e para cima, com mais força acelerando e muito mais quando o carro está atolando (roda girando em falso).
- **Modo avião no celular**: com as notificações desligadas aparece um aviãozinho no lugar do sinal. Também ficou pronto o código das futuras mensagens de missão, `phoneMission(texto)`: aparecem com envelope vermelho-alaranjado no minimapa e "!" laranja na lista, e não chegam no modo avião.
- **Pânico com arma na mão**: a pé na rua, os pedestres num raio de ~18 m fogem como na chuva, e alguns gritam ("Ele tá armado!", "Alguém chama a polícia!"). Se o pânico durar 1 h de jogo (1 min real), a polícia vem.
- **TV (Pixel News)**: câmera do helicóptero mais perto (tempestade ~42 m, perseguição ~46 m). Ela sobe acima dos telhados e gira para achar ângulo livre quando um prédio tapa a vista. Os carros da perseguição não somem nem ficam invisíveis enquanto a TV está ligada. Quando o bandido morre, a cena fica 6 s no ar e logo começa outra perseguição.
- **Troca de personagem com um deles na Point Haze**: a câmera sobe só 55 m lá, sem mostrar a linha de espuma da borda.
- **Tiros**: pedestres agora aguentam 5 tiros normais (antes 3). Tiro na cabeça, Colt Magnum e bazuca continuam matando na hora.
- **Polícia (regras)**: sem testemunha, atirar à toa não dá nada. Matar 10 pedestres ou explodir 3 veículos chama a polícia mesmo sem viatura por perto, e matar alguém em lugar fechado também.
- **Assalto em qualquer loja do shopping** (mesmas regras da conveniência): mire no vendedor por 3 s, pegue o dinheiro, e a polícia espera na saída. A loja fecha e só reabre 3 h de jogo (3 min) depois do fim da perseguição, da morte ou da prisão. A conveniência do posto também fecha nesse período.
- **Limpeza de veículos abandonados**: carro ou moto que você usou e largou some 1 h de jogo depois (1 min real), sempre a mais de 50 m de você. Não somem: carros da garagem, o carro do outro personagem, o carro do prêmio dos discos, táxi, serviços e lanchas. Helicóptero largado fora do heliponto (ex.: num telhado) volta para o heliponto depois de 1 h de jogo, quando você estiver longe.
- **Táxi com luminoso de verdade**: no teto, um trapézio amarelo com "TAXI" escrito na frente e atrás, no lugar da bolha oval.
- **Corrigido: helicóptero pulando ao acelerar.** A oscilação de pairar dependia da posição X, então em velocidade virava um sobe e desce rápido. Agora a oscilação é suave e independe da velocidade.
- **Cheats por personagem**: armas, vida, colete e os cheats pessoais (vida infinita, munição infinita, nunca procurado) valem só para quem digitou. Cada personagem guarda as próprias armas, vida e colete. Cheats de mundo (tempestade, polícia, explodir carros, discos) afetam os dois. Qualquer cheat impede os dois de salvar.
- **Sons do celular**: tom de chamando… e depois um bipe positivo (atendeu) ou negativo (recusado). Ligações são recusadas quando você está fugindo da polícia, e número inexistente também dá recusa.
- **Táxi**: câmera livre durante a corrida (mouse ou analógico direito) e **pular viagem** com T (↓ no controle): fade e você já desce no destino, pagando a corrida.
- **Ajustes de interface**: balões de fala mais baixos, mais perto da cabeça. No shopping saiu o balão de comando em cima do vendedor; ficou só o cumprimento, e o comando aparece embaixo da tela, como na conveniência. A bomba de combustível continua com o balão. Eletrônicos e Malas & Mochilas Co. foram para o 2º andar. O guarda-roupa só mostra headphone e mochila nas cores já compradas.
- **Aviso de PIXel**: quem recebe, ao virar o personagem ativo, ganha a notificação "JASON te enviou um PIXel de $X!" e a mensagem fica no celular.
- **Detalhes de bairro**: nas zonas residenciais, algumas árvores têm bola ou frisbee preso na copa (somem se a árvore cair) e alguns fios de poste têm um par de tênis pendurado pelo cadarço.
- **Corrigido: poeira marrom atrás da lancha no mar.** O mar longe da cidade era tratado como "zona rural", e por isso soltava a poeira de estrada de terra. Barcos e veículos na água não soltam mais poeira, nem sofrem o efeito da terra.
- **Fuga da cela**: pena de 5 minutos. O guarda anda em U pelo corredor e some pela porta por 7–14 s. Depois de 1 minuto, o colega de cela (balão: "Usa a colher pra cavar um túnel de fuga") te dá uma colher. No canto marcado da parede, clique/E/R (R2/□/✕ no controle) com o guarda fora da vista: 30 s de cavação. Pego cavando, a pena volta para 5 minutos. Com o túnel pronto, você sai num beco perto da delegacia, longe das armas e do portal.
- **Câmera pro céu nas trocas de mundo** (estilo GTA V): ao trocar Jason/Lucia entre cidades diferentes e ao ir ou voltar da Point Haze e do Upside Down, a câmera faz a mesma vista de cima da troca no mesmo mundo: olhando reto para baixo, sobe até a mesma altura da troca no mesmo mundo e a tela escurece. Depois do loading, clareia lá de cima e a câmera desce reta até o personagem.
- **Chegada da viagem no tempo sem pausa**: o jogo congelava a física durante o fade de saída e a explosão de chegada. Agora é o inverso da ida: o carro espera parado e invisível; no flash da explosão ele surge e já sai andando a 88 km/h.
- **Balões de fala em pixel art** ligados às ações: vendedores do shopping ("Olá, amigo! O que deseja?"), conveniência ("Obrigado e volte sempre!" / no assalto "Por favor, poupe minha vida!"), dono da casa de penhores, cachorro bravo, paramédico do 192, taxista, motorista do carro roubado, pedestre baleado, polícia ao começar a perseguição e o outro personagem na casa segura.
- **Barra de diálogo com retrato** (pausa o jogo, texto letra por letra, escolhas): código pronto em `dlgOpen()` para missões futuras, ainda sem uso no jogo.
- **Sem stutter ao anoitecer, em explosões e na bazuca**: as luzes (postes, faróis, explosão e as lâmpadas da oficina e do posto) agora ficam sempre na cena, apagadas com intensidade 0. Trocar a quantidade de luzes recompilava todos os shaders. No loading, o jogo também prepara as partículas de fogo e fumaça, o foguete da bazuca, o carro queimado, o bloom e o céu da noite.
- **Celular legível**: tela e teclas em alta resolução com texto normal (não pixelado), e todo texto ajustado para caber na tela.
- **Assalto a residências** (22h–8h): setas em casas aleatórias do bairro residencial. São 5 interiores, versões da casa segura com cores diferentes e espelhadas. Você tem 10 s para pegar TV, micro-ondas, DVD ou celular (de $20 a $150 cada, total no canto da tela); depois disso a polícia vem. Algumas casas têm cachorro bravo que morde.
- **Casa de penhores**: uma por cidade, seta escondida num beco longe das armas. Depósito com prateleiras empoeiradas e dono no balcão; E/→ vende tudo. Mais de 10 s lá dentro atrai a polícia.
- **Polícia testemunha**: ela só vem se vir você roubar carro ou atirar, a até meio quarteirão (38 m) de uma viatura ou policial.
- **Becos**: caixas, sacos, pneus, barris e paletes quebram só de esbarrar, a pé ou de carro. A caçamba grande precisa de batida acima de 4. Gatos reduzidos pela metade (no máximo 2 ao mesmo tempo).
- **Controle no padrão GTA V (PS4)**: ↑ abre o celular (a pé e no carro); → a pé interage (loja, guarda-roupa, paciente) ou chama um táxi que passa perto, como no GTA V; segurar ↓ troca de personagem. COMANDOS → CONTROLE e o FAQ CELULAR/SMS foram atualizados com o passo a passo do celular e de como chamar táxi, ambulância e polícia. A aba de toque passou a se chamar TOQUE (MOBILE).
- **Carteira por personagem e app PIXel**: Jason e Lucia têm dinheiro separado. No celular, o app **$ PIXel** manda dinheiro para o outro: o valor é digitado no teclado do celular, LIGAR envia e APAGAR corrige ou volta. Saves antigos: o personagem em uso fica com todo o dinheiro.
- **Compras por personagem**: Jason e Lucia têm guarda-roupa próprio. Roupas, acessórios, headphone e mochila comprados por um não passam para o outro. O celular também é por personagem. Tudo fica salvo no save.
- **Limite de munição e mochila**: sem mochila, até 150 balas por arma e 3 foguetes; acima disso a arma no chão não é pega. Nova loja **Malas & Mochilas Co.** no shopping (layout da conveniência, prateleiras de malas): mochila de $500 em todas as cores da roupa, menos laranja. Com ela o limite vai a 1.500 balas e 30 foguetes. A mochila substitui a laranja do paraquedas nas costas, e dá para tirar ou colocar no guarda-roupa. Tirando, a munição é cortada para o limite.
- **Discos de vinil (colecionáveis)**: 15 por cidade, entre o lixo dos becos e 3 nos rios (precisa de lancha). Aparecem como "?" no minimapa. Uma única textura de capa e de disco é gerada e compartilhada por todos. Com os 15: armas com munição máxima e colete na porta da casa segura (reaparecem quando você se afasta) e um esportivo com nitro sempre na porta. Cheat **COLLECTTHEMALL** completa a coleção, mas o jogo deixa de poder ser salvo.
- **Celular** (P / ↑ no controle, também dentro de veículos): pixel art com tela e teclado; números discam direto e, subindo, você entra na tela. 190 chama a polícia (só persegue se vir crime), 192 chama a ambulância com giroflex (o paramédico enche a vida até 100), 555 chama um táxi. 3 modelos (PIXDROID S, iPIXEL 15, TIJOLÃO 3310); Jason começa com Android e Lucia com iOS, e o modelo fica salvo por personagem.
- **SMS de dicas**: uma a cada ~5 min (ordem e intervalo aleatórios, só dicas de gameplay), com envelope no minimapa e bipe-bipe; ficam marcadas como lidas e somem após 24 h de jogo. Dá para desligar em CONFIG (engrenagem) no celular.
- **Loja de eletrônicos** no shopping (layout da conveniência, prateleiras de eletrônicos): vende celulares e **headphone** (sprite na cabeça, 6 cores). Com o fone, as rádios tocam a pé (Q, vírgula/ponto; ← no controle); tirar o fone no guarda-roupa para a música.
- **FAQ** ganhou as abas CELULAR/SMS, MECÂNICAS, MISSÕES e AMBIENTE.
- Missão PARAMÉDICO: numa ambulância, T começa. Vá até o ferido (deitado, com sangue, seta vermelha), desça perto dele com a ambulância a até ~14 m e aperte E (ou → no controle) para socorrer; volte à ambulância e leve ao hospital. Cada paciente salvo paga ($50 + bônus por tempo + $10 por paciente já salvo no turno) e o próximo chamado vem em seguida. Se o tempo acabar, o paciente não resiste e vem outro chamado. T encerra.
- Ambulâncias de rua: de vez em quando uma passa em alta velocidade com giroflex piscando, sem parar em semáforo (mais raras que a polícia). Na ambulância, o toque curto na buzina alterna: desligado → giroflex → giroflex + sirene → desligado. A sirene é opcional (a missão começa só com o giroflex). As ambulâncias de rua passam com a sirene ligada.
- Monitor de desempenho (F3/MONITOR) agora fica no canto superior esquerdo, para não cobrir o seletor de personagem.
- Becos mais cheios: além dos sacos de lixo, agora há caixas de papelão (às vezes empilhadas), engradados de madeira, pilhas de pneus, tambores coloridos e paletes, encostados nas paredes. Tudo no beco é quebrável/derrubável pelo carro. Nem todo beco tem caçamba; ela segura batidinha (abaixo de ~20 km/h) mas uma batida mais forte a estoura em pedaços e ela some. Gato em cima da caçamba está seguro, mas se ela quebrar ele cai no chão e foge, exposto.
- Corrigido: z-fighting em caçambas de beco — às vezes duas caçambas eram geradas uma dentro da outra (faces coincidentes piscando). Agora ficam sempre separadas.
- Cães e gatos em pixel art, no mesmo estilo dos pedestres (6 pelagens de cão, 5 de gato). Gatos vivem nos becos e não saem para a calçada: andam entre as caçambas e de vez em quando sobem e ficam em cima delas. Cães aparecem nos quintais das casas, na areia da praia e, de vez em quando, nas calçadas. Fogem de quem chega correndo ou de carro rápido e podem ser atropelados. Até 8 por perto (4 no celular); não existem no Upside Down nem em Point Haze.
- Ambulâncias: 3 estacionadas na frente das alas de cada hospital, de frente para a rua. É a van, branca, com faixa e cruz vermelhas nas laterais, cruz no teto e giroflex vermelho/azul. Dá para pegar e dirigir; o heliponto do hospital não ocupa o lugar delas.
- Táxi: G (ou ↑ no direcional, a pé) chama o táxi mais próximo do quarteirão; ele encosta, você segura F para entrar e marca o destino no mapa. Detalhes na seção Táxi.
- Mapa no controle: o analógico move uma mira, A/✕ marca o destino e B/○ fecha.
- Nenhum cheat funciona durante a troca de personagem (câmera subindo, deslizando e descendo), a troca de mundo ou a viagem no tempo; aparece CHEAT BLOQUEADO e o código digitado é descartado.
- Teleporte (cheat) e troca de personagem ficam bloqueados nos momentos que podiam quebrar o jogo: morto/afogando, nocauteado, saltando de paraquedas, vendo TV, DeLorean com o portal aberto (≥ 70 km/h) ou viajando no tempo, durante transições de mundo, no farol, em salto de rampa, decolando/pousando o helicóptero e dentro de interiores. O teleporte também não funciona de dentro do helicóptero. Um aviso diz o motivo; o marcador do teleporte continua no mapa.
- Não dá para trocar de personagem durante uma perseguição, preso na delegacia, dentro da loja do posto ou do shopping, nem com qualquer menu aberto (guarda-roupa, loja, mapa, configurações, rodas): o seletor fica apagado.
- Corrigido: depois de afogar/morrer e ser levado para outro lugar, a tela podia ficar em preto e branco.
- "Mundo Invertido" agora se chama **Upside Down** (nome em inglês, como SUNSET SHORES, SYNTHWAVE e POINT HAZE). A pasta da trilha pode ser `radios/Upside Down` (o nome antigo ainda funciona).
- Paraquedas: os prédios têm colisão (bater na parede faz descer raspando nela) e dá para pousar em qualquer telhado. No telhado você anda e salta de novo pela borda com E. O comando foi invertido: ↓ planar, ↑ descer mais rápido.
- Helicóptero: barulho de motor, rádio (Q e roda do mouse, como no carro) e pouso em telhados (prédio largo o bastante e você centralizado). Descendo no telhado, você fica nele e pode saltar de paraquedas pela borda. Explosão do helicóptero não derruba mais quem está lá no alto de paraquedas.
- Persistência de Jason e Lucia (detalhes na seção Personagens).
- Corrigido: em Point Haze, aves e helicópteros/aviões do céu piscavam e sumiam (as aves eram escondidas e reexibidas conforme a tempestade oscilava). A ilha agora não tem tráfego aéreo nem aves, e no resto do jogo as aves não piscam mais na transição da tempestade.
- Corrigido: a lancha soltava "nuvem de areia" (fumaça de pneu) junto com o respingo na água.
- Corrigido: dentro dos interiores (shopping, loja, casa segura, delegacia), na câmera de cima e na isométrica, uma faixa do piso sumia (o corte em cilindro na direção da câmera cortava o próprio chão). Agora o corte esconde só o que está acima da cabeça do jogador (teto, mezanino, alto das paredes), também na câmera de cima, e esses elementos não fazem sombra.
- Corrigido: voar de helicóptero (ou de paraquedas) sobre rio/mar matava o jogador afogado. Desembarcar sobre a água continua afogando.
- Colete à prova de balas: faixa branca fina embaixo da barra de vida, na metade direita (ao lado da azul do especial). Absorve o dano antes da vida (tiros, explosões, quedas, monstros). Achado em alguns becos e na porta da delegacia (esse volta 2 min depois de pego). Ícone: colete escuro estofado, sem mangas, com alças e cinta. HESOYAM enche o colete também. Morrer zera o colete; o save guarda.
- Lucia agora troca de roupa no guarda-roupa e na loja, como o Jason (cores, óculos, colar etc.).
- Jason e Lucia: troca de personagem estilo GTA V, com especial de cada um (bullet time do Jason a pé com arma; câmera lenta da Lucia dirigindo). Detalhes na seção Personagens.
- Helipontos e o estacionamento do arranha-céu ficam dentro do quarteirão, sem avançar na calçada nem em cima de árvores e postes.
- Helicóptero pilotável: helipontos com helicóptero no chão, na área livre do quarteirão da delegacia, do hospital e do arranha-céu (o pátio do arranha-céu ganhou também um estacionamento com carros). Detalhes na seção Helicóptero.
- Câmera sobre o ombro (TPS): em 3ª pessoa a pé, com uma arma na mão, a câmera vai para trás do ombro direito e aparece uma mira no centro da tela; o tiro sai para onde a mira aponta. De punhos, volta a câmera normal de 3ª pessoa.
- Arma na mão: o jogador segura a arma escolhida, usando o mesmo modelo do ícone flutuante, em tamanho reduzido, ao lado da mão direita (3ª pessoa e câmera de cima). Em 1ª pessoa não aparece, para não tapar a visão.
- Point Haze: o medidor de distância saiu; o jogador descobre a ilha indo além-mar.
- Rádio por mundo: a pasta do mundo (Synthwave, Upside Down, Point Haze) é a prioridade: entra sozinha, em sequência (ordem dos arquivos), mesmo com a KRFM ao vivo escolhida. As rádios comuns continuam na roda para trocar se quiser dentro do veículo; a pé volta sozinho para a trilha do mundo e, ao entrar num veículo, volta a rádio que estava tocando nele. O som dos carros com som alto só existe no Modern.
- Aviso do Chrome sobre getImageData (willReadFrequently) resolvido.
- Paraquedas: mochila laranja nas costas, desenhada no personagem como os óculos. Aparece ao subir no terraço de salto e some ao pousar. Os paraquedistas NPC também usam.
- Roupa de praia: no guarda-roupa/loja há a categoria SUNGA (várias cores), a opção sem camisa (✕ em CAMISA) e descalço (✕ em CALÇADO). Dá para andar de sunga pela cidade. Os banhistas (cangas, espreguiçadeiras e quem caminha na areia) usam sunga ou biquíni, sem camisa e descalços.
- Espreguiçadeiras: o banhista deitado agora fica com a cabeça no encosto.
- Setas amarelas e interiores: toda entrada grava a origem (qual interior, qual porta e o ponto de saída) e a saída devolve sempre para ela. Vale para as lojas dos postos, shopping, casa segura (inclusive o castelo de Point Haze) e delegacia. Cada porta tem um código (`gas:<quarteirão>`, `mall`, `safe`, `safe:haze`, `pol`, `pol:preso`), base para missões futuras do tipo "mesmo interior, porta diferente". O save feito lá dentro também usa essa origem.
- Mapa completo: o nome da região aparece no topo, com uma fonte por mundo (Sunset Shores em letra de praia no Modern, neon retrô no Synthwave, terror no Upside Down, pirata em Point Haze). A legenda desceu para dar espaço; em Point Haze ela mostra só GPS, casa segura e praia.
- **Point Haze (novo mundo paralelo):** ilhota deserta 3×3 quarteirões. Pegue uma lancha em Sunset Shores e siga 300 m mar adentro; um medidor (0–300 m) aparece e, ao completar, a tela escurece, carrega e você chega de lancha perto do único píer da ilha. Na chegada, qualquer nível de procurado é zerado na hora. Para voltar, saia 300 m da praia da ilha com a lancha do píer.
- Lama nas estradas de terra: as poças de chuva da terra viraram lama marrom e opaca, sem reflexo, mais escura no miolo. Elas substituem os antigos atoleiros redondos. A aderência cai conforme a profundidade; carros pequenos atolam, e caminhões e camionetes passam.
- Corrigido: as poças da estrada de terra ficavam por baixo do decalque da terra e nunca apareciam.
- Letreiros dos marcos: ficam só as placas oficiais "... DE SUNSET SHORES". O neon POLÍCIA da delegacia, que disputava o mesmo lugar com a placa e alternava com a distância, saiu, e a placa voltou ao painel da fachada.
- Pular música: `.` / `,`, ↑ no controle e botão MÚSICA no celular passam a faixa dentro da rádio atual. Q rápido e a roda do mouse trocam de rádio. Cada rádio começa numa música sorteada a cada sessão.
- Rádios por pasta: cada subpasta de `radios/` é uma rádio e a roda mostra só os nomes das pastas. Pastas `Synthwave` e `Upside Down` viram a trilha do mundo correspondente, que entra sozinha e toca também a pé.
- Aves: gaivotas e pássaros aparecem em qualquer ponto do mapa, com 50% de chance cada. As gaivotas deixaram de ficar presas à praia.
- Aves com as cores certas: antes todas eram desenhadas quase pretas (o buffer de cor por instância nascia vazio). Os pássaros ficaram marrom-claro e as gaivotas, brancas. Um pouco de luz própria evita que a parte de baixo vire silhueta.
- Mar no mesmo nível dos rios: a praia inteira virou uma rampa suave (cerca de 9°) do calçadão até a linha d'água, e o rio deságua no mar sem degrau.
- Foz refeita: o canal é a própria água do mar entrando até debaixo da ponte, com margens de areia que acompanham a rampa da praia. A água inclinada e o mar "avançando" sobre o rio foram eliminados.
- A ponte da foz passou a ser uma ponte comum (laje, pilar e muretas iguais às outras), sem os casos especiais que existiam só para ela. As cabeceiras ganharam muretas que fecham a borda da avenida e do calçadão sobre as margens.
- Farol: corrigidas as duas falhas de malha na junção do caminho com a ponta redonda. As pedras subiram para as bordas do caminho, e nenhum objeto de praia aparece sobre ele.
- Cabeceiras da ponte da foz: removida uma face antiga que ficava no mesmo plano da parede nova e causava serrilhado (z-fighting).
- Cabeceiras da ponte da foz: a borda da rampa de areia ficava na face da mureta e vazava como um risco amarelo em ângulos rasantes. Agora ela começa escondida dentro da mureta.
- Trechos de costa sem areia, fora da cidade ou no lado sem praia, têm cais de pedra até a água. As pontas da praia são fechadas com parede.
- Fundo do mar visível: o asfalto deixou de passar por baixo do mar.
- Guarda-sóis, toalhas, espreguiçadeiras, banhistas e o alvo do paraquedas acompanham a inclinação da areia. A marina ficou baixa, perto da água, e o farol passou a sair do alto da praia como um molhe de pedra.
- Fuga pelo shopping: dá para entrar procurado. As viaturas vão até a porta e os policiais entram atrás do jogador e o seguem pelos andares, mas não atiram lá dentro. Com o provador aberto, ninguém é preso.
- Comprar roupa nova durante a perseguição rebaixa o procurado para busca na área do crime. Se o veículo continuar o mesmo, a perseguição volta depois de 1 minuto dentro da zona; se ele também tiver sido trocado, a busca termina.
- Pintar o carro na oficina conta como troca de veículo, inclusive durante a perseguição. Consertar no posto não conta.
- Descer do carro não conta como trocar de veículo: a pé, a polícia continua associando o jogador ao último carro usado.
- A buzina voltou a controlar a viatura: um toque rápido liga ou desliga sirene e giroflex; segurar toca a buzina. A buzina do jogador dura enquanto o botão estiver pressionado e não acumula mais quando é tocada repetidamente.
- Removido o aviso VEÍCULO ROUBADO.
- Limpeza de código: restos de avisos removidos, variáveis e funções sem uso eliminadas.
- Instalação como PWA no celular e em navegadores de desktop compatíveis, com abertura em tela cheia e orientação paisagem no mobile.
- Novos saves `.psave` criptografados e autenticados; mensagem de erro própria ao importar arquivos inválidos.
- Upside Down com até dez demogorgons, perseguição, saltos e pontos vermelhos no mapa.
- Ônibus com letreiros de destino: CENTRO, PRAIA e INDUSTRIA.
- Chuva regional sem preferência pela posição do jogador; aves desaparecem na chuva e paraquedistas NPC são retirados na chuva forte.
- Viaturas estacionadas na delegacia.
- Suspeitos revidam nas perseguições ambientais; viaturas destruídas podem ser substituídas por reforços.
- Oficina cobra pintura, instalação de nitro e reparos. Casa e troca de roupas já adquiridas continuam gratuitas.
- Dinheiro de pedestre atropelado só pode ser coletado a pé.
- Terraço de salto reservado pela seed, com seta amarela e mini paraquedas no mapa; caminhada no teto e salto pelas quatro bordas.
- Controle do paraquedas com curvas, planeio prolongado e descida acelerada; alvo na praia paga $60 (borda), $150 (anel do meio) ou $300 (na mosca) sem cheat.
- Espreguiçadeiras na areia, ocupadas por pedestres pixelados; mesas e cadeiras de bar continuam diante de prédios da orla.
- Toalhas e alvo com prioridade de profundidade revista para reduzir o encobrimento pela areia à distância.
- Recorte de prédios, interiores e pontes para melhorar a visibilidade nas câmeras apropriadas.
- Cheat TELEPORT pelo marcador do mapa; cheats bloqueiam save e pagamentos de táxi, vigilante e alvo do paraquedas.
- Carregamento inicial prepara vistas e recursos gráficos antes de liberar a partida; minimapa mantém atualização de 30 Hz.

## Instalar como aplicativo

O pacote inclui `manifest.webmanifest`, `pwa.js`, `sw.js` e ícones. Não exige PHP nem backend.

- Publique o pacote em **HTTPS**; `localhost` também permite desenvolvimento local com os recursos necessários.
- Em navegadores compatíveis, use **INSTALAR PIXELCITY** ou a opção de instalação no menu do navegador.
- No Safari do iPhone/iPad, use Compartilhar → Adicionar à Tela de Início.
- O aplicativo solicita abertura em tela cheia e orientação paisagem. No mobile, a interface também orienta a girar o aparelho; o bloqueio efetivo depende do navegador.
- Instalar adiciona um atalho/aplicativo web: o jogo continua usando o navegador e WebGL.
- O service worker atual usa rede, sem cache offline do jogo. Instalação não significa funcionamento offline; dependências e rádio continuam precisando de conexão.
- A instalação não substitui o salvamento manual em `.psave`.

## Menu e configurações

### Menu principal

| Opção | Comportamento |
|---|---|
| Mobile · 7×7 | Cidade compacta, com prioridade para os edifícios especiais |
| Normal · 14×14 | Cidade maior, com dois rios e conexão com o mar |
| SEED | Consulta ou edição do número usado para gerar a cidade |
| SORTEAR | Preenche o campo com outra seed |
| GERAR COM ESTA SEED | Gera usando o número informado; botão abaixo do campo |
| GERAR NOVA CIDADE | Sorteia uma seed e inicia outra cidade |
| HORA INICIAL | Define o horário de início |
| CONTINUAR | Retorna à partida; botão verde |
| CARREGAR SAVE | Importa um arquivo `.psave` |
| SALVAR JOGO | Exporta o progresso da partida |
| CONFIGURAÇÕES | Abre os ajustes por categoria |
| COMANDOS | Abre controles, cheats e FAQ |
| MONITOR | Alterna o painel de desempenho; fica vermelho quando ativo, sem acrescentar “ligado” ao texto |

Uma partida nova começa em **Modern**, com câmera de terceira pessoa. Synthwave e Upside Down fazem parte dos segredos do jogo; um save pode restaurar o estilo em que foi salvo.

### Categorias de CONFIGURAÇÕES

- **ÁUDIO:** volume geral, música/rádio, efeitos e som ligado/desligado.
- **RÁDIO:** fonte das músicas, arquivos próprios e teste de reprodução.
- **MUNDO:** densidade de trânsito e pedestres, aplicada durante a partida.
- **GRÁFICOS:** limite de FPS, resolução interna, iluminação dos postes, quantidade de luzes reais, sombras, bloom e reflexos do piso molhado.
- **INTERFACE:** exibição do HUD e do minimapa.
- **CONTROLE:** estado do gamepad, vibração, sensibilidade, zona morta, inversão do eixo Y e teste de vibração.
- **GERAL:** restauração das configurações padrão.

Os ajustes ficam no navegador e também acompanham o save. A lista de códigos está em **COMANDOS → CHEATS**. **RESTAURAR PADRÕES** exige um segundo clique para confirmar.

## Controles

### Teclado e mouse

| Comando | Ação |
|---|---|
| W A S D / setas | Andar ou dirigir |
| Shift | Correr; nitro em veículo equipado |
| F | Entrar, sair ou roubar veículo; interações contextuais |
| Espaço | Pular a pé; freio de mão no carro |
| Clique esquerdo | Atirar; sem arma, socar; segurar dispara rajada quando a arma permite |
| R | Soco a pé |
| TAB segurado | Roda de armas, com tempo desacelerado; soltar confirma |
| TAB rápido | Próxima arma |
| 1 / 2 / 3 / 4 / 5 | Punhos / Pistola / Colt Magnum / Metralhadora / Bazuca |
| Roda do mouse a pé | Trocar arma |
| E | Ação a pé. No veículo, segure para buzinar. Na viatura, um toque rápido liga ou desliga sirene e giroflex |
| H | Faróis |
| Q segurado | Roda do rádio, incluindo DESLIGADO |
| Q rápido | Próxima rádio |
| . / , | Próxima / anterior música dentro da rádio atual |
| Roda do mouse no carro | Trocar de rádio |
| W + S + A ou D | Zerinho |
| Clique esquerdo na bomba | Abastecer, com o veículo parado junto à bomba |
| Botão direito na bomba | Consertar o veículo |
| Mouse | Olhar na visão 3D; clique para capturar o cursor |
| V | Alternar câmeras |
| Z / C ou botão direito arrastando | Girar a câmera em perspectiva |
| + / − | Zoom da perspectiva |
| M ou clique no minimapa | Abrir/fechar o mapa |
| Clique direito no mapa | Marcar/desmarcar destino do GPS |
| T | Iniciar/encerrar missão de táxi ou vigilante |
| N | Som ligado/desligado |
| F3 | Monitor de desempenho |
| ? / F1 | Comandos |
| ESC / P | Menu |
| ' | Caixa de cheat; digite e confirme com Enter |

**Paraquedas:** encontre o mini paraquedas no mapa e a seta amarela na entrada. Use **E/AÇÃO** para subir e, perto de qualquer borda, para saltar. No ar, ←/→ fazem curvas, ↑ prolonga o planeio e ↓ acelera a descida.

### Controle

Conecte por USB/Bluetooth e pressione um botão para o navegador detectá-lo. Layout inspirado no GTA V:

| Botão | Ação |
|---|---|
| Analógico esquerdo | Andar / dirigir |
| Analógico direito | Olhar / escolher nas rodas |
| R2 / RT | Atirar a pé; acelerar no veículo |
| L2 / LT | Freio e ré |
| △ / Y | Entrar / sair |
| ○ / B | Soco; consertar no posto |
| ✕ / A | Segurar para correr; nitro no carro |
| □ / X | Pular; drive-by no carro; abastecer no posto |
| L1 / LB segurado | Roda de armas |
| R1 / RB | Freio de mão |
| L1 + R1 | Drive-by |
| L3 | Segure para buzinar; toque rápido na viatura alterna sirene e giroflex; correr a pé |
| D-pad ← | Rádio no carro; segurar abre a roda; arma anterior a pé |
| D-pad → | Faróis no carro; ação contextual/próxima arma a pé |
| D-pad ↑ / ↓ | Próxima música da rádio / missão |
| R3 | Câmera |
| SHARE / VIEW / BACK ou touchpad | Mapa |
| OPTIONS / START | Menu |

R2 + L2 + direção faz zerinho. Nos menus, setas navegam, ✕ confirma, ○ volta e ←/→ ajustam sliders. Vibração depende do navegador e do controle; responde a colisões, tiros, explosões, pousos, terreno, nitro e trovões.

### Celular e tablet

- Joystick à esquerda para movimento e direção; arrastar na área livre controla a câmera.
- Botões de tiro/soco, entrar/sair, pulo/freio, correr/nitro, arma e buzina/ação conforme o contexto.
- Acessos de mapa, câmera e rádio na interface de toque.
- No mapa, toque e segure para marcar um destino.
- Controles de toque ficam ocultos durante menus, oficina e provador.
- Minimapa, barras e nomes abreviados dos locais usam disposição adaptada à tela.
- Jogo orientado para uso em paisagem; na câmera isométrica, o direcional de toque do carro acompanha a direção indicada pelo analógico na tela.

## Cidade procedural e seeds

A geração estática usa a seed: ruas, lotes, edifícios, detalhes e posicionamento dos elementos do mundo devem se repetir com **a mesma seed, tamanho, estilo e versão do jogo**. Trânsito, pedestres, chuva e eventos continuam dinâmicos e aleatórios.

Alterações no gerador podem mudar uma cidade entre versões, mesmo com a mesma seed. O save reconstrói o cenário com o gerador disponível; não contém uma cópia completa de todas as malhas.

### Zoneamento e arquitetura

- Centro denso, bairros urbanos, áreas residenciais, indústria e zona rural, conforme posição do centro e espaço disponível.
- Quarteirões de formatos variados, parques, praças, estacionamentos e becos.
- Edificações procedurais especiais têm área de implantação limitada a **até duas quadras**, evitando hospitais e outros prédios gigantes ocupando três ou quatro. Um distrito industrial pode reunir mais de um lote.
- Prédios com portas e janelas organizadas, marquises, parapeitos, adornos, ar-condicionado, caixas d’água, antenas e iluminação noturna.
- Prédios abandonados com composição de fachada revisada, incluindo portas, janelas e fechamentos.
- Casas com telhados, portas, janelas, caminhos, detalhes de fachada, varais, lixeiras e, em alguns lotes, piscina e churrasqueira.
- Gramados residenciais unidos visualmente, sem as divisórias artificiais entre placas.
- Cerca de **40% das casas** recebem cercas leves: madeira marrom ou modelo branco com tábuas paralelas.
- Árvores com copas mais arredondadas, preservando o estilo low poly.
- Texturas procedurais reutilizadas: grama verde salpicada, calçada rugosa com juntas e linhas de telhas nos telhados.

### Edifícios especiais

**Mobile e Normal reservam espaço para os marcos**, em vez de sortear quais ficam de fora:

| Local | Destaque |
|---|---|
| Arranha-céu | Torre alta, recuos e antena iluminada |
| Prefeitura | Colunas, frontão, escadaria e cúpula |
| Hospital | Cruz vermelha, alas, heliponto e ponto de renascimento |
| Universidade | Campus com gramado e torre do relógio |
| Estádio | Arquibancadas, gramado e refletores |
| Banco | Fachada de pedra, colunas e caixas eletrônicos |
| Supermercado | Galpão comercial e estacionamento |
| Shopping | Interior de dois andares, lojas e escada rolante |
| Cemitério | Túmulos, mausoléu, neblina baixa, coletáveis e fantasma |
| Delegacia | Referência da polícia e prisão |
| Postos | Combustível, reparos e conveniência |

No **Mobile**, os marcos têm prioridade; a indústria usa o espaço restante e a zona rural vem depois. Portanto, a presença e a extensão dessas duas regiões podem ser reduzidas.

### Ruas, indústria e campo

- Avenidas de quatro faixas, ruas de mão dupla e de mão única, faixas de pedestre e esquinas arredondadas.
- Postes, cabos elétricos, semáforos amarelos de três lentes e objetos destrutíveis.
- Indústria com galpões, tanques, tubulações, chaminés, contêineres, muros/alambrados e guaritas. **Cancelas abrem por aproximação**.
- Indústria próxima ao rio pode produzir uma mancha de poluição irregular, com espuma, óleo e tambores; a água limpa fora da mancha mantém seu próprio visual.
- Zona rural com estradas de terra, árvores, pedras, fazendas, cercas e feno. Menor aderência, poeira e ausência de iluminação urbana em vários trechos.
- **Lama nas estradas de terra:** com chuva, as estradas de terra ganham poças de lama no mesmo padrão aleatório das poças da rua, só que marrons, opacas e sem reflexo, com o miolo escuro clareando para as bordas. Elas crescem com a chuva e secam devagar depois.
- A lama reduz a aderência de todos os veículos conforme a profundidade: o miolo escuro freia e escorrega mais que a borda rasa. Carros pequenos atolam no miolo; vans atolam menos; caminhões, camionetes, SUVs e ônibus passam, só escorregando um pouco. Com chuva, é normal o trânsito travar nesses trechos.
- A lama aparece mesmo com o reflexo desligado (o reflexo continua controlando só as poças da rua e da calçada).

## Rios, pontes e mar

### Rede fluvial

- No tamanho **Normal**, são gerados **dois rios principais**, ligados por um canal.
- Um braço da rede chega à praia e deságua no mar.
- O Mobile usa uma geração mais compacta, sem a garantia de dois rios e de uma foz marítima como no Normal.
- Rios rebaixados aproximadamente **3 metros**, no **mesmo nível do mar**, com paredes de concreto e muretas nas margens.
- Pontes em ruas selecionadas, algumas com arco e tirantes; carros passam sobre a laje e lanchas passam sob ela, desviando dos pilares.
- Mapa e minimapa representam rios, conexões e pontes.

### Foz da praia

A avenida da praia cruza o canal por uma ponte comum, igual às outras da cidade. O rio chega ao mar no mesmo nível, sem rampa de água:

- A água do canal é a própria água do mar, que entra até debaixo da ponte. A emenda com a água do rio fica escondida sob a laje.
- Leito do canal desce suavemente do fundo do rio até o fundo do mar, com a mesma textura.
- Margens de areia em rampa dos dois lados (10 m), acompanhando a inclinação da praia até sumirem na linha d'água. O jogador pode escorregar para dentro da água e se afogar.
- Muretas nas cabeceiras: continuam a mureta da ponte pela borda da avenida e fecham o calçadão sobre a margem.
- Pilar central sob a ponte, com passagens navegáveis pelos dois lados. As lanchas vão do rio ao mar aberto sem obstáculo.
- Espuma da arrebentação interrompida na boca do canal.
- Exclusão de píeres e objetos de praia na área da foz: guarda-sóis, cadeiras e outros elementos não ocupam o canal.
- Pedestres comuns são impedidos de atravessar o leito como se fosse chão.

### Lanchas e píeres

- Píeres nas margens com escada, deck, guarda-corpo e lancha. A marina na praia, fora da foz, começa na areia e fica baixa, perto da água.
- **F** entra na lancha quando o jogador está próximo. Para sair, encoste num píer ou numa praia válida.
- Casco em V, proa, balanço, aceleração, deriva lateral e rastro de espuma.
- Colisão com margens e pilares, mantendo o vão sob o tabuleiro navegável.
- Tráfego fluvial de NPCs: rotas construídas por **células de água adjacentes**, sem calcular atalhos pelo ponto médio de rios unidos.
- Curvas suavizadas, afastamento das margens, margem para pilares, verificação do trecho de movimento e tentativa de recuperação quando a rota fica bloqueada.
- Corpo boiando como evento de exploração, com dinheiro ou arma para recolher de barco.

### Água e litoral

- Mar no mesmo nível dos rios (cerca de 3 m abaixo da rua). Água transparente, fundo com areia, pedras e algas visível, ondas e reflexos animados e cardumes.
- Praia em rampa suave: plana na faixa das barracas, depois desce até a linha d'água e continua submersa até o fundo. A areia escurece perto da água (areia molhada).
- Onde não há areia (fora da cidade ou no lado sem praia), um cais de pedra desce da borda do terreno até a água. As pontas da praia têm parede de fechamento.
- Praia em um dos quatro lados, podendo ocupar todo o lado ou apenas parte dele.
- Calçadão, palmeiras, barracas, guarda-sóis, toalhas, banhistas e fogueiras.
- Mesas e cadeiras de bar diante de alguns prédios, exclusivas da praia, com NPCs sentados.
- Espreguiçadeiras distribuídas **na areia da praia**, com NPCs pixelados deitados e elevados à altura do móvel. Não ficam mais nas portas dos hotéis.
- Ocupantes das cadeiras de bar também usam sprites de pedestres comuns; cada vaga tem ocupação e reposição independentes.
- Toalhas acima da areia, com tratamento próprio de profundidade para reduzir seu desaparecimento à distância.
- Banhistas recolhem-se na chuva e retornam depois.
- Farol com acesso ao topo e iluminação noturna. O caminho de areia curvo sai do alto da praia e segue como um molhe elevado, com saias de areia até a água. Ele se abre suavemente até a ponta redonda, sem cantos, e tem pedras ao longo das duas bordas. Guarda-sóis, espreguiçadeiras, toalhas e fogueiras não aparecem sobre o caminho nem ao lado dele.
- Cair em água profunda a pé afoga; veículos terrestres afundam. Piscinas residenciais têm comportamento próprio e não equivalem ao mar.

## Personagens: Jason e Lucia

- O jogo começa com **Jason** (o visual de sempre, que troca de roupa no guarda-roupa e na loja). **Lucia** começa com o visual dela e também troca de roupa no guarda-roupa e na loja.
- **Bloqueios:** com a polícia atrás, na delegacia, na loja do posto, no shopping ou com qualquer menu aberto, a troca fica bloqueada e o seletor apagado.
- **Trocar:** segure **Alt** (teclado) ou **↓ no direcional** (controle) para abrir o seletor no canto inferior direito; **←/→** (ou A/D, ou o analógico) escolhe; soltar troca. Também dá para clicar/tocar na metade do círculo. Um toque curto em ↓ no controle continua iniciando missão.
- **A troca:** a câmera fica de cima, sobe ao céu, desliza pela cidade e desce onde o outro personagem está (um ponto aleatório da cidade). Se estava de carro, o carro fica para trás. O nível de procurado não passa de um para o outro.
- **Especial (Caps Lock ou L3+R3):** desacelera o jogo. **Jason:** bullet time, só a pé e com arma na mão. **Lucia:** câmera lenta, só dentro de veículo. Vale em todos os mundos.
- **Barra do especial:** a faixa azul fina embaixo da barra de vida (metade da largura). Enche sozinha (cheia a cada 3 h de jogo, 3 min reais), dura cerca de 10 s cheia e pode ser ligada e desligada à vontade para economizar. Desliga sozinha se acabar ou se a condição deixar de valer. Cada personagem tem a sua.
- **Persistência:** quem fica para trás continua onde estava (a pé, no carro, no helicóptero parado no ar, no telhado, na casa segura) por **5 h de jogo (5 min)**. Volte para ele dentro desse prazo e ele está lá; o carro só some se for destruído. Passado o prazo, ele volta para a calçada da cidade inicial (Sunset Shores, no Modern).
- **Outros mundos:** se o outro personagem estiver em outro mundo (Synthwave, Upside Down, Point Haze ou a cidade inicial), a troca recarrega aquele mundo.
- **Casa segura:** entrando nela, o outro personagem está lá dentro (se não estiver no meio de alguma coisa, dentro das 5 h). Trocar ali é na hora, sem a câmera subir. Trocar com o outro a menos de ~45 m também é só um pulo.
- O save guarda quem está ativo, o visual do Jason e as duas barras.

## Táxi

- **Chamar:** **G** no teclado ou **↑ no direcional** do controle (a pé). Vem o táxi mais próximo dentro de ~1 quarteirão; se não houver, aparece um aviso. Procurado não consegue táxi.
- **Embarcar:** o táxi encosta na rua ao seu lado. **Segure F** (ou Y/△) para entrar como passageiro. Um toque rápido continua sendo o "roubar o carro" normal.
- **Destino:** o mapa abre sozinho. Mouse: botão direito marca. Celular: toque longo. Controle: analógico move a mira amarela, **A/✕** marca, **B/○** fecha. Se já houver um marcador, ele vai direto.
- **Corrida:** o táxi dirige pelas ruas até o destino e encosta. Rádio funciona como no carro.
- **Preço:** $5 de bandeirada + $1 a cada 10 m. Sem dinheiro, sem corrida; se o dinheiro acabar no caminho, a corrida termina ali.
- **Descer:** F a qualquer momento encerra a corrida.

## Helicóptero

- **Onde:** helipontos (quadrado escuro com borda amarela e H branco) na área livre dos quarteirões da delegacia, do hospital e do arranha-céu. No arranha-céu, o pátio ao lado virou estacionamento.
- **Embarcar:** E perto do helicóptero.
- **Decolar:** ↑ (W). Ele sobe sozinho até a altitude fixa de voo, acima dos prédios e abaixo dos helicópteros que cruzam o céu.
- **Voar:** ↑/↓ acelera e freia, ←/→ vira. Não há controle de altura. Dá para voar pelo mapa inteiro e um pouco além do mar.
- **Pousar:** E em qualquer lugar; ele desce na vertical. Não pousa na água nem em cima de prédio. No chão: E desembarca, ↑ decola de novo. O helicóptero fica onde você deixou.
- **Saltar de paraquedas:** ESPAÇO no ar. Você salta com a mochila laranja e controla o paraquedas como no salto do terraço. O helicóptero é abandonado, cai bem mais rápido e explode no chão (na água, só afunda). Um helicóptero destruído volta ao heliponto depois de uns 2 minutos, quando você estiver longe.

## Paraquedas

### Encontrar e acessar o terraço

- A geração reserva um prédio da orla para salto; a escolha é derivada da seed. A mesma seed e versão mantêm a escolha, e outros terraços válidos podem completar até três acessos.
- A entrada tem **seta amarela**, no mesmo estilo da casa segura.
- Um **mini paraquedas ciano e rosa com contorno preto** marca a entrada no mapa e aparece no minimapa quando está próximo. A legenda identifica SALTO DE PARAQUEDAS.
- Use E/AÇÃO a pé, junto da entrada, para subir. É possível caminhar pelo terraço.
- A interação de salto aparece ao chegar perto de **qualquer uma das quatro bordas**.
- Saltar pelo lado da praia dá uma trajetória inicial rumo à areia; pelos outros lados, o impulso segue para fora daquela borda, sem retornar automaticamente para a praia.

### Controlar o voo

| Entrada | Efeito durante o salto |
|---|---|
| ← / A ou analógico para a esquerda | Faz curva para a esquerda |
| → / D ou analógico para a direita | Faz curva para a direita |
| ↓ / S ou analógico para trás | Puxa: reduz a descida e aumenta o alcance |
| ↑ / W ou analógico para a frente | Inclina para baixo e acelera a descida |
| Sem entrada | Mantém direção e planeio normal |

No terraço, o direcional continua servindo para caminhar. No ar, o comando para cima prolonga o planeio, sem permitir subir indefinidamente. O paraquedas tem inclinação suave durante essas manobras.

### Alvo e NPCs

- Ao saltar, surge um círculo vermelho na areia. Pousar a até aproximadamente **3,1 m** do centro rende **$60 a $300** conforme o anel, desde que a partida não tenha usado cheat.
- O alvo é opcional: pode-se saltar e explorar outras direções.
- A descida neutra do jogador e a dos NPCs usam cerca de **2 m/s**; os comandos alteram a descida do jogador.
- NPCs escolhem entre até três pontos próximos na areia, evitando a foz. No máximo dois saltadores ficam ativos simultaneamente.
- Chuva forte no voo ou no destino retira o paraquedista NPC; novos saltos também verificam o tempo.
- Pousar na água continua sujeito ao afogamento. Não é permitido salvar enquanto estiver no terraço ou durante o salto.

## Veículos e trânsito

### Modelos e física

Sedã, táxi, viatura, esportivo, conversível, hatch, SUV, van, picape, caminhão, ônibus, superesportivo, moto e lancha têm modelos procedurais próprios.

- Carrocerias por seções arredondadas, vidros inclinados, teto, para-choques, retrovisores e faróis/lanternas.
- Esportivos com inspiração leve nas proporções de carros reais, sem buscar réplicas exatas.
- Física de corpo rígido com pneus, aderência lateral, controle de tração, freio de mão, derrapagem, marcas, fumaça e inclinação da carroceria.
- Piso molhado e terra alteram a aderência; as poças de lama das estradas de terra reduzem aderência e tração conforme a profundidade.
- Nitro em veículos equipados; zerinhos com fumaça e consumo adicional.
- Dano, incêndio, explosão e reações em cadeia.
- Motos inclinam nas curvas e usam piloto em sprite 2D. Impactos fortes podem derrubar o jogador.
- Faróis, som de motor por categoria, buzina e neon inferior em parte dos veículos.
- Buzina e giroflex da viatura ficam no mesmo botão: um toque rápido liga ou desliga sirene e giroflex; segurar toca a buzina. A buzina dura enquanto o botão estiver pressionado e nunca sobrepõe outra.
- Câmera veicular em primeira pessoa posicionada sobre o capô ou à frente do para-brisa, conforme o modelo.

### População do trânsito

- Tipos de veículos variam por região: esportivos/conversíveis na orla, utilitários nos bairros e campo, táxis no centro.
- Trânsito ajustável, com veículos distantes simplificados e física mais detalhada perto do jogador.
- Ônibus exibem destinos CENTRO, PRAIA ou INDUSTRIA nos letreiros.
- Duas viaturas estacionadas são previstas diante da delegacia, separadas da cota de patrulhas ambientais.
- Semáforos, filas, mão única, buzinas e manobras de recuperação.
- Semáforo derrubado ou em alerta pisca amarelo visualmente; a IA continua seguindo o ciclo de tráfego para evitar caos no cruzamento.
- Carcaças e veículos removidos deixam de ocupar permanentemente a cota de população: o sistema pode repor veículos conforme a limpeza ocorre.
- Helicópteros e aviões têm **três fluxos por tipo**, aumentando a frequência em relação ao sistema anterior; intervalos e rotas continuam aleatórios.

### Oficina e garagem

- Oficina marcada em magenta, com pintura por paleta/cor livre, nitro e reparos. A pintura conta como troca de veículo para a polícia; durante a perseguição, rebaixa o procurado para busca na área do crime.
- Garagem da casa segura com duas vagas: guarda veículos compatíveis, conserva cor e nitro e permite repará-los ao estacionar.
- Caminhões e ônibus não cabem nas vagas domésticas.
- Serviços exigem saldo antes da aplicação; sem dinheiro, a alteração não é realizada.

| Serviço | Preço / regra |
|---|---|
| Pintura na oficina | $50 por aplicação de uma cor diferente |
| Nitro na oficina | $250; não cobra de novo se já estiver instalado |
| Reparo na oficina ou no posto | `ceil((100 − vida do veículo) × 1,2)` |
| Recuperação na casa e reparo da garagem doméstica | Gratuitos, nas condições de interação existentes |
| Reequipar roupa/cor já adquirida | Gratuito |

A cor livre é aplicada ao confirmar a mudança, evitando cobranças contínuas enquanto o seletor é arrastado.

## Combustível, postos e conveniência

- Veículos terrestres dirigidos pelo jogador usam combustível; aceleração, nitro e zerinho consomem mais.
- Barra de combustível com alerta de nível baixo. Sem combustível, o veículo perde propulsão.
- Pare junto à bomba: clique esquerdo abastece; direito conserta. No controle, □/X e ○/B.
- Abastecimento custa **$0,60 por ponto percentual**; reparo depende do dano e do dinheiro disponível.
- Postos com cobertura, bombas, preços, loja e identidade visual própria; no Synthwave, paleta pastel e neon ciano/rosa.
- Bombas podem explodir por tiros, impactos fortes ou explosões próximas, causando reação em cadeia.
- Posto destruído fica chamuscado, temporariamente indisponível e reabre depois de um dia do jogo.
- Loja de conveniência com interior, caixa e produtos. Lanche de **$20 recupera 50 de vida**.
- Ameaçar o caixa com arma inicia assalto; violência aciona alarme e reação policial. Não é permitido entrar estando procurado.

## Personagem, armas e dinheiro

- Personagens em sprites procedurais de **32×48 pixels**, com animação direcional, roupas, rosto e acessórios.
- Pedestres caminham, conversam, olham vitrines, entram/saem de edifícios, fogem e reagem à chuva e à violência.
- Pulos sobre obstáculos baixos e possibilidade de subir em carros baixos.
- Punhos, pistola, Colt Magnum, metralhadora e bazuca; seleção direta ou por roda.
- Pistola/metralhadora exigem vários acertos no corpo; tiros na cabeça são letais. Magnum causa dano alto e tem cadência menor; bazuca causa explosão em área.
- Drive-by, danos em veículos e reação policial aos disparos.
- Armas, munição e kits de vida encontrados nos becos e no cemitério.
- Pedestres atropelados podem deixar **$0 a $20**. Quando o valor é zero, nada aparece; o dinheiro deixado fica disponível por tempo limitado.
- Esse dinheiro de atropelamento só é recolhido **a pé**, sem entrar no raio de coleta com carro, moto ou lancha. O evento de corpo boiando mantém sua coleta específica de barco.
- Coletável de dinheiro em formato de cifrão 3D, com tamanho reduzido.
- Dinheiro usado em combustível, reparos, comida e roupas, além de ser recebido por missões e coletáveis.

## Point Haze

- **Como chegar:** de Sunset Shores (Modern ou Synthwave), numa lancha, afaste-se 300 m da praia. A volta é igual: 300 m para fora da praia da ilha, chegando de lancha na costa de Sunset Shores, no mesmo trecho de onde saiu e no mesmo estilo (Modern ou Synthwave).
- **A ilha:** 3×3 quarteirões gerados pela mesma mecânica da cidade, com seed derivada da seed da cidade (cada cidade tem a sua ilha). Ruas de terra; o miolo é grama marrom-clara; em volta, 100% praia selvagem de areia encardida, sem guarda-sóis, cadeiras ou barracas, com a linha d'água irregular.
- **Cenário:** árvores mortas e retorcidas (as do cemitério) e pedras grandes soltas entre elas e na areia. No quarteirão central há um castelo em ruínas, que é a casa segura (porta ao sul). Na ilha não há veículos, NPCs, polícia nem trânsito: tudo é a pé. A única lancha é a do píer.
- **Clima:** sempre encoberto e com névoa (a mesma do cemitério). Com a chuva ligada, chove com frequência e as tempestades são bem mais prováveis.
- **Procurado:** chegar à ilha elimina qualquer nível de procurado, independente de roupa ou veículo.
- **Morte:** você acorda nas ruínas do castelo.
- **Save:** salvar na ilha guarda também de onde você veio, para que a volta leve à sua cidade.
- **Trilha:** a pasta `radios/Point Haze` é a OST da ilha.

## Polícia e missões

### Procurado

A polícia reage a crimes presenciados, ataques a viaturas/policiais e violência contra pedestres. Viaturas patrulham, calculam rotas, perseguem, tentam se desatolar e podem trazer reforços; policiais também saem e atiram a pé.

A fuga acontece por afastamento da área do crime ou por disfarce (roupa nova ou pintura do carro). Destruir viaturas ou abater policiais não encerra a perseguição. Ser encurralado e imobilizado pode resultar em prisão. Morte leva ao hospital; prisão usa a delegacia.

### Reconhecimento por região

- Após escapar, permanece uma **zona vermelha** no mapa.
- A polícia registra roupa e veículos vistos durante a perseguição.
- Voltar com roupa e veículo reconhecidos pode reiniciar a perseguição; correspondência parcial permite um breve período de suspeita.
- Roupa e veículo são os dois indicadores. Com os dois reconhecidos, a perseguição recomeça na hora; com apenas um, depois de 1 minuto dentro da zona; sem nenhum, a busca termina.
- O veículo considerado é o atual ou, a pé, o último usado. Descer do carro não é trocar de carro.
- Pintar o carro na oficina muda o veículo reconhecido. Consertar no posto não muda.
- Comprar roupa no shopping ou pintar o carro **durante a perseguição** rebaixa o procurado para busca na área do crime, e as regras acima passam a valer.
- Ficar longe da zona por uma hora do jogo faz a memória local expirar.
- Indicadores de roupa/carro mostram o estado de reconhecimento; as zonas são incluídas no save.

### Missões de veículo

- **Táxi — T:** buscar passageiro, parar para embarque e seguir o GPS até o destino. Pagamento por distância e possível gorjeta; dano excessivo pode fazer o passageiro desistir.
- **Vigilante — T na viatura:** enfrentar cinco níveis de suspeitos em fuga, de uma moto até grupos de carros, com tempo limitado. O nível final paga $500. Não começa enquanto o jogador está procurado.
- T novamente encerra a missão. Perseguições ambientais também podem ocorrer sem envolver o jogador.
- Nessas perseguições ambientais, suspeitos revidam contra as viaturas; perdas podem chamar reforços, até três viaturas desejadas no evento.
- Usar cheat bloqueia os pagamentos de táxi e vigilante durante a sessão.

### Rampas e saltos insanos

Rampas em estacionamentos e becos permitem saltos. No ar não há tração; pousos fortes danificam o veículo e podem derrubar o motociclista. Saltos insanos usam câmera cinematográfica e recompensa na primeira conclusão; o progresso fica no save.

## Casa segura, roupas e shopping

**Portas e interiores:** os interiores são reaproveitados (todas as lojas de posto usam o mesmo cenário, por exemplo). Ao entrar por uma seta amarela, o jogo guarda o interior, o código da porta e o ponto de saída, e ao sair você volta exatamente para a porta por onde entrou. No código, `doorCode()` retorna a porta usada (`gas:<quarteirão>`, `mall`, `safe`, `safe:haze`, `pol`, `pol:preso`).

### Casa segura

- Marcada por casa amarela no mapa e seta na entrada.
- Interior com móveis, cozinha, cama, TV, guarda-roupa e objetos decorativos.
- Entrada recupera vida e pode reparar o veículo próximo; **não salva automaticamente**.
- Guarda-roupa permite trocar gratuitamente entre **cores e acessórios já adquiridos**; itens não comprados ficam bloqueados.
- TV acessada por F apresenta transmissão de tempestade ou perseguição; esquerda/direita mudam o canal e F encerra.
- O canal de tempestade começa com céu fechado e chuva forte. Ao sair, o clima exterior é restaurado e o molhado artificial da transmissão é removido, sem deixar poças da TV no mundo.

### Shopping e MODA PIXEL

- Shopping de dois andares, átrio, fonte, palmeiras, bancos, vitrines, galeria e escada rolante.
- Lojas de moda, conveniência, games, tecnologia, livros, café, ótica, joias, sapatos, brinquedos, música, esportes, perfumes, pizza, farmácia e cinema.
- Interior com paleta revista nos dois estilos e **bloom reduzido**, mantendo a atmosfera pastel/vaporwave sem ofuscar o cenário.
- MODA PIXEL oferece provador com prévia frontal/lateral: camisa, calça, calçado, boné, óculos e colar.
- Cada nova cor/acessório custa **$10**; opções já compradas podem ser reequipadas gratuitamente.
- Compras e visual atual ficam no save e alimentam o guarda-roupa doméstico.
- Balões contextuais indicam as ações nas lojas; a conveniência vende comida.
- É permitido entrar no shopping procurado. As viaturas param na porta, e os policiais entram, seguem o jogador entre os andares e tentam prendê-lo sem atirar. Com o provador aberto, não há prisão. Comprar roupa nova rebaixa o procurado para busca na área do crime.

## Dia, noite e clima

### Relógio, céu, sol e lua

- **1 segundo de simulação equivale a 1 minuto do jogo**: um dia completo dura aproximadamente 24 minutos sem pausas.
- Sol com trajetória leste–oeste, iluminação e sombras variando ao longo do dia.
- Modern com amanhecer e pôr do sol dourado, pêssego, laranja e violeta; Synthwave mantém sua paleta retrô.
- Nuvens leves de fundo separadas das células de chuva, com cobertura variável.
- Lua em quatro fases: nova, crescente, cheia e minguante; fase inicial relacionada à seed e avanço com as noites.
- Crescente/minguante usam sombra curva, em vez de corte reto.
- **Lua nova não produz reflexo no mar**; crescente e minguante usam metade da força do reflexo da cheia.
- Estrelas, janelas, postes e faróis compõem a iluminação noturna.

### Chuva natural

- O clima da seed influencia a probabilidade de chuva, mas o momento de cada evento é aleatório.
- Células se formam, movem-se com o vento e se dissipam; a chuva é regional.
- A distribuição não favorece a posição do jogador: pode começar longe, já existir em outras áreas no início ou não começar naquele momento. Não usa pontos fixos nos cantos/centro do mapa.
- Previsões avisam a formação e a direção. Mapas mostram áreas de chuva e setas de movimento.
- Chuva comum não produz raios/trovões: esses efeitos ficam para a tempestade.
- Gotas recebem influência das luzes próximas, piso molha e seca gradualmente, aderência diminui e pedestres buscam abrigo ou usam guarda-chuva.

### Tempestade

- Evento natural com chance de ocorrência; não é mais uma opção manual fixa nem “toda sexta chuva”.
- Antes da chegada, o tempo limpa e a formação de nuvens comuns é suspensa. Essa preparação ganhou tempo extra para evitar a frente surgir com o céu ainda cheio de nuvens antigas.
- A frente aparece no horizonte e atravessa o céu.
- O sol começa a esmaecer com aproximadamente **50% de cobertura**, para que o ambiente esteja escuro quando a frente fechar o outro lado.
- Chuva forte, raios ramificados, clarões e trovão com atraso conforme a distância.
- Árvores, palmeiras, semáforos e varais respondem à mesma direção de vento. A orientação do objeto e a intensidade alteram a amplitude visual.
- Caixas dos semáforos balançam como pêndulos; luzes piscam amarelo sem desligar a lógica de prioridade do trânsito.
- Folhas voam na ventania; em tempo normal, algumas caem ocasionalmente.
- Folhas com formato e cores de folha, incluindo verde e amarelo-amarronzado, acompanhando a iluminação ambiente para não parecerem iluminadas pelo sol durante a tempestade.
- **Não há tapetes de folhas estáticas no pé das árvores**, removidos para evitar custo adicional.
- O aviso “tempestade · céu totalmente fechado” foi removido.
- Ao terminar, a frente se dissipa e o clima natural retorna.

### Piso molhado e poças

- Molhado acumulado por região e secagem gradual depois da chuva.
- Poças de água e anéis de gotas próximos da câmera no asfalto. Nas estradas de terra, as mesmas poças viram lama marrom, sem reflexo.
- **Reflexos simulados**, com cores do céu e rastros de luz: não há uma segunda renderização completa da cidade como no espelho das versões antigas.
- Calçadas usam tratamento mais simples; efeitos distantes são reduzidos.
- Opção para desligar o reflexo das poças em CONFIGURAÇÕES → GRÁFICOS. A lama das estradas de terra continua aparecendo, porque também afeta a direção.

## Segredos e mundos alternativos

### BACK TO THE PAST / Top Secret

Nas garagens especiais há um carro cinza inspirado no DeLorean, associado à viagem entre **Modern e Synthwave**.

- Carroceria e detalhes revisados: placa sobre o capô e barras laterais flutuantes removidas; barrinhas traseiras ajustadas ao vidro.
- Contornos de energia **ciano e rosa nos dois lados**, próximos à carroceria.
- **40 km/h:** contornos começam a acender.
- **70 km/h:** aparece o efeito luminoso à frente.
- **88 km/h:** dispara a viagem quando o sistema está preparado, com transição e recriação do mundo no outro estilo.
- Após a chegada, os efeitos da viagem anterior são desligados; existe intervalo de recuperação antes de outra viagem.

### Fenda e Upside Down

- Fenda posicionada junto à parede de um beco, com vermelho vivo e borda escura que desaparece em transparência.
- Cada aparição dura **60 segundos de simulação**, equivalentes a uma hora do jogo.
- Diminui lentamente; aos 59 segundos está bem pequena, ainda atravessável. Aos 60, deixa de aceitar travessia e desaparece em um breve fade-out.
- Depois muda de beco. Menus que pausam a simulação também pausam esse relógio.
- A travessia leva ao **Upside Down**: cidade escura e dessaturada, horário às 03:00 e atmosfera própria.
- Até **dez demogorgons** perseguem pelas ruas, com movimento aos saltos, aparência pixelada marrom e detalhes vermelhos brilhantes.
- Procuram caminhos, detectam o jogador com verificação de linha de visão e podem causar **25 de dano por ataque**, com intervalo entre ataques. Pontos vermelhos no mapa indicam os monstros.
- Retornar vivo pela fenda concede **$1.000**, conforme as regras do evento.
- A fenda também permite retornar; o mapa fornece referência de sua localização.
- `UPSIDEDOWN` leva para perto da fenda, sem atravessar automaticamente e sem reiniciar sua duração.

### Cemitério

Fantasma translúcido pode aparecer entre os túmulos, perseguir e ferir o jogador. Se matar o jogador, há uma transformação visual em pessoa viva. O cemitério mantém neblina baixa, mas não tem mais uma nuvem escura permanente própria.

## HUD, mapa e câmeras

- Dinheiro exibido no **mapa**, retirado da HUD normal.
- Bússola dentro do mapa, no canto superior direito, liberando espaço para o relógio; vida, arma, procurado e avisos em disposição compacta.
- Barras **VEÍCULO** e **COMBUSTÍVEL** lado a lado, ocultas quando o jogador está a pé.
- Minimapa atualiza a **30 Hz**, preservando custo menor que redesenhá-lo em todo quadro, e gira com a direção do jogador; bússola indica o norte. Mapa grande mantém norte para cima.
- GPS traça rota pelas ruas até o destino marcado e mostra referência no mundo.
- Mapa inclui locais especiais, rios, pontes, chuva, poluição, zonas de reconhecimento e outros pontos de interesse.
- Abrir o mapa grande não pausa a simulação.
- Avisos empilhados com duração própria; nome da música desaparece após alguns segundos.
- Interface com fonte legível; placas e letreiros do cenário preservam a estética pixelada.
- Na isométrica, prédios entre câmera e jogador recebem transparência pontual. Interiores, coberturas de garagem e oficina usam recorte para manter o personagem visível.
- Pontes podem receber recorte pontual quando encobrem o jogador na lancha, nas câmeras isométrica e de cima.
- Seis posições/modos na sequência de V: terceira pessoa, terceira perto, terceira bem perto, primeira pessoa, perspectiva giratória e vista de cima.

## Rádio e áudio

- Configuração em **CONFIGURAÇÕES → RÁDIO**, fora do menu principal.
- Fontes: músicas do servidor + próprias; somente próprias; rádio online KRFM.
- Formatos reconhecidos incluem MP3, OGG, M4A, WAV, OPUS e FLAC, conforme suporte do navegador.
- **Cada pasta dentro de `radios/` é uma rádio.** O nome da pasta é o nome da rádio e os áudios dentro dela são a programação. Arquivos soltos direto em `radios/` formam a rádio **RÁDIO**. A raiz do jogo não é mais lida.
- Exemplo:
  - `radios/Rock FM/*.mp3` → rádio **ROCK FM**
  - `radios/Pagode 90/*.mp3` → rádio **PAGODE 90**
  - `radios/Synthwave/*.mp3` → trilha do mundo Synthwave
  - `radios/Upside Down/*.mp3` → trilha do Upside Down
  - `radios/Point Haze/*.mp3` → trilha de Point Haze
- **Trilhas de mundo (OST):** pastas chamadas `Synthwave`, `Upside Down` (ou `Invertido`), `Point Haze` e `Moderno`. Elas aparecem na roda só dentro do mundo correspondente e são sintonizadas sozinhas ao entrar nele. Também tocam a pé, a 60% do volume. Ao sair do mundo, o rádio volta para a rádio que tocava antes.
- A roda do rádio mostra apenas o nome de cada rádio: 1 pasta, 1 rádio; 2 pastas, 2 rádios. Q rápido (ou a roda do mouse no carro) troca de rádio.
- **Pular música:** `.` / `,` no teclado, ↑ no controle ou o botão MÚSICA no celular. A troca é dentro da rádio atual.
- A cada sessão, a ordem das músicas de cada rádio é embaralhada e a rádio começa numa música sorteada, sempre do início da faixa. Ao terminar uma faixa, toca a próxima da mesma rádio; arquivo com erro é pulado. **Trocar de carro mantém a música em andamento.**
- Requer listagem de diretório no servidor (nginx `autoindex` / Apache `Indexes`). Sem listagem, use `radios/lista.txt` com uma linha por arquivo no formato `Pasta/arquivo.mp3`.
- Músicas adicionadas do computador formam a rádio **MINHAS MÚSICAS**.
- Carros que passam tocam músicas das rádios comuns, nunca das trilhas de mundo. A rádio ao vivo não oferece seleção de rádios locais.
- Equalização, compressão e som espacial quando disponíveis; alguns carros passam tocando música.
- Motor, buzina, pneus, sirenes, tiros, explosões, vento, chuva e trovões usam áudio do jogo.
- Arquivos de música escolhidos no computador não são incorporados ao `.psave`.

## Salvar e carregar

**O jogo não salva automaticamente o progresso no navegador.** Use MENU → SALVAR JOGO e guarde o arquivo `.psave`.

**Formato atual:** `.psave` com envelope JSON e conteúdo criptografado/autenticado em **AES-256-GCM**, com IV aleatório. Exportação usa nomes `pixel-city_seed<seed>_<data>-<hora>.psave`. Requer Web Crypto: use HTTPS ou localhost. A chave está no cliente; esse formato evita edição casual e detecta adulteração, mas não equivale a um sistema antitrapaça de servidor.

O save registra:

- Seed, tamanho, estilo, dia e hora.
- Posição, vida e dinheiro.
- Armas, munição, itens coletados e saltos concluídos.
- Veículo terrestre atual: tipo, cor, dano, nitro e combustível; veículos da garagem.
- Visual do personagem e inventário de cores/acessórios adquiridos.
- Zonas de reconhecimento policial.
- Configurações de áudio, gráficos, mundo, interface e controle.
- Estado de chuva/tempestade, vento, células e piso molhado.
- Estado relacionado à fenda e ao Upside Down.

**Limites e compatibilidade:**

- Não permite exportar enquanto morto, procurado, em missão, no terraço/salto de paraquedas, dentro da prisão ou depois de usar cheat na partida.
- Entrar em casa recupera o personagem, mas não substitui o salvamento manual.
- O importador atual exige o envelope criptografado PixelCitySave v2; arquivos antigos sem criptografia são recusados. Erros de formato ou autenticação abrem uma mensagem própria.
- Saves de tamanhos removidos, como 24×24 e 34×34, são recusados; somente Mobile e Normal são aceitos.
- O arquivo não congela cada NPC/veículo do trânsito nem contém todas as malhas. Carregar recompõe a cidade e restaura os dados suportados.
- Como o gerador evoluiu, uma seed salva em versão antiga pode produzir alterações no cenário da versão atual.

## Cheats

Digite o código durante a partida, use a caixa aberta por **'**, ou consulte as sequências de controle em **COMANDOS → CHEATS**. A caixa evita que as primeiras letras acionem comandos normais. Qualquer cheat marca a partida e bloqueia a exportação de save e pagamentos de táxi/vigilante, além do prêmio do alvo do paraquedas, até iniciar um jogo novo. Desligar um cheat não limpa essa marca.

| Código | Efeito |
|---|---|
| HESOYAM | Vida cheia, $250.000, conserto e tanque cheio do veículo atual |
| AEZAKMI | Alterna nunca ser procurado |
| BAGUVIX | Alterna vida infinita |
| FULLCLIP | Alterna munição infinita |
| LXGIWYL | Pistola e metralhadora |
| KJKSZPJ | Conjunto de armas com Colt Magnum |
| UZUMYMW | Conjunto de armas com bazuca |
| TURNUPTHEHEAT | Inicia perseguição policial |
| TURNDOWNTHEHEAT / ASNAEB | Limpa procurado e zonas vermelhas |
| CPKTNWT | Incendeia/explode veículos próximos, preservando o veículo atual e barcos |
| AUIFRVQS | Inicia a preparação de uma tempestade: limpa o céu antes da chegada |
| AFZLLQLL | Limpa chuva e tempestade e adia novas ocorrências |
| SPEEDFREAK | Instala nitro no veículo atual |
| BACKTOTHEFUTURE | Teleporta para perto do Top Secret na garagem BACK TO THE PAST |
| UPSIDEDOWN | Teleporta para perto da fenda dimensional, sem atravessar |
| TELEPORT | Alterna teleporte ao marcar um destino no mapa; útil para depuração |


### Sequências no controle

Os símbolos abaixo seguem a nomenclatura PlayStation; os botões equivalentes funcionam nos demais controles compatíveis.

| Código | Efeito | Controle (PS2) |
|---|---|---|
| HESOYAM | Vida cheia, +$250.000, conserta e enche o tanque do carro | R1 R2 L1 ✕ ← ↓ → ↑ ← ↓ → ↑ |
| AEZAKMI | Nunca ser procurado (liga/desliga) | ○ → ○ → ← □ △ ↑ |
| BAGUVIX | Vida infinita (liga/desliga) | ↓ ✕ → ← → R1 → ↓ ↑ △ |
| FULLCLIP | Munição infinita (liga/desliga) | L1 R1 □ R1 ← R2 R1 ← □ ↓ L1 L1 |
| LXGIWYL | Armas 1: pistola e metralhadora | R1 R2 L1 R2 ← ↓ → ↑ ← ↓ → ↑ |
| KJKSZPJ | Armas 2: + Colt Magnum | R1 R2 L1 R2 ← ↓ → ↑ ← ↓ ↓ ← |
| UZUMYMW | Armas 3: + bazuca | R1 R2 L1 R2 ← ↓ → ↑ ← ↓ ↓ ↓ |
| TURNUPTHEHEAT | Polícia na cola | R1 R1 ○ R2 ← → ← → ← → |
| TURNDOWNTHEHEAT / ASNAEB | Limpa o procurado e as zonas vermelhas | R1 R1 ○ R2 ↑ ↓ ↑ ↓ ↑ ↓ |
| CPKTNWT | Explode todos os carros por perto | R2 L2 R1 L1 L2 R2 □ △ ○ △ L2 L1 |
| AUIFRVQS | Prepara uma tempestade | R2 ✕ L1 L1 L2 L2 L2 ○ |
| AFZLLQLL | Sol (limpa chuva e tempestade) | R2 ✕ L1 L1 L2 L2 L2 ↓ |
| SPEEDFREAK | Nitro no carro atual | — |
| BACKTOTHEFUTURE | Ir ao Top Secret mais próximo | L1 L2 ↑ ↓ ← → ↑ ↓ |
| UPSIDEDOWN | Ir para perto da fenda | L2 L1 ↓ ↑ → ← ↓ ↑ |
| TELEPORT | Teleporte pelo marcador (liga/desliga) | L1 R1 ← → ↑ ↓ ✕ |

## Desempenho e memória

### Estratégia atual

- Cidade estática **pré-carregada e mantida em memória**; regiões não são descartadas e reconstruídas repetidamente conforme o jogador dirige.
- Preparação antecipada de texturas, shaders, materiais próximos/distantes e regiões na GPU.
- Depois de aplicar o save, o carregamento aquece vistas iniciais em várias direções para reduzir compilação/envios tardios ao girar a câmera; não é apenas uma espera fixa artificial.
- Maior trabalho e uso de memória no carregamento inicial em troca de menos engasgos por reconstrução durante a exploração.
- Regiões fora da visão podem deixar de ser desenhadas sem serem apagadas da memória.
- Objetos temporários, partículas, veículos dinâmicos e recursos de uma cidade substituída ainda são limpos quando necessário. O jogo não desliga o coletor de lixo do navegador.

### Otimizações aplicadas

- Luzes inativas tratadas para evitar trabalho desnecessário; limite de luzes reais de postes, com opção de desligar.
- Resolução do compositor/pós-processamento acompanhando a resolução interna.
- Céu simplificado e texturas procedurais compartilhadas.
- Materiais distantes mais simples e redução/ocultação de pequenos detalhes.
- Instancing para trânsito e menor transferência de buffers quando não precisam mudar.
- Atualização de NPCs e colisões por proximidade/frequência, em vez de calcular tudo com o mesmo custo a cada quadro.
- Chuva e sombras ajustadas; poças com reflexo simulado, sem renderização espelhada completa.
- Folhas voadoras instanciadas, limitadas a 80 no Mobile e 160 no desktop, sem acúmulo de folhas estáticas no chão.
- Modelos e texturas reutilizados, limpeza de entidades removidas e correção de acúmulo de pilotos de moto.

### Ajustes disponíveis

- **Resolução interna:** slider com referência visual PSOne perto de 40%; 0% usa um mínimo seguro, não uma tela de zero pixels.
- **Limite de FPS:** sem limite, 60, 45 ou 30. Limitar FPS controla o teto; não garante que o aparelho alcance esse valor.
- Iluminação dos postes e quantidade de luzes reais, sombras, bloom e reflexos.
- Quantidade de carros e pedestres.
- Mobile usa mapa compacto e configurações iniciais mais econômicas, incluindo iluminação real dos postes desligada.

### Monitor — F3

Mostra FPS, tempo de quadro, tempo de CPU da aplicação, tempo de GPU quando disponível, memória JavaScript quando exposta, estimativa de VRAM, chamadas de desenho, triângulos, geometrias e texturas.

**GPU N/D não significa ausência de placa gráfica.** Significa que o navegador/dispositivo não disponibilizou a medição de tempo de GPU usada pelo monitor. CPU, RAM e VRAM exibidos não equivalem ao uso total do sistema operacional.

O desempenho depende de aparelho, resolução, navegador e cena. A documentação não promete um FPS fixo em celulares ou GPUs integradas. Verificações de sintaxe e testes pontuais de lógica não substituem testes visuais ou medições de FPS no dispositivo. As últimas revisões de sprites de praia, alvo e controle de paraquedas ainda precisam dessa conferência no jogo.

## Tecnologia e organização

- **Three.js r128**, WebGL e pós-processamento.
- Canvas 2D para sprites, mapas, letreiros e texturas.
- Web Audio API e áudio HTML para efeitos e rádio.
- Gamepad API e controles de toque.
- Geração procedural por PRNGs derivados da seed.
- Malhas combinadas, geometria compartilhada, instancing e simplificação por distância.
- Web Crypto API para exportação/importação do conteúdo criptografado em `.psave`; configurações locais no navegador.
- Manifesto web, service worker e interface de instalação PWA.

Estrutura básica para distribuir:

- `index.html`: jogo.
- `README.md`: esta documentação.
- `manifest.webmanifest`: identidade, tela cheia, orientação e ícones da PWA.
- `pwa.js`: interface de instalação e registro do service worker.
- `sw.js`: service worker com estratégia de rede.
- `icons/`: ícones de 180, 192 e 512 pixels.
- `radios/`: opcional; uma subpasta por rádio (e/ou `lista.txt`).

Não são necessários banco de dados, backend ou compilação. O carregamento das dependências externas continua exigindo acesso às respectivas fontes, salvo se a distribuição for adaptada para hospedá-las localmente.

## Fauna e atividade na praia

- Gaivotas brancas (circulando) e pássaros marrom-claro (seguindo as ruas), sorteados meio a meio em qualquer ponto do mapa, com modelos leves e voo em bandos.
- Bandos são retirados de áreas chuvosas; tempestades suspendem a atividade das aves.
- Banhistas deitam durante o dia; fogueiras e atividades noturnas substituem esse uso à noite.
- Mesas de bar ficam diante de alguns prédios da orla; espreguiçadeiras ficam na areia.
- A quantidade de ocupantes é limitada e depende de distância, horário e chuva, para preservar o desempenho.

## Inspirações e desenvolvimento

- [24/7 CLT — Uniday Studio](https://uniday.studio/games/247-clt-early-access?cur=brl&lang=pt-BR)
- [Protótipo de veículos de Pat Kerr](https://patkerr.co.uk/2d-vehicles/)
- GTA 1 como referência de estrutura urbana e exploração; referências visuais e de comandos de outros jogos da série.
- Synthwave/vaporwave e referências cinematográficas nos segredos e veículos especiais.

Projeto desenvolvido por iteração e vibe coding: base criada com auxílio do Claude, seguida de ajustes e expansão com auxílio do ChatGPT/Codex. O README anterior também registrava a contribuição de José no comando de giroflex da viatura, preservada aqui.


## v159
- Interior do cassino ampliado e detalhado em estilo low poly, usando a safe house como referência de escala e densidade.
- Novos elementos: fileiras extras de caça-níqueis com displays, mesas decorativas de blackjack/pôquer/roleta, roda da fortuna decorativa, caixa, bar, lustres, vasos e letreiros.
- Mantida apenas a mecânica interativa dos caça-níqueis; as demais mesas são cenográficas.


## v160
- Interior do banco ampliado e detalhado, com mais assentos, NPCs aguardando atendimento, divisores de fila, balcão mais rico e caixa/apoio decorativos.
- Vidros dos atendentes separados da malha principal com transparência de 50%.
- Porta do cofre redesenhada com textura em canvas para aparência mais mecânica e detalhada.


## v161
- Postos e concessionárias agora podem compartilhar a mesma quadra, dividindo meio bloco para compactar melhor o mapa.
- Concessionária passou a suportar múltiplas instâncias (`city.deals`), com seleção automática da unidade mais próxima para interação e vitrine.
- Em mapas maiores, a geração tenta criar 2 conjuntos compartilhados de posto + concessionária, liberando quadras especiais antes desperdiçadas.


## v162 — Cassino + Danceteria
- O prédio do cassino foi compactado: agora a quadra é dividida em duas metades, com **cassino de um lado** e **danceteria do outro**.
- A danceteria ganhou interior simples com **pista de dança**, **10 NPCs pulando na pista**, **5 NPCs no palco**, **balcão de bebidas** e música ambiente via **Flashback FM** (mesma base das cutscenes).
- Beber no balcão inicia um efeito de embriaguez com **gangorra suave da câmera em todas as visões**.
- Após **5 drinks**, o player sofre **coma alcoólico**: perde **15 de vida**, cai deitado em **preto e branco** e acorda em **um beco aleatório**, reaproveitando a ideia da fuga da prisão.
- O cassino continua jogável com caça-níqueis, mas ficou **menor/mais compacto** para dividir o interior com a boate.

## v163 — Banco em um único quarteirão e seta de entrada
- Corrigida a posição da seta exterior do banco: a entrada acompanha a fachada real (sul, norte, leste ou oeste), em vez de presumir que está sempre no lado sul.
- O banco agora só pode reservar um lote de **um quarteirão** nas seeds Mobile e Normal. O limite de tamanho da geometria também foi fixado em até uma quadra como proteção adicional.
- Escadaria externa compactada para deixar o gatilho acessível antes das colisões dos degraus. O mesmo ponto e a mesma orientação são usados ao entrar e sair do interior.
- A seta fica visível quando o jogador se aproxima, inclusive se o banco estiver temporariamente fechado; tentar entrar nessa condição ainda mostra a mensagem de fechado. O interior detalhado, NPCs, cofre e sistema de assalto foram preservados.


## v164 — Cassino e clube separados
- Cassino e danceteria agora ocupam **dois prédios distintos** na mesma quadra.
- O **cassino fica na frente**, compacto por fora, mas voltou a ter **interior completo e separado**.
- A **danceteria ficou nos fundos**, com entrada própria e interior independente em estilo neon/tropical.


## v165 — Concessionária, rampas, danceteria e polícia
- A plataforma giratória da vitrine da concessionária tem agora metade do diâmetro (12,6 m → 6,3 m), sem reduzir os veículos exibidos.
- O catálogo da concessionária usa `dealFits()` antes de apresentar os modelos, escondendo caminhões, ônibus, barcos e outros que não cabem na garagem.
- Nos blocos divididos entre posto e concessionária há uma rampa direcionada para a metade da concessionária, posicionada fora das bombas; continua usando a física original de salto.
- NPCs da danceteria usam a gravidade e o impulso vertical do jogador (`jv=7.4`, gravidade `16`). Ao morrer ou cair, o impulso acaba e o corpo permanece no chão.
- A área vermelha de busca permanece ativa mesmo após reconhecimento/reinício da perseguição; só se desfaz quando o visual E a identificação do veículo deixam de corresponder, exceto limpeza deliberada da safe house.
- Um reconhecimento posterior não cadastra novamente o disfarce parcial como se fosse a aparência original do crime.
- Entrar na safe house encerra a perseguição e remove viaturas de perseguição e patrulhas de busca, tanto na História quanto no Modo Livre, por uma única rotina.
- Versão de saves: 165 (exclusiva à build).


## v166 — Banco, danceteria e jet skis nos rios
- Banco: lote 60×60 m reservado **antes da fusão de quarteirões**, também para a seed `1863267064`; fachada levemente compactada, sem quadra vizinha.
- Danceteria: a porta interna não nasce mais atrás do palco; palco, decoração e cinco NPCs do palco ficam no extremo oposto, entrada livre com spawn avançado para impedir saída imediata.
- Jet skis: tráfego dos rios agora garante até 2 jet skis ao lado de 4 lanchas nas rotas fluviais, reutilizando a mesma geometria, IA e orçamento de 6 embarcações; quando o jogador está próximo a um rio.


## v168 — Banco, mapa e portas procedurais
- Limitada a uma unidade a marcação do banco e compactado o lote da instituição.
- Novo ícone de drink rosa para a danceteria no mapa e na legenda, ao lado do cassino.
- Corrigido o P dos estacionamentos da safe house para ficar no chão na orientação de chegada.
- Portas duplas procedurais nas entradas usadas por pedestres, com placa preta de fundo e abertura suave antecipada antes de entrada/saída.
- Proteção adicional contra árvores posicionadas sobre colisores de residências.

## v169 — Falha de missão, checkpoint e polícia de trânsito
- Modo História: prisão, morte e afogamento antes de concluir a primeira missão (Encontre Lucia) acionam MISSÃO FALHOU com motivo.
- O controlador de falha congela temporariamente a gameplay, apaga marcador GPS e área policial, limpa estados do jogador e objetivos, e reinicia a sequência de chegada do avião **sem gerar uma nova cidade**. O mapa, os quarteirões e a seed são preservados.
- A cela da delegacia deixa de ser o destino da prisão enquanto a missão inicial estiver pendente; na gameplay normal a prisão continua usando a cela.
- Checkpoint interno da primeira missão após reencontro com Lucia. Ao terminar os créditos, surge um balão no canto para baixar um save criptografado .psave. No modo História, salvar depende desse checkpoint; o modo Livre mantém seu fluxo de saves.
- A detecção policial em colisão, roubo, tiro, soco e explosão agora usa somente viaturas efetivamente circulando ou patrulhando (tráfego rail/AI/chase); uma viatura estacionada não age como testemunha automática.
- Alterado GAME_VER para 169: saves são exclusivos da versão; não reabre arquivos de versões anteriores.
- Testes isolados de lógica da perseguição/reset/checkpoint e validação de sintaxe JS. Navegador local bloqueado pelo ambiente de validação; falta avaliação visual na gameplay.

## v238 — LOD extremo 40 / 100
- Baseado na v237, com LOD ainda mais agressivo.
- Nova escala de LOD no desktop: **0–40 m completo**, **40–100 m intermediário**, **100+ m simplificado**.
- No mobile, a troca entra ainda mais cedo: **0–32 m**, **32–80 m**, **80+ m**.
- Cercas entram no LOD próximo: fora do raio detalhado, deixam de desenhar.
- Marcações de rua, semáforos/estrutura leve de tráfego, vegetação procedural, neon e glow deixam de desenhar já na faixa intermediária/distante.
- Sombras de detalhes e vegetação agora ficam restritas ao raio próximo, reduzindo custo de CPU/GPU.
- Mantida a simplificação de materiais distantes e a histerese curta para evitar oscilação excessiva.
- GAME_VER atualizado para **238**.

## v239 — LOD ainda mais cedo (20 / 50 / 100+)
- Ajuste extremo do LOD para espremer ainda mais a cena distante.
- Desktop: **0–20 m completo**, **20–50 m médio**, **50–100 m simplificado**, **100+ ultra simples**.
- Mobile: **0–16 m**, **16–40 m**, **40–80 m**, **80+ ultra simples**.
- Cercas e detalhes finos agora ficam só no raio próximo.
- Marcações de rua, semáforos, vegetação, neon e glow saem já ao cruzar a faixa de 50 m.
- Entre 50 e 100 m permanece apenas o casco distante barato; após 100 m entra material distante simplificado e some a malha de janelas/ornamentos distantes.
- Lixeiras e fios finos continuam desligando cedo.
- GAME_VER atualizado para **239**.

## v241 — Transição suave de LOD por dithering (sem transparência custosa)
- Base **v240**, mantendo chunks de 2×2 quarteirões e os limites de distância desktop **50 / 70 / 100 m** e mobile **16 / 40 / 80 m**.
- O LOD não faz mais `visible=true/false` seco ao ultrapassar os limiares: uma faixa espacial progressiva combinada com um amortecimento temporal de ~0,3 segundo promove **fade-in e fade-out por dithering**.
- Usa `discard` por fragmento, sem ordenar superfícies transparentes, sem criar cópias da geometria e sem mudar as colisões.
- Suavizados: detalhes geométricos e cercas; janelas simples da malha distante; vegetação, sinalização/marcações, semáforos e luzes de tráfego, lixeiras, fios e efeitos por chunk.
- As paredes e os telhados principais permanecem visíveis para evitar edifícios inteiros piscando. Veículos móveis mantêm o sistema de LOD/visibilidade próprio, sem mudanças.
- Materiais de fade são criados uma só vez por malha combinada e **preparados na etapa `warmCityGPU()`**; aquecimento contempla os três níveis e sobe também os buffers de LOD normalmente ocultos durante o loading.
- Mantidas as trocas de material distante v240 para os objetos estruturais; o fade afeta grupos de detalhes, não essa troca de material.
- Não foi feita medição de FPS real ou validação de WebGL neste ambiente: verificar shader/artefatos e custo no navegador desktop e no Poco M7 Pro.
- `GAME_VER=241` (saves de outras versões continuam incompatíveis).

<!-- END LEGACY README VERBATIM -->

## v77 — UX/UI dos menus e controles touch (sessão "Coastal Chaos")
- Legenda do mapa voltou para PT-BR (OFICINA, CONCESSIONÁRIA, CASSINO, … CASA SEGURA); placas/fachadas continuam em inglês.
- CONFIGURAÇÕES reestruturado (JS `cfgRestructure` + bloco CSS próprio):
  - Abas verticais com ícone: GERAL ⚙ (inclui Idioma, Interface e "Comandos e atalhos"), GRÁFICOS, ÁUDIO, CONTROLES. Abas antigas 1 e 4 ficam `data-merged` (ocultas); `selectCfgCategory('1'|'4')` redireciona para '6'.
  - Busca `#cfgSearch`: compara só o texto do rótulo (não a ajuda); esconde blocos/containers sem resultado (função `walk`), mostra título da categoria (`.cfg-stitle`) só durante a busca; "Nada encontrado." quando vazio. Limpar a busca remove todos os `.cfg-miss` (testado: 0 restantes).
  - Textos explicativos longos viram `.cfg-help`, ocultos até marcar "Mostrar explicações" no rodapé.
  - Rodapé fixo: Mostrar explicações · RESTAURAR PADRÕES · PRONTO (`#cfgDone`, fecha). ✕ no topo.
  - Mobile (≤760px largura ou ≤520px altura): tela cheia; ≤520px largura mostra só ícones nas abas.
- MENU INICIAL (seed): duas colunas — esquerda: tamanho (controle segmentado `#sizeSeg`, o `<select id=size>` segue como fonte da verdade e é sincronizado em `syncMenu` via `sizeSegSync`), seed + SORTEAR + GERAR COM ESTA SEED, hora; direita: CTA principal ▶ GERAR NOVA CIDADE, CARREGAR SAVE, ⚙ Configurações / 📊 Monitor. Coluna única em telas estreitas em retrato; modo compacto para altura ≤520px (cabe em 844×390).
- MENU PAUSA: ▶ CONTINUAR (verde, foco inicial) em destaque; 2x2 Salvar jogo / Configurações / Registros / Monitor; VOLTAR AO MENU INICIAL separado, estilo destrutivo, exige 2º toque em até 3,2s ("TOQUE DE NOVO PARA CONFIRMAR"). ✕ oculto no menu pausa (CONTINUAR e Esc substituem). Cutscene pausada: Continuar / Monitor / Registros / Voltar.
- `#areaHud` (distrito/veículo) oculto enquanto menu ou configurações estão abertos.
- Touch: botões em arco no polegar direito (fire maior no canto), INTERAGIR contextual (só com prompt/porta/loja visível). LANG_EN: PRONTO→DONE, INTERAGIR→INTERACT.
- Testado (Playwright/swiftshader): screenshots do menu inicial 1280×720 e 844×390 (touch), pausa mobile real em jogo, configurações desktop/mobile em todas as abas, busca "som/volume/mapa", ajuda ligada, HUD touch; clique no segmentado altera S.size 7↔14; CONTINUAR visível; confirmação dupla do Voltar arma e desarma. Sem erros de página. Não testado em aparelho físico.

## v77 — objetos flutuando nos lotes especiais (marcos, cassino, concessionária, helipontos)
- Causa: desde a v286 o interior dos lotes especiais usa o asfalto global (y=0, registrado em `parkingGroundAdd`), mas o detalhamento continuou desenhado sobre a antiga laje de .2–.26 m. Só `F.box` com y0 exatamente .26 era rebaixado; árvores, túmulos, gramado do cemitério (.26–.31), canteiros, pedestais, colunas (`geo`), heliponto (.2–.3) etc. ficavam flutuando.
- Correção genérica: `MB_DROP` (+ `mbDropIn`/`mbDropY`) envolve `MB.box/cbox/flat/rslab/qdisc/geo`. Ativo só durante `landmark()` (exceto 'gas', que já desce o grupo inteiro .24) com off .26 e durante `dealLotShell()` com off .24, restrito ao retângulo interno do lote. Regra: pé entre .15 e 3.2 m desce `off`; topo ≤3.2 desce junto (peça baixa), topo >3.2 fica (peça alta só estica a base) — pilhas continuam encaixadas. `geo` usa a bbox da geometria (translada ou estica no eixo Y mantendo o topo). Planos (`flat`) ficam no mínimo em .045 (acima do concreto .03). `tree()` virou wrapper de `treeRaw()` que rebaixa só o y0 e suspende o drop internamente (copa não deforma). O atalho antigo do `F.box` (.26→0) só vale fora da área de drop.
- Cassino: porta, colunas, vasos (de .24 → 0), faixas (.25 → .042) e árvores (.2 → 0) corrigidos direto.
- Helipontos (delegacia/hospital/arranha-céu): laje 0–.08 (antes .2–.3 sobre o asfalto), faixas .086; `heliAddPad(...,y)` grava `pad.y` e `heliSpawnAt` usa `pad.y` em vez de `groundY` (antes dependia de o chunk ser gerado antes/depois de `parkingFloorReady`).
- Testado: varredura por raycast das faces voltadas para baixo (seed 12345 7×7 e 4242 14×14, sem erros de página), rastreio das chamadas com pé .15–.4 sobre chão 0, e capturas antes/depois em todos os marcos, cassino, concessionária e helipontos (árvore da delegacia agora toca o chão; heliponto rente ao asfalto; marcas da concessionária a .045 confirmadas). Posto/borracharia não alterados (pilhas de pneus já começam em .03).

## v77 — MODO FOTO (botão no menu de pausa)
- Botão "📷 MODO FOTO" (`#photoBtn`) na pausa, linha inteira abaixo de Registros/Monitor; oculto no menu inicial e na pausa de cutscene. Sem atalho de teclado para entrar (pedido do usuário: menos invasivo).
- Funcionamento (`PHOTO`, `photoEnter/photoExit/photoCam/photoShot`): o jogo continua pausado (`menuOpen=true`), o menu é ocultado, `body.photo-mode` esconde toda a interface menos `#gl` e `#photoUI`. `updateCamera` é envolvido: com `PHOTO.on` a câmera orbita o alvo (heli/carro/jogador). Alvo pode ser deslocado até 30 m; câmera nunca abaixo de `groundY+.3`.
- Controles: arrastar = girar; roda/pinça = distância (2–40 m); WASD/setas movem o alvo, R/V sobem/descem, Q/E zoom; F filtro; H oculta a barra (toque na tela volta); Espaço/Enter foto; Esc volta ao menu (ou reexibe a barra). Start do controle também sai. Listeners em captura bloqueiam os controles do jogo enquanto ativo.
- Barra: VOLTAR · FILTRO (Normal, P&B, Sépia, Vintage, Sunset, Neon, Noir — CSS filter na prévia e `ctx.filter` na foto) · LENTE (FOV 20–90) · OCULTAR · TIRAR FOTO.
- Foto: `render()` + cópia imediata do canvas para um canvas 2D (sem `preserveDrawingBuffer`), marca d'água "Coastal Chaos · Sunset Shores", PNG `coastal-chaos-AAAAMMDD-HHMMSS.png`. No celular usa `navigator.share` com arquivo quando disponível; senão download.
- Ao sair restaura FOV/near da câmera e remove o filtro do canvas.
- Testado (Playwright, 1280×720 e 844×390 touch): entrar pelo botão, arrastar, zoom, trocar filtro, download do PNG (P&B confirmado no arquivo, marca d'água sem sobreposição), Esc volta ao menu com estado restaurado, CONTINUAR retoma o jogo. Sem erros de página. Não testado em aparelho físico (compartilhamento nativo do iOS/Android).

## v77 — alinhamento do menu inicial
- Coluna de ações ganhou o rótulo "JOGAR" (`.mfoot-label`, mesmo estilo de TAMANHO) — o topo de GERAR NOVA CIDADE agora coincide com o topo do seletor de tamanho (medido: diferença 0 px em 1280×720, 900×470 e 844×390).
- `#installApp` saiu do campo TAMANHO e foi para a coluna de ações (abaixo de CARREGAR SAVE). Texto do botão em pwa.js corrigido para "INSTALAR COASTAL CHAOS" (estava "INSTALAR PIXELCITY"), e a dica de instalação também.

## v77 — Shopping: física, detalhes, penumbra com luz real e fachada neon
**Física/modelagem (auditoria automática por caixas do mallBox × colisores + flood fill de caminhada):**
- Corredor do 1º andar estava bloqueado pelos bancos/lixeiras da galeria (z=±4,6 no passeio de 2 m): ELETRÔNICOS e PERFUMES ficavam inalcançáveis andando. Bancos/lixeiras da galeria agora só no térreo; o 1º andar ganhou bancos e palmeira no patamar oeste (fora do vão).
- Faltava a faixa de piso z∈[-6,-4] nos dois andares (laço pulava z=-6) → buraco preto junto às vitrines do lado sul. Corrigido.
- Paredes internas do vão do 1º andar viradas para fora (qa com ref no centro) → apareciam como "textura ausente". Refs corrigidas.
- Colisões novas: blocos de preenchimento nas pontas, faixa do fundo das lojas (prateleiras/balcões de fundo), pilastras das vitrines e art-déco, lixeiras, vasos, bases de manequins, orelhões, todos os móveis novos. Resultado do teste: só o 1º degrau da escada rolante (intencional, gatilho) sem colisor; todas as portas, interiores, pontos de serviço, escadas e saída alcançáveis.
- Lojas decorativas (GAMES, SAPATOS, BRINQUEDOS, ÓTICA, ESPORTES, PERFUMES, PIZZA, CINEMA) agora abertas (vão de porta 3,2 m) e mobiliadas; o ramo genérico (racks/balcão/`MALL[undefined]`) só roda para lojas funcionais.
**Detalhes:** texturas procedurais em canvas (`MALL_TP`/`mallTex`, cache `MALL_TT`): capas de discos, ilha de bolinhas, jogos, sapatos, óculos, perfumes, brinquedos, esportes, pôsteres de cinema, banner de banda, cardápio, diretório, quiosque "i", máquina de refrigerante. Música no estilo da referência do VC (paredes de capas, cubas inclinadas, ilha de bolinhas, torre de CDs, balcão curvo escuro, banner). Corredor: piso em losango na entrada, quiosque de informações, diretório, máquinas de refrigerante, orelhões, banners pendurados, luminárias-lanterna nos pilares, fliperamas no 1º andar.
**Iluminação (`mallMat` = MeshBasic + onBeforeCompile, uniforms `MALL_LU`, GLSL `MALL_GLSL`):** penumbra global (`uDim` .6 modern/.5 synthwave), poças de luz sob as claraboias, AO falso perto do chão/teto, tom ciano/magenta das sancas. Cada loja tem modo "padrão" (como antes, fator .95) e modo "luz real": `mallLightsTick` escolhe até 4 lojas (jogador a <7,5 m da porta ou dentro), atribui slots de luz pontual (cor/raio/ambiente por loja em `mallStoreLight`, café e discos mais sombrios) e faz a transição `uSB`. Teste de loja usa posição empurrada pela normal (evita pontilhado nas paredes de divisa). Sprites (jogador/NPCs) recebem a mesma luz via `mallLightAt` dentro de `actorLighting0`. Neon (`MALL_NB`) e halos aditivos (`MALL_HB`) fora da penumbra; bloom ligado no shopping em qualquer horário.
**Neon por estilo (`mallPal`):** modern = Miami (ciano #2af0ff / magenta #ff3ec8); synthwave = outrun (azul #2b4dff / vermelho #ff1f3d). Interior: sancas duplas, molduras dos letreiros, reflexo no piso, borda do vão, corrimão da escada. Fachada (estilo Starcourt): linha superior escalonada, linha branca/rosada entre pisos, contorno do pórtico, chevron duplo, arcos sobre a porta, moldura do letreiro, claraboia piramidal com arestas acesas. O bloco antigo de neon só-noturno da fachada foi desligado (substituído).
- Testado (Playwright/swiftshader): capturas dos dois andares, lojas em modo padrão e real, fachada modern/synthwave à noite, auditoria de colisão e caminhada, sintaxe sem erros, nenhum erro de página. Não medido FPS em celular real.

## v77 — Shopping com o dobro da área (mesmas lojas, mais espaçadas)
- Parâmetros centralizados em `MALL`: `HX:40` (era 22; interior 80×24 m), `HZ:12`, `SX0:-32`/`SP:18` (início e passo das lojas; antes -20/10), vão do 1º andar `VX0:-28..VX1:28` (era -14..16), escada rolante `EX0:18..EX1:28` (era 6..16), chafariz `FX:-12`. Todo o código do shopping (mallRoom, mallNeon, mallCorridorDecor, mallStoreDecor, luzes, GLSL `mallLight`, `mallLightAt`, gatilhos de entrada/saída/escada, `mallCopSpot`, câmera, spawn de NPCs) lê esses valores.
- Mesmas 16 lojas (8 por andar), mesmo tamanho; entre elas trechos de parede com mural "Sunset Shores" (textura `mural`), luminárias-pilar flanqueando (`mallPillars()`), palmeiras em vaso no térreo. Blocos de parede preenchem os trechos no térreo e na sobreloja.
- Poças de luz do teto/claraboia redistribuídas (±8, ±24, pontas ±37); NPCs do shopping 6 → 10 por andar.
- Testado: flood fill de caminhada (todas as portas/interiores/serviços/escadas/saída alcançáveis nos dois andares), auditoria de colisão (só o degrau-gatilho sem colisor), capturas dos dois andares, modern e synthwave, sem erros de página.

## v77 — Shopping: 1º andar maior, propagandas, fachadas, z-fight e radar nítido
- Larguras por andar: `MALL.CZG=6` (térreo, frente das lojas em z=±6, sem mudança) e `MALL.CZU=10` (1º andar: passarela de 6 m entre o vão ±`VZ`=4 e as lojas). `mallCZ(up)`; `buildMall` define `MALL.CZ/HZ` antes de cada `mallRoom`. As lojas são montadas com `ZS=Z+s*(CZ-6)` (código interno das lojas inalterado). GLSL usa `CZ=up?CZU:CZG`; luzes por loja, NPCs e limites de câmera usam `mallCZ`. 1º andar recebe palmeiras e bancos na passarela.
- Z-fight: teto do térreo agora tem um vão real para a claraboia (poço até 10,9 m com vidro e caibros) em vez de um quad a 9,97 sob o teto a 10; removido o quad a 5,98 sob o teto do 1º andar; halos de neon do teto a Hc−.06 e do piso a .025; luminárias do teto a Hc−.07; faixa dos caibros a −.22. Tapete da entrada: losango interno estava no mesmo y do externo (.018 vs .018) → interno .024, peças .03.
- Propagandas das próprias lojas: `mallAdCanvas(idx,v)` (4 layouts × 16 lojas, textos `MALL_AD_TXT`, ícones vetoriais `mallAdIcon`), texturas `ad<idx>_<v>`; `mallAdFrame` (moldura + 2 arandelas). Térreo: todos os trechos de parede entre lojas e as pontas (anunciam lojas do outro andar). 1º andar: idem, com o mural "Sunset Shores" no trecho central.
- Fachadas com identidade (`mallFacade`, por tipo): moda (moldura preta e dourada), conveniência (toldo listrado + freezer), games (borda de pixels neon), sapatos (arco de madeira), brinquedos (colunas de blocos + toldo), café (toldo marrom/creme, arandelas, lousa na calçada), ótica (óculos neon), joias (mármore preto, filetes e diamante neon), eletrônicos (LEDs + telas laterais), malas (couro com costura), discos (vinil gigante e notas neon), esportes (listras + bola), perfumes (arco dourado), pizza (toldo xadrez + fatia neon), farmácia (moldura branca + filete verde), cinema (letreiro com lâmpadas).
- Fachada externa: arcos neon da porta agora nascem no topo da marquise (cy 4,88 em vez de 2,95).
- Radar/mapa: o código dos ícones não mudou entre builds (diff idêntico desde a v76, captura do radar idêntica pixel a pixel); a nitidez era limitada pelo canvas de 180 px esticado com `image-rendering:pixelated`. Agora `#mini` usa resolução nativa (`MINI_K`, canvas = tamanho CSS × devicePixelRatio, desenho lógico 180) e o mapa grande também (`BK`, até 2,5×). Os círculos azuis translúcidos no mapa são as células de chuva (`CELLS`), não regressão.
- Testado: flood fill (todas as portas/interiores/serviços/escadas/saída alcançáveis), auditoria de colisão (só o degrau-gatilho), capturas dos dois andares, das fachadas, propagandas, tapete, claraboia, fachada externa e radar/mapa em DPR 1 e 2; sem erros de página.

## v77 — Fachadas de volta ao PT-BR e onda neon do DeLorean
- Letreiros/fachadas em PT-BR (nomes próprios mantidos): VELOZ E FURIOSO (oficina de tuning), BORRACHARIA, CONCESSIONÁRIA COASTAL (letreiro, título do diálogo e prompt), CASSINO SUNSET ROYALE, AEROPORTO DE WINDFIELD, CONVENIÊNCIA 24H, PENHORES · COMPRO TUDO, DELEGACIA DE / HOSPITAL DE / UNIVERSIDADE DE / CEMITÉRIO DE / ESTÁDIO DE SUNSET SHORES, BANCO DE SUNSET SHORES, SHOPPING SUNSET SHORES (fachada, banners internos e diretório). Toasts do banco, cassino e danceteria idem. LANG_EN ganhou as traduções dos letreiros que passam por `translatePlain` (fachadas `sunsetFacade`/`sunsetSignMat` ficam em PT também no modo EN).
- DeLorean secreto: `timeContourPoints` agora traça uma "onda" só na lateral traseira (inspirada no De Volta para o Futuro): nasce junto à lanterna (−0,405 L, y 0,57), sobe sobre a caixa de roda traseira, ondula e termina na porta (−0,045 L). Mantém as duas faixas paralelas ciano/rosa, tubo um pouco mais grosso (raio ×1,25). Mesma lógica de visibilidade (≥40 km/h).
- Testado: DeLorean gerado com `buildCarMesh`, contornos forçados visíveis, capturas dos dois lados e 3/4 traseira; sem erros de página.
- (rev.) Faixas do DeLorean redesenhadas no formato das "flux bands" do filme: descem atrás da porta, correm na horizontal sobre a roda traseira e dobram em diagonal até perto da lanterna. Ciano e magenta paralelas (deslocadas pela normal 2D da curva, então não se sobrepõem no trecho vertical). Rodas acendem em amarelo (anel aditivo + disco central fraco em cada face, entram em `c.timeGlow` e seguem o mesmo pulso/limite de 40 km/h; `c.timeWheels`).
- (rev. 2, escolhida pelo usuário) Voltou o primeiro traçado das flux bands (topo em y 1,0, horizontal em 0,785) e o amarelo mais forte das rodas (anel 0xffe066 ganho .95, disco 0xfff2b0 ganho .32).

## v77 — garagem do DeLorean "lacrada" (seed 828452518, 14×14)
- Causa: quando a casa da micro-ilha não reserva garagem própria, a garagem de reserva (bloco `if(city.isle&&!city.delSlot)`) era posta no primeiro espaço livre e sempre abria para +z — nessa seed a abertura ficou colada na parede de uma casa.
- Agora a reserva testa as 4 orientações em cada posição livre do quarteirão e exige um pátio livre de 7,5 m diante da abertura (sem colisores, podendo sair pela calçada); prefere abrir para a borda do quarteirão (rua). Batente escuro e faixa amarela marcam a abertura; o carro nasce virado para ela (`delSlot.a=atan2(dz,dx)`).
- Testado: seed 828452518 → garagem abre para a rua (−x); seed 4242 continua usando a garagem normal da casa.
- (rev. 3, desenho do usuário) Faixas do DeLorean viraram UM contorno contínuo por cor: nascem no ombro atrás da cabine (lado A), descem pela coluna traseira, correm na horizontal até o canto, atravessam a traseira (raios por trás, eixo +x) e voltam pelo lado B. Ciano por baixo, magenta por cima (deslocamento pela normal 2D nas laterais, em y na traseira). Pontos de raio que pegam outra peça (venezianas) são descartados e a curva é suavizada (3 passes). `timeContourPoints(shell,L,W,lane)` sem `side`; 2 tubos por cor (núcleo + halo).
- Prisão: removido o texto flutuante "E PAGAR FIANÇA · $… / OPCIONAL · SEM PRESSA" (`#jailBailTag` fica sempre oculto).
