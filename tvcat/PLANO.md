# TV de recursos (catálogo em canais) — plano e estado (v2 r67)

Pedido do José (21/11/2026): um menu em forma de TV que mostra cada mecânica do jogo como um canal.
←/→ troca de canal (com chiado), cada canal tem nome, logo e LEGENDA curta explicando; tantos canais quantas
mecânicas houver (20, 30…). Coisas pequenas podem dividir canal (ex.: eclipse + tempestade).
**Regra nova: toda mecânica adicionada ou ajustada precisa de um canal na TV.**

## Estado atual
- NADA disso está no jogo ainda (index.html não mudou para a TV). Só as imagens e este plano.
- `tvcat/*.jpg` = 57 quadros capturados do jogo (960 px, headless SwiftShader, seed 716540).
- `tools/tvcat-capture.js` = script Playwright que gera os quadros (sobrepõe `updateCamera` com `CAMOV`
  para câmera aérea; `capmode` esconde o HUD; `tvOn()+tvChannel(k)` com `PL.inside=true` pega os canais da TV da casa).
  Uso: `node tools/tvcat-capture.js nome1,nome2` (vazio = todos) ou `node … "" inv|haze|synth` para outros mundos.

## Formato combinado (ideias do José)
- Layouts por canal: 1 quadro; 2–3 quadros lado a lado (mecânica complexa, cenas-chave); 4 quadrantes
  (ex. POLÍCIA: estrelas/perseguição · roupa e carro piscando · círculo vermelho no minimapa · círculo azul-marinho).
- Alternativa: 2 imagens alternando a cada 2–3 s com legenda fixa.
- Outros mundos (Upside Down, Point Haze, Synthwave): usar quadros guardados (jpg), NUNCA carregar o mundo.
- Partes de HUD difíceis de capturar podem ser recriadas em HTML/CSS (ícones SVG de roupa/carro piscando,
  círculos vermelho/azul por cima de um recorte do minimapa).

## Canais propostos → quadros disponíveis
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

Faltam bons quadros de: interiores do banco e da casa de penhores (câmera bate em objeto), discos de vinil,
skate do jogador, helicóptero, vortex/jet ski, gatos/pets, impérios, shopping, táxi/vigilante, online (carona).

## Implementação sugerida
- Botão 📺 em `.pz-icons` do menu (`#tvCatBtn`) → overlay `#tvcat` tela cheia com moldura de TV CRT.
- Dados: `const TVCAT=[{id,name,logo,layout:'1|2|3|4|alt',shots:[{img,cap}],legend}]` + EN em LANG_EN.
- Controles: ←/→ / A/D / D-pad ←→ / LB-RB / swipe = canal; Esc/○ fecha; número do canal no canto, chiado
  (canvas de ruído 200 ms + som branco curto).
- Imagens com `loading=lazy`; pré-carregar só o próximo/anterior.
