# TV de recursos (catálogo em canais) — plano e estado (v3 r1)

Pedido do José (21/11/2026): um menu em forma de TV que mostra cada mecânica do jogo como um canal.
←/→ troca de canal (com chiado), cada canal tem nome, logo e LEGENDA curta explicando; tantos canais quantas
mecânicas houver (20, 30…). Coisas pequenas podem dividir canal (ex.: eclipse + tempestade).
**Regra nova: toda mecânica adicionada ou ajustada precisa de um canal na TV.**

## Estado atual (v2 r68)
- **TV implementada no jogo.** Botão 📺 no menu (início e pausa) → `#tvcat`. 44 canais no array `TVCAT`
  (bloco "TV DE RECURSOS" no fim do script principal do `index.html`). Ordem e conteúdo estão lá; esta tabela é o resumo.
- Controles: ←/→, A/D, L1/R1, direcional ou arrastar o dedo/clique na tela = canal (com chiado de imagem e som);
  números 0–9 = ir direto ao canal; G / ↑↓ / △ = guia de canais; Esc / Backspace / ○ / OPTIONS = sai (volta ao menu).
- Texto PT/EN mora no próprio canal (`n`, `g`, legenda dos quadros) e vai para a tela por `data-t` + CSS `::before`,
  fora do `LANG_RE` (não precisa de LANG_EN). Quadro que não existe → "SEM SINAL" com barras de cor.
- Quadros novos da r68 (script em `tools/tvcat-capture.js`, modos `extra`, `extra2`, `extra3`, `extra4`):
  amb, taxi, veh_heli, veh_vortex, veh_jet, emp, ship2, int_bank2, int_pawn2, storm2, skate_pl, mall_int, eclipse2;
  telas do celular refeitas em português (ph_home, ph_apps, ph_prof, ph_call).
- Upside Down: clareado na própria TV (`br` = filtro de brilho no quadro), o jpg continua o original.

## Formato combinado (ideias do José)
- Layouts por canal: 1 quadro; 2–3 quadros lado a lado (mecânica complexa, cenas-chave); 4 quadrantes
  (ex. POLÍCIA: estrelas/perseguição · roupa e carro piscando · círculo vermelho no minimapa · círculo azul-marinho).
- Alternativa: 2 imagens alternando a cada 2–3 s com legenda fixa.
- Outros mundos (Upside Down, Point Haze, Synthwave): usar quadros guardados (jpg), NUNCA carregar o mundo.
- Partes de HUD difíceis de capturar podem ser recriadas em HTML/CSS (ícones SVG de roupa/carro piscando,
  círculos vermelho/azul por cima de um recorte do minimapa).

## Canais na r68 (layout · quadros · sobreposição HTML)
| # | Canal | Layout | Quadros / HTML |
|---|---|---|---|
| 1 | POLÍCIA · PROCURADO | 4 | pol_chase · pol_chase+roupa/carro piscando · map_red+círculo vermelho · map_blue+círculo azul-marinho |
| 2 | NÍVEIS DE PROCURADO | 2 | tv_chase · lista ★/★★/★★★ em HTML |
| 3 | TESTEMUNHA · X9 | 1 | scn_crash escurecido + 190 e barra de 10 s |
| 4 | BLITZ | 1 | tv_blitz |
| 5 | PRISÃO E FUGA | 2 | int_jail (+barra da colher) · poi_police |
| 6 | HOSPITAL E PARAMÉDICO | 2 | poi_hosp · amb |
| 7 | GANGUES | 2 | gang_alley · map_gang+quadrados amarelo/verde |
| 8 | IMPÉRIOS | 1 | emp |
| 9 | ctOS · JAMMER | 3 | jam_night (+mira) · jam_day · poi_bridge |
| 10 | ctOS · PERFIL E PIX | 2 | ph_prof · car_dmc+barra do PIX |
| 11 | CELULAR | 3 | ph_call · ph_home · ph_apps |
| 12 | CENAS DE RUA | alt | scn_purse, scn_chase, scn_crash, scn_stop, scn_dog, scn_skate |
| 13 | PEDESTRES E SEU CARRO | 1 | car_dmc + flash de foto |
| 14 | CARRO SUJO · LAVA-JATO | 1 | dirt_car |
| 15 | A MASKARA | 1 | mask_on |
| 16 | UPSIDE DOWN | 2 | w_inv1, w_inv2 (clareados) |
| 17 | POINT HAZE | 2 | w_haze1 · w_haze2 |
| 18 | SYNTHWAVE · DeLOREAN | 2 | w_synth1 · w_synth2 |
| 18b | BACKROOMS (v3 r10, r11) | 2 | w_back1 (queda: cidade vista por baixo, r11) · w_back2 (Nível 0) |
| 19 | CLIMA (tempestade + eclipse + sombra das nuvens) | alt | storm2 (+relâmpago) · clouds (r70) · clouds_ind (v3 r12) · clouds_vol (v3 r17) · clouds_sunset (v3 r19) · clouds_rain + clouds_storm (v3 r21) · clouds_synth + clouds_inv (v3 r22) · eclipse2 (+disco do eclipse em HTML) |
| 20 | RIOS E MAR (poluição + navios + foz + farol v3 r27, talude r31, fundo dos rios r32) | alt | agua_tarde · agua_raso · agua_rio · tv_pollution · ship2 · foz · farol · talude · rio_fundo |
| 20b | EFEITOS VISUAIS (shaders leves, v3 r25; texturas r33) | alt | fx_carro · fx_chuva_tarde · fx_chuva_noite · fx_janelas · fx_areia · fx_asfalto · fx_parede (r33) · predios_redondos (r34, print do jogo) |
| 21 | OBRAS NA RUA | 1 | obra |
| 22 | PONTES LEVADIÇAS | 1 | poi_bridge |
| 23 | PARAQUEDAS | 2 | tv_parachute · beach2 + alvo |
| 24 | AEROPORTO | 2 | tv_airport · poi_air |
| 25 | CASSINO | 2 | poi_casino · int_casino |
| 26 | AGIOTA | 1 | int_casino escurecido + cartão $10.000 |
| 27 | DANCETERIA | 2 | poi_club · int_club |
| 28 | ASSALTO AO BANCO | 2 | poi_bank · int_bank2 |
| 29 | DISCOS RAROS | 2 | disco girando (HTML) · int_pawn2 |
| 30 | CASA SEGURA | 1 | poi_safe |
| 31 | MOTEL MIRAGEM | 1 | poi_motel |
| 32 | OFICINA | 1 | poi_tune |
| 33 | CONCESSIONÁRIA | 1 | car_dmc escurecido + cartão de preços (falta quadro bom da plataforma: a câmera fica preta lá) |
| 34 | CORRIDA E ARRANCADA | 2 | side_race · side_drag |
| 35 | RAMPAGE | 1 | side_skull |
| 36 | FLORESTA E CEMITÉRIO | 2 | poi_forest · poi_cem |
| 37 | MICRO-ILHA · PEDÁGIO | 1 | isle |
| 38 | SKATE | 2 | skate_pl · scn_skate |
| 38b | EMOJIS NA CAMISETA E NO SKATE (v3 r2; r3: peds; r28: online + controle/toque) | 5 | emo_kb · emo_shirt · emo_skate · emo_peds · emo_online (r28: tela de personagem do online, print do teste em 1280×720 reduzido para 960×540) |
| 39 | HELICÓPTERO, VORTEX E JET SKI | 3 | veh_heli · veh_vortex · veh_jet |
| 40 | TÁXI E MISSÕES DE VEÍCULO | 1 | taxi |
| 41 | SHOPPING | 1 | mall_int |
| 42 | NATHAN E CLAIRE | 1 | cartão HTML (N/C, Alt e Caps Lock) |
| 43 | ONLINE | 1 | cartão HTML (carona) |
| 43b | ONLINE · HACK DE PIX (v3 r9) | 1 | ph_prof + cartão HTML (Bloqueador de Sinal) |
| 44 | REGISTRO E ESTATÍSTICAS | 1 | cartão HTML |

**Novos na v3 r1** (ordem no `TVCAT`: armas depois do hospital, eventos de pedestres depois de "pedestres e seu carro", carros e posto depois do carro sujo, residências depois dos discos, rampas depois dos veículos especiais, e rádio/notícias/modo foto/cheats antes das estatísticas):
| Canal | Layout | Quadros / HTML |
|---|---|---|
| ARMAS | 4 | weap_wheel · gang_alley+traçantes · weap_boom · cartão da bomba remota |
| EVENTOS DE PEDESTRES | alt | pedev · scn_chase+traçantes · car_dmc |
| CARROS: DANO E DIREÇÃO | 2 | car_dmg · car_spin |
| POSTO E CONVENIÊNCIA | 2 | gas_pump+menu da bomba · gas_shop+"ASSALTO!" |
| ASSALTO A RESIDÊNCIAS | 2 | heist_out · heist_in+barra de 15 s |
| RAMPAS E SALTOS | 1 | ramp |
| RÁDIO E HEADPHONE | 1 | radio_wheel |
| NOTÍCIAS | 2 | news (jornal) · tv_chase |
| MODO FOTO | 1 | photo |
| CHEATS | 2 | cheat_box · its |

Fora de propósito (pedido do José, para o jogador descobrir): modo história, detalhes da cidade (fantasma, pets, fogueiras, cardumes, aves, poças, outdoors), extras da Maskara.

Ainda dá para melhorar com quadros reais: gatos/cachorro da casa, Fenda no beco (mundo normal), lab de Point Haze,
mesas do cassino (sinuca, Liar's Dice), Skate Shop, online com 2 jogadores (precisa do servidor), roda de armas/rádio.

## Tabela original da r67 (referência)
| Canal | Quadros |
|---|---|
| POLÍCIA · PROCURADO | pol_chase (+ HTML: roupa/carro piscando, círculo vermelho, círculo azul-marinho) |
| BLITZ | tv_blitz |
| PERSEGUIÇÕES NA TV | tv_chase |
| GANGUES | gang_alley (+ quadrado amarelo/verde em HTML sobre map_gang) |
| ctOS · JAMMER | jam_night, jam_day, poi_bridge (ponte levadiça) |
| ctOS · PERFIL E PIX | ph_prof, ph_pix |
| CELULAR · GOLPES | ph_home, ph_apps, ph_call |
| CENAS DE RUA | scn_purse, scn_chase, scn_crash, scn_stop, scn_dog, scn_skate |
| PEDESTRES E SEU CARRO | car_dmc |
| CARRO SUJO / LAVA-JATO | dirt_car |
| MASKARA | mask_on |
| UPSIDE DOWN | w_inv1, w_inv2 |
| POINT HAZE | w_haze1, w_haze2 |
| SYNTHWAVE / DeLOREAN | w_synth1, w_synth2 |
| BACKROOMS | w_back1, w_back2 (capturados à mão: tools/tvcat-capture.js não tem modo para isso) |
| CLIMA (tempestade + eclipse) | tv_storm, eclipse |
| POLUIÇÃO | tv_pollution |
| PARAQUEDAS / PRAIA | tv_parachute, poi_beach, beach2 |
| AEROPORTO | tv_airport, poi_air |
| CASSINO | poi_casino, int_casino |
| DANCETERIA (show 22h) | poi_club, int_club |
| BANCO (assalto) | poi_bank |
| PRISÃO E FUGA | int_jail, poi_police |
| HOSPITAL / PARAMÉDICO | poi_hosp |
| CASA SEGURA | poi_safe |
| MOTEL | poi_motel |
| OFICINA (turbo/neon) | poi_tune |
| CORRIDAS / ARRANCADA | side_race, side_drag |
| RAMPAGE (caveira) | side_skull |
| OBRAS NA RUA | obra |
| FLORESTA / CEMITÉRIO | poi_forest, poi_cem |
| NAVIOS | ship |
| MICRO-ILHA (pedágio) | isle |
| INTERFACE AUTOMÁTICA (minimapa recolhe, botões de toque somem) | hud_mini_on, hud_mini_off + fx touchfade |
| CONTROLES (△ de contexto, esquema Moderno, editor de botões de toque) | fx padmap + touch_edit |

Faltam bons quadros de: interiores do banco e da casa de penhores (câmera bate em objeto), discos de vinil,
skate do jogador, helicóptero, vortex/jet ski, gatos/pets, impérios, shopping, táxi/vigilante, online (carona).

## Implementação sugerida
- Botão 📺 em `.pz-icons` do menu (`#tvCatBtn`) → overlay `#tvcat` tela cheia com moldura de TV CRT.
- Dados: `const TVCAT=[{id,name,logo,layout:'1|2|3|4|alt',shots:[{img,cap}],legend}]` + EN em LANG_EN.
- Controles: ←/→ / A/D / D-pad ←→ / LB-RB / swipe = canal; Esc/○ fecha; número do canal no canto, chiado
  (canvas de ruído 200 ms + som branco curto).
- Imagens com `loading=lazy`; pré-carregar só o próximo/anterior.
