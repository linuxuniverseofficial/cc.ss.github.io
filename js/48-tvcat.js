'use strict';
/* Coastal Chaos · js/48-tvcat.js — TV de recursos (Recursos do Jogo!).
   Script clássico (não é módulo): todos os js/NN-*.js dividem o mesmo escopo global e entram na ordem do index.html. */
/* ================= TV DE RECURSOS (TVCAT, v2 r68) =================
   Catálogo do jogo em canais: botão 📺 no menu (#tvCatBtn) → #tvcat em tela cheia.
   Cada canal = nome, ícone, legenda e uma montagem: l '1' (1 quadro), '2' (lado a lado), '3' (1 grande + 2),
   '4' (quadrantes) ou 'alt' (quadros alternando a cada TVC_ALT_MS com a legenda fixa).
   Quadros: tvcat/<i>.jpg (guardados; outros mundos NUNCA são carregados). Partes de HUD que não aparecem nos prints
   (roupa/carro piscando, círculos no mapa, quadrado das gangues, barra do PIX…) são desenhadas em HTML (campo f).
   Texto PT/EN fica aqui mesmo ([pt,en]) e vai para a tela por data-t + CSS ::before, fora do alcance do LANG_RE.
   REGRA: toda mecânica adicionada ou ajustada ganha (ou atualiza) um canal nesta lista. Plano: tvcat/PLANO.md. */
var TVC={open:false,i:0,altI:0,altT:0,guide:false,gi:0,num:'',numT:0,ret:null,noiseT:0,sw:null,navT:0};
const TVC_ALT_MS=2800;
const TVC_SHIRT='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 3l-6 4 3 4 2-1v11h10V10l2 1 3-4-6-4c-1 2-2 3-4 3S9 5 8 3z"/></svg>';
const TVC_CAR='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 11l2-5h10l2 5h2v6h-2v2h-3v-2H8v2H5v-2H3v-6z M8 8l-1 3h10l-1-3z M6 13v2h3v-2z M15 13v2h3v-2z"/></svg>';
/* p(img, [legenda do quadro pt,en], fx?, opções?) */
function tvcP(i,t,f,o){return Object.assign({i,t,f},o||{})}
const TVCAT=[
 {k:'police',ic:'🚨',c:'#ff4a4a',l:'4',n:['POLÍCIA · PROCURADO','POLICE · WANTED'],
  g:['A polícia só persegue o crime que ela vê. Troque de roupa e de carro para sumir: a área vermelha vira azul-marinho e esmaece, e um crime ali dentro devolve as estrelas.','Police only chase the crimes they see. Change outfit and car to vanish: the red area turns navy blue and fades, and a crime inside it brings the stars back.'],
  p:[tvcP('pol_chase',['PERSEGUIÇÃO','CHASE']),tvcP('pol_chase',['ROUPA E CARRO RECONHECIDOS','OUTFIT AND CAR RECOGNIZED'],'disguise',{dim:1}),tvcP('map_red',['ÁREA DO CRIME','CRIME AREA'],'ringR',{zoom:1}),tvcP('map_blue',['BUSCA ENCERRANDO','SEARCH ENDING'],'ringB',{zoom:1})]},
 {k:'levels',ic:'★',c:'#ffd200',l:'2',n:['NÍVEIS DE PROCURADO','WANTED LEVELS'],
  g:['Explodir 3 coisas na fuga sobe um nível e roubar um helicóptero vai direto para ★★★. Na água vem a lancha da polícia; voar ou navegar até Point Haze despista tudo.','Blowing up 3 things during a chase adds a level and stealing a helicopter jumps straight to ★★★. On water the police boat comes; flying or sailing to Point Haze shakes everyone.'],
  p:[tvcP('tv_chase',['AO VIVO NA TV','LIVE ON TV']),tvcP(null,['O QUE CADA NÍVEL CHAMA','WHAT EACH LEVEL CALLS'],'levels')]},
 {k:'x9',ic:'📞',c:'#ff8a3a',l:'1',n:['TESTEMUNHA · X9','WITNESS · SNITCH'],
  g:['Depois de 5 mortes a pé, o pedestre mais perto foge ligando para a polícia. Você tem 10 s para calar a testemunha. Só no modo livre.','After 5 kills on foot, the nearest pedestrian runs off calling the police. You have 10 s to silence the witness. Free mode only.'],
  p:[tvcP('scn_crash',['LIGANDO PARA O 190','CALLING 911'],'x9',{dim:1})]},
 {k:'blitz',ic:'🚧',c:'#ff9a2a',l:'1',n:['BLITZ','ROADBLOCK'],
  g:['Cones e viaturas fecham a rua. Na blitz a polícia sempre descobre carro roubado: 50% de chance de prisão, 50% de ser liberado.','Cones and patrol cars close the street. At a roadblock the police always spot a stolen car: 50% chance of arrest, 50% of being let go.'],
  p:[tvcP('tv_blitz',['OPERAÇÃO PREVENTIVA','PREVENTIVE OPERATION'])]},
 {k:'jail',ic:'🥄',c:'#f07818',l:'2',n:['PRISÃO E FUGA','JAIL AND ESCAPE'],
  g:['Pena de 5 minutos ou fiança na grade. Depois de 1 minuto o colega passa uma colher: cave 30 s no canto quando o guarda sumir e saia num beco perto da delegacia.','A 5-minute sentence or bail at the bars. After 1 minute your cellmate slips you a spoon: dig 30 s in the corner while the guard is away and come out in an alley near the station.'],
  p:[tvcP('int_jail',['CELA 01','CELL 01'],'dig'),tvcP('poi_police',['DELEGACIA','POLICE STATION'])]},
 {k:'hosp',ic:'🚑',c:'#ff5a6a',l:'2',n:['HOSPITAL E PARAMÉDICO','HOSPITAL AND PARAMEDIC'],
  g:['Morreu, acorda no hospital pagando 10% do dinheiro. Ligue 192 e o paramédico enche sua vida; numa ambulância, T começa a missão de paramédico.','Die and you wake up at the hospital paying 10% of your cash. Dial 192 and the paramedic fills your health; in an ambulance, T starts the paramedic mission.'],
  p:[tvcP('poi_hosp',['HOSPITAL','HOSPITAL']),tvcP('amb',['AMBULÂNCIA','AMBULANCE'])]},
 {k:'weapons',ic:'🔫',c:'#ff6a3a',l:'4',n:['ARMAS','WEAPONS'],
  g:['Segure TAB (L1 no controle) e a roda de armas abre com o tempo lento. Pistola, Magnum, metralhadora, bazuca, granada e bomba programada: plante na parede e detone pelo celular (Agenda › Bomba Remota).','Hold TAB (L1 on a controller) and the weapon wheel opens in slow motion. Pistol, Magnum, SMG, bazooka, grenade and remote bomb: plant it on a wall and detonate it from the phone (Contacts › Remote Bomb).'],
  p:[tvcP('weap_wheel',['RODA DE ARMAS','WEAPON WHEEL']),tvcP('gang_alley',['TIROTEIO','GUNFIGHT'],'tracer'),tvcP('weap_boom',['EXPLOSÃO','EXPLOSION']),tvcP(null,['BOMBA PROGRAMADA','REMOTE BOMB'],'bomb')]},
 {k:'gang',ic:'⬛',c:'#e8d23a',l:'2',n:['GANGUES','GANGS'],
  g:['A gangue amarela e a verde dominam um quarteirão cada. Os 6 do beco atiram em quem chega; derrube todos e ganhe $500. No dia seguinte elas voltam em outro lugar.','The yellow and green gangs each hold a block. The 6 in the alley shoot anyone who comes close; take them all down for $500. The next day they show up somewhere else.'],
  p:[tvcP('gang_alley',['BECO DA GANGUE','GANG ALLEY']),tvcP('map_gang',['QUARTEIRÃO NO MAPA','BLOCK ON THE MAP'],'gang',{zoom:1})]},
 {k:'emp',ic:'🏢',c:'#ff8c1a',l:'1',n:['IMPÉRIOS','EMPIRES'],
  g:['Prédios com ícone laranja são negócios de gangue. Limpe o interior, compre o prédio e escolha Drogas, Contrabando ou Roubo; o lucro sai todo dia na porta.','Buildings with an orange icon are gang businesses. Clear the inside, buy the building and pick Drugs, Smuggling or Robbery; profit is collected at the door every day.'],
  p:[tvcP('emp',['NEGÓCIO DE GANGUE','GANG BUSINESS'])]},
 {k:'jammer',ic:'◉',c:'#3ad8ff',l:'3',n:['ctOS · JAMMER','ctOS · JAMMER'],
  g:['App ctOS ($3.800 na AMOnições). O JAMMER apaga 100 m à noite; de dia deixa todos os semáforos verdes e o trânsito bate; perto da ponte levadiça, ergue a ponte.','ctOS app ($3,800 at AMOnições). The JAMMER blacks out 100 m at night; by day it turns every light green and traffic crashes; near a drawbridge, it raises the bridge.'],
  p:[tvcP('jam_night',['NOITE: APAGÃO','NIGHT: BLACKOUT'],'scan'),tvcP('jam_day',['DIA: SINAIS VERDES','DAY: GREEN LIGHTS']),tvcP('poi_bridge',['A PONTE SOBE','THE BRIDGE RISES'])]},
 {k:'prof',ic:'👤',c:'#3ad8ff',l:'2',n:['ctOS · PERFIL E PIX','ctOS · PROFILE AND PIX'],
  g:['Aponte o celular para alguém e veja nome, ficha e saldo. Para hackear o PIX fique entre 6 e 24 m: perto demais ele chama a polícia, longe demais o sinal cai.','Point the phone at someone to see name, record and balance. To hack their PIX stay between 6 and 24 m: too close and they call the police, too far and the signal drops.'],
  p:[tvcP('ph_prof',['PERFIL','PROFILE'],null,{fit:1}),tvcP('car_dmc',['HACKEAR PIX','HACK PIX'],'pix',{dim:1})]},
 {k:'phone',ic:'📱',c:'#3ae08a',l:'3',n:['CELULAR','PHONE'],
  g:['Uma vez por dia o celular toca e aparece na tela: pode ser propaganda ou golpe, e cair no golpe custa dinheiro. 190 polícia, 192 ambulância, 555 táxi.','Once a day the phone rings and pops up on screen: it may be an ad or a scam, and falling for the scam costs money. 190 police, 192 ambulance, 555 taxi.'],
  p:[tvcP('ph_call',['CHAMADA','INCOMING CALL'],null,{fit:1}),tvcP('ph_home',['INÍCIO','HOME'],null,{fit:1}),tvcP('ph_apps',['APPS','APPS'],null,{fit:1})]},
 {k:'scenes',ic:'🎬',c:'#ffcc33',l:'alt',n:['CENAS DE RUA','STREET SCENES'],
  g:['A cada poucos minutos algo acontece na rua. Derrube o ladrão de bolsa ($50) ou o bandido que o guarda persegue (+$10).','Every few minutes something happens on the street. Take down the purse snatcher ($50) or the thug the guard is chasing (+$10).'],
  p:[tvcP('scn_purse',['LADRÃO DE BOLSA','PURSE SNATCHER']),tvcP('scn_chase',['GUARDA ATRÁS DO BANDIDO','GUARD CHASING A THUG']),tvcP('scn_crash',['BATIDA COM DISCUSSÃO','CRASH AND ARGUMENT']),tvcP('scn_stop',['ABORDAGEM POLICIAL','POLICE STOP']),tvcP('scn_dog',['CARINHO NO CACHORRO','PETTING A DOG']),tvcP('scn_skate',['MANOBRA DE SKATE','SKATE TRICK'])]},
 {k:'carrx',ic:'📸',c:'#ffd24a',l:'1',n:['PEDESTRES E SEU CARRO','PEDESTRIANS AND YOUR CAR'],
  g:['Pedestres elogiam carro de luxo, fotografam o DeLorean, xingam quem sobe na calçada e às vezes pedem carona ($20–60).','Pedestrians praise luxury cars, take photos of the DeLorean, curse whoever drives on the sidewalk and sometimes ask for a ride ($20–60).'],
  p:[tvcP('car_dmc',['FOTO DO DeLOREAN','DeLOREAN PHOTO'],'flash')]},
 {k:'pedev',ic:'🚨',c:'#ff5a5a',l:'alt',n:['EVENTOS DE PEDESTRES','PEDESTRIAN EVENTS'],
  g:['Pedestres trocam tiros, alguém arranca um motorista do carro e seu carro de luxo parado na rua pode ser roubado. Quando é você quem rouba, o dono pode fugir, correr atrás para pegar o carro de volta ou sacar uma arma.','Pedestrians trade shots, someone pulls a driver out of a car and your luxury car parked on the street can get stolen. When you are the thief, the owner may run, chase you to take the car back or pull a gun.'],
  p:[tvcP('pedev',['ROUBO DE CARRO NA RUA','STREET CARJACKING']),tvcP('scn_chase',['TIROTEIO ENTRE PEDESTRES','PEDESTRIAN SHOOTOUT'],'tracer'),tvcP('car_dmc',['SEU CARRO DE LUXO NA MIRA','YOUR LUXURY CAR IS A TARGET'])]},
 {k:'cars',ic:'💥',c:'#ff8a3a',l:'2',n:['CARROS: DANO E DIREÇÃO','CARS: DAMAGE AND DRIVING'],
  g:['Cada batida amassa a zona atingida e pode deixar o para-choque pendurado. W + S + direção faz zerinho, Espaço puxa o freio de mão, SHIFT é o nitro do superesportivo. A ré tem marcha única e vai até 30 km/h.','Every crash dents the area that was hit and can leave the bumper hanging. W + S + steering does donuts, Space pulls the handbrake, SHIFT is the supercar\'s nitro. Reverse has a single gear and tops out at 30 km/h.'],
  p:[tvcP('car_dmg',['AMASSADO POR ZONA','DENTS BY ZONE']),tvcP('car_spin',['ZERINHO','DONUTS'])]},
 {k:'gas',ic:'⛽',c:'#ffb020',l:'3',n:['POSTO E CONVENIÊNCIA','GAS STATION AND STORE'],
  g:['Na bomba: abasteça (o combustível acaba) e conserte a lataria. Terra e lama sujam o carro: pare entre os trilhos do lava-jato e o rolete deixa ele novo ($15). Na conveniência, compre um lanche ou mire no caixa para assaltar antes que ele aperte o alarme.','At the pump: refuel (fuel runs out) and repair the body. Dirt and mud soil the car: stop between the car wash rails and the rollers make it like new ($15). In the store, buy a snack or aim at the cashier to rob it before they hit the alarm.'],
  p:[tvcP('gas_pump',['NA BOMBA','AT THE PUMP'],'pump'),tvcP('gas_shop',['CONVENIÊNCIA','CONVENIENCE STORE'],'alarm'),tvcP('gas_wash',['LAVA-JATO','CAR WASH'])]},
 {k:'mask',ic:'🎭',c:'#7ad84a',l:'1',n:['A MASKARA','THE MASK'],
  g:['A Maskara do Nathan vem do laboratório de Point Haze: disfarce na hora, arsenal infinito e corrida sobre a água.','Nathan\'s Mask comes from the Point Haze lab: instant disguise, infinite arsenal and running on water.'],
  p:[tvcP('mask_on',['NATHAN COM A MASKARA','NATHAN WEARING THE MASK'])]},
 {k:'inv',ic:'🌑',c:'#b04aff',l:'2',n:['UPSIDE DOWN','UPSIDE DOWN'],
  g:['A Fenda leva ao mundo invertido: a mesma cidade, apagada e podre, com fantasmas e Demogorgons. Só a lanterna do celular e os faróis iluminam.','The Rift leads to the inverted world: the same city, dark and rotten, with ghosts and Demogorgons. Only the phone flashlight and headlights shine.'],
  p:[tvcP('w_inv1',['A FENDA','THE RIFT'],null,{br:2.1}),tvcP('w_inv2',['RUAS APAGADAS','DARK STREETS'],null,{br:2.6})]},
 {k:'haze',ic:'🏝',c:'#d8b070',l:'2',n:['POINT HAZE','POINT HAZE'],
  g:['Uma ilha do outro lado do mar, com o laboratório. Vá de hovercraft, lancha ou helicóptero; atravessar o mar despista a polícia.','An island across the sea, home of the lab. Go by hovercraft, boat or helicopter; crossing the sea shakes off the police.'],
  p:[tvcP('w_haze1',['O PÍER','THE PIER']),tvcP('w_haze2',['A ILHA','THE ISLAND'])]},
 {k:'synth',ic:'🌆',c:'#ff3aa8',l:'2',n:['SYNTHWAVE · DeLOREAN','SYNTHWAVE · DeLOREAN'],
  g:['A 140 km/h o DeLorean viaja no tempo para o Synthwave: cidade neon de arranha-céus e palmeiras. Ele mora na garagem da micro-ilha.','At 140 km/h the DeLorean travels in time to Synthwave: a neon city of skyscrapers and palm trees. It lives in the micro-island garage.'],
  p:[tvcP('w_synth1',['O DeLOREAN','THE DeLOREAN']),tvcP('w_synth2',['A CIDADE NEON','THE NEON CITY'])]},
 {k:'neon',ic:'💡',c:'#ff4fa3',l:'4',n:['LETREIROS NEON','NEON SIGNS'],
  g:['Bares, hotéis e prédios têm letreiros de estilos diferentes: bandeira em pé presa na fachada, nome em cursivo feito só com o tubo de neon, marquise com lâmpadas e ícone com anel. No Synthwave a variedade é maior; no Upside Down ficam apagados.','Bars, hotels and buildings have different sign styles: upright blade signs on the facade, names in cursive made only of neon tube, marquees with bulbs and icons with a ring. Synthwave has even more variety; in the Upside Down they are off.'],
  p:[tvcP('neon_bandeira',['BANDEIRA','BLADE SIGN']),tvcP('neon_cursivo',['CURSIVO DE NEON','NEON SCRIPT']),tvcP('neon_marquise',['MARQUISE','MARQUEE']),tvcP('neon_icone',['ÍCONE','ICON'])]},
 {k:'backrooms',ic:'🟨',c:'#f2dc72',l:'2',n:['BACKROOMS','BACKROOMS'],
  g:['O fundo do buraco da obra falha. Pule nele e você atravessa o chão: labirinto amarelo, sem ninguém. Depois de 10 minutos, entidades lentas aparecem. A saída é o trecho com falha no minimapa, que também muda a cada 3 minutos. No online, todos caem no mesmo labirinto.','The bottom of the roadwork hole glitches. Jump in and you fall through the floor: a yellow maze, nobody else. After 10 minutes, slow entities show up. The exit is the glitched stretch on the minimap, which also moves every 3 minutes. Online, everyone falls into the same maze.'],
  p:[tvcP('w_back1',['ATRAVESSANDO O CHÃO','FALLING THROUGH THE FLOOR']),tvcP('w_back2',['NÍVEL 0','LEVEL 0'])]},
 {k:'weather',ic:'⛈',c:'#8fb4ff',l:'alt',n:['CLIMA','WEATHER'],
  g:['Tempestades fecham o céu e, de vez em quando, acontece um eclipse solar. Cada minuto do relógio dura 3 segundos: um dia inteiro leva 72 minutos.','Storms close in over the sky and, now and then, a solar eclipse happens. Each clock minute lasts 3 seconds: a full day takes 72 minutes.'],
  p:[tvcP('storm2',['TEMPESTADE','STORM'],'rain'),tvcP('clouds_storm',['FRENTE DA TEMPESTADE','STORM FRONT']),tvcP('eclipse2',['ECLIPSE SOLAR','SOLAR ECLIPSE'],'corona')]},
 {k:'obra',ic:'🦺',c:'#ffb020',l:'1',n:['OBRAS NA RUA','ROADWORKS'],
  g:['Todo dia uma rua fecha para obra, o dia inteiro. O GPS e o trânsito desviam, e no mapa ela aparece pontilhada de vermelho. O fundo do buraco falha: é a entrada das Backrooms.','Every day one street closes for roadworks, all day long. GPS and traffic detour, and the map shows it dotted in red. The bottom of the hole glitches: it is the way into the Backrooms.'],
  p:[tvcP('obra',['RUA FECHADA','STREET CLOSED'])]},
 {k:'bridge',ic:'🌉',c:'#e0e0e0',l:'1',n:['PONTES LEVADIÇAS','DRAWBRIDGES'],
  g:['Sobem em 5 s e ficam abertas 1 min. Com velocidade dá para saltar o vão. Procurado, elas sobem sozinhas; a guarita força a descida.','They rise in 5 s and stay open for 1 min. With enough speed you can jump the gap. When you are wanted they rise on their own; the booth forces them down.'],
  p:[tvcP('poi_bridge',['A PONTE','THE BRIDGE'])]},
 {k:'para',ic:'🪂',c:'#ff6ab0',l:'2',n:['PARAQUEDAS','PARACHUTE'],
  g:['Salte de paraquedas e mire no alvo da praia: borda $60, anel do meio $150, na mosca $300.','Skydive and aim for the target on the beach: edge $60, middle ring $150, bullseye $300.'],
  p:[tvcP('tv_parachute',['O SALTO','THE JUMP']),tvcP('beach2',['A PRAIA','THE BEACH'],'target')]},
 {k:'casino',ic:'🎰',c:'#ffcf3a',l:'2',n:['CASSINO','CASINO'],
  g:['Caça-níqueis, blackjack, pôquer, roleta, sinuca e Liar\'s Dice. No menu de pausa, MINIGAMES leva direto às mesas.','Slots, blackjack, poker, roulette, pool and Liar\'s Dice. In the pause menu, MINIGAMES takes you straight to the tables.'],
  p:[tvcP('poi_casino',['A FACHADA','THE FRONT']),tvcP('int_casino',['O SALÃO','THE FLOOR'])]},
 {k:'loot',ic:'🔫',c:'#7dffb0',l:'2',n:['ESPÓLIO E CONTA CORRENTE','LOOT AND CHECKING ACCOUNT'],
  g:['Quem morre armado larga a arma e o dinheiro do lado do corpo; somem junto com ele. No online cai TODO o seu dinheiro em mãos. A conta corrente do banco (caixas eletrônicos do saguão) não cai e paga o hospital quando falta.','Anyone who dies armed drops the gun and cash next to the body; they vanish with it. Online ALL your cash in hand drops. The bank ATM account (lobby ATMs) never drops and pays the hospital when cash runs short.'],
  p:[tvcP('espolio',['ARMA E DINHEIRO NO CHÃO','GUN AND CASH ON THE GROUND']),tvcP('caixa2',['CONTA CORRENTE','CHECKING ACCOUNT'])]},
 {k:'atm',ic:'🏧',c:'#4fd27a',l:'2',n:['CAIXAS ELETRÔNICOS','STREET ATMS'],
  g:['Caixas nas calçadas da cidade (cédula verde no mapa): depositar e sacar da conta corrente sem ir ao banco. Explodir um dá 2 estrelas, solta de $500 a $1.500 e ele fica queimado por 24 h de jogo (cédula vermelha). De vez em quando alguém para pra sacar: quem acabou de usar o caixa carrega o dobro de dinheiro.','ATMs on the city sidewalks (green bill on the map): deposit and withdraw from your checking account without going to the bank. Blowing one up gives 2 stars, drops $500 to $1,500 and leaves it burned out for 24 game hours (red bill). Now and then someone stops to withdraw: whoever just used the ATM carries double cash.'],
  p:[tvcP('atm_rua',['NA CALÇADA','ON THE SIDEWALK']),tvcP('atm_boom',['EXPLODIDO · 24 H','BLOWN UP · 24 H']),tvcP('atm_mapa',['CÉDULA NO MAPA','BILL ON THE MAP'])]},
 {k:'loan',ic:'💸',c:'#7ae07a',l:'1',n:['AGIOTA','LOAN SHARK'],
  g:['Em MINIGAMES, o agiota empresta $10.000 por 10 horas. Atrasou, chegam 3 carros de cobradores a cada 5 horas até você quitar.','In MINIGAMES, the loan shark lends $10,000 for 10 hours. Pay late and 3 cars of collectors show up every 5 hours until you pay.'],
  p:[tvcP('int_casino',['$10.000 · 10 H','$10,000 · 10 H'],'loan',{dim:1})]},
 {k:'club',ic:'🪩',c:'#c04aff',l:'2',n:['DANCETERIA','NIGHTCLUB'],
  g:['Fila na porta e show no palco só depois das 22h. De dia a pista fica quase vazia.','A line at the door and a show on stage only after 10 PM. By day the dance floor is nearly empty.'],
  p:[tvcP('poi_club',['A PORTA','THE DOOR']),tvcP('int_club',['A PISTA','THE DANCE FLOOR'])]},
 {k:'bank',ic:'🏦',c:'#5ac0ff',l:'2',n:['ASSALTO AO BANCO','BANK HEIST'],
  g:['No balcão, com uma arma, E anuncia o assalto: 3 estrelas na hora e 8 policiais. Derrube todos e o cofre abre (+$1.000).','At the counter, holding a gun, E announces the heist: 3 stars at once and 8 officers. Take them all down and the vault opens (+$1,000).'],
  p:[tvcP('poi_bank',['SUNSET BANK','SUNSET BANK']),tvcP('int_bank2',['O SAGUÃO','THE LOBBY'])]},
 {k:'vinyl',ic:'💿',c:'#ffd24a',l:'2',n:['DISCOS RAROS','RARE RECORDS'],
  g:['15 discos raros estão escondidos pela cidade. Eles só contam para a coleção depois de vendidos na casa de penhores ($150 cada).','15 rare records are hidden around the city. They only count toward the collection once sold at the pawn shop ($150 each).'],
  p:[tvcP(null,['COLEÇÃO','COLLECTION'],'vinyl'),tvcP('int_pawn2',['CASA DE PENHORES','PAWN SHOP'])]},
 {k:'houses',ic:'📺',c:'#9a7aff',l:'2',n:['ASSALTO A RESIDÊNCIAS','HOME BURGLARY'],
  g:['Das 22h às 8h aparecem setas em casas. Lá dentro você tem 15 s para pegar TV, micro-ondas, DVD e celular antes de um vizinho chamar a polícia. Tudo vira dinheiro na casa de penhores; cuidado com o cachorro no quintal.','From 10 PM to 8 AM arrows appear over houses. Inside you have 15 s to grab the TV, microwave, DVD player and phone before a neighbor calls the police. It all turns into cash at the pawn shop; watch out for the dog in the yard.'],
  p:[tvcP('heist_out',['SETA NA CASA','ARROW ON THE HOUSE']),tvcP('heist_in',['15 s PARA SAIR','15 s TO GET OUT'],'timer')]},
 {k:'safe',ic:'🏠',c:'#ffd24a',l:'1',n:['CASA SEGURA','SAFEHOUSE'],
  g:['Salva o jogo, enche a vida e guarda 2 carros na garagem. O conversível da missão 1 mora na vaga 1.','Saves the game, refills health and keeps 2 cars in the garage. The convertible from mission 1 lives in spot 1.'],
  p:[tvcP('poi_safe',['CASA E GARAGEM','HOUSE AND GARAGE'])]},
 {k:'tune',ic:'🔧',c:'#ff4ae0',l:'1',n:['OFICINA','GARAGE SHOP'],
  g:['Turbo ($1.500) dobra a velocidade final e o neon embaixo do carro custa $300. Pintar o carro também despista a polícia.','Turbo ($1,500) doubles top speed and the underglow costs $300. A new paint job also shakes off the police.'],
  p:[tvcP('poi_tune',['TURBO E NEON','TURBO AND NEON'])]},
 {k:'deal',ic:'🚗',c:'#4a9aff',l:'1',n:['CONCESSIONÁRIA','CAR DEALER'],
  g:['Coastal Car Shop: escolha veículo e cor na plataforma giratória. De $1.200 (moto) a $25.000 (supercarro), com documento no seu nome.','Coastal Car Shop: pick a vehicle and color on the turntable. From $1,200 (bike) to $25,000 (supercar), registered in your name.'],
  p:[tvcP('car_dmc',['COASTAL CAR SHOP','COASTAL CAR SHOP'],'deal',{dim:1})]},
 {k:'race',ic:'🏁',c:'#f0f0f0',l:'2',n:['CORRIDA E ARRANCADA','RACE AND DRAG'],
  g:['Só à noite (22h às 8h). Corrida: 7 checkpoints contra 2 rivais. Arrancada: 300 m em reta com nitro.','Only at night (10 PM to 8 AM). Race: 7 checkpoints against 2 rivals. Drag: a 300 m straight with nitro.'],
  p:[tvcP('side_race',['CORRIDA','RACE']),tvcP('side_drag',['ARRANCADA','DRAG'])]},
 {k:'rampage',ic:'💀',c:'#ff4a4a',l:'1',n:['RAMPAGE','RAMPAGE'],
  g:['Encoste a pé numa caveira: 90 s de Demogorgons sem fim. $10 por abate e $100 se sobreviver.','Touch a skull on foot: 90 s of endless Demogorgons. $10 per kill and $100 if you survive.'],
  p:[tvcP('side_skull',['A CAVEIRA','THE SKULL'])]},
 {k:'forest',ic:'🌲',c:'#5ad05a',l:'2',n:['FLORESTA E CEMITÉRIO','FOREST AND CEMETERY'],
  g:['Há rumores de que um Demogorgon escapou e se esconde na mata. O cemitério do mausoléu fica sombrio à noite.','Rumor has it a Demogorgon escaped and hides in the woods. The mausoleum cemetery gets eerie at night.'],
  p:[tvcP('poi_forest',['A MATA','THE WOODS']),tvcP('poi_cem',['O CEMITÉRIO','THE CEMETERY'])]},
 {k:'isle',ic:'🛂',c:'#4ad0c0',l:'1',n:['MICRO-ILHA · PEDÁGIO','MICRO-ISLAND · TOLL'],
  g:['Um quarteirão cercado de água, com uma única ponte e pedágio de $10. Furar a cancela chama a polícia; a garagem da ilha guarda o DeLorean.','A block surrounded by water, with a single bridge and a $10 toll. Crashing the gate calls the police; the island garage keeps the DeLorean.'],
  p:[tvcP('isle',['A ILHA','THE ISLAND'])]},
 {k:'skate',ic:'🛹',c:'#ff4a4a',l:'2',n:['SKATE','SKATEBOARD'],
  g:['F sobe e desce da prancha, Espaço pula. Prancha nova na Skate Shop do shopping ($120), com estampa, texto ou emojis.','F hops on and off the board, Space jumps. New boards at the mall\'s Skate Shop ($120), with graphics, text or emojis.'],
  p:[tvcP('skate_pl',['NA RUA','ON THE STREET']),tvcP('scn_skate',['SKATISTAS DA ORLA','BOARDWALK SKATERS'])]},
 {k:'emoji',ic:'😀',c:'#ffd23a',l:'4',n:['EMOJIS NA CAMISETA E NO SKATE','EMOJIS ON SHIRTS AND SKATEBOARDS'],
  g:['Todos os emojis, com tom de pele. Emoji no peito na Moda Pixel ($25) e na tela do online; até 3 no shape na Skate Shop. Pedestres também usam.','Every emoji, with skin tones. Emoji on the chest at Pixel Fashion ($25) and on the online screen; up to 3 on the deck at the Skate Shop. Pedestrians wear them too.'],
  p:[tvcP('emo_kb',['TECLADO DE EMOJIS','EMOJI KEYBOARD']),tvcP('emo_shirt',['CAMISETA','T-SHIRT']),tvcP('emo_skate',['SHAPE DO SKATE','SKATEBOARD DECK']),tvcP('emo_peds',['NA RUA','ON THE STREET']),tvcP('emo_online',['ONLINE','ONLINE'])]},
 {k:'vehicles',ic:'🚁',c:'#ff7a1a',l:'4',n:['HELICÓPTERO, VORTEX E JET SKI','HELICOPTER, VORTEX AND JET SKI'],
  g:['Helicópteros nos helipontos, o hovercraft Vortex na areia ao lado do farol e jet skis na beira da praia e no píer. No mar passam navios cargueiros: dá para subir de lancha ou pousar o helicóptero no convés.','Helicopters on the helipads, the Vortex hovercraft on the sand by the lighthouse and jet skis on the shore and at the pier. Cargo ships sail by at sea: climb aboard from a boat or land the helicopter on deck.'],
  p:[tvcP('veh_heli',['HELIPONTO','HELIPAD']),tvcP('veh_vortex',['VORTEX','VORTEX']),tvcP('veh_jet',['JET SKI','JET SKI']),tvcP('ship2',['NAVIO CARGUEIRO','CARGO SHIP'])]},
 {k:'ramp',ic:'🛫',c:'#ff8a1a',l:'1',n:['RAMPAS E SALTOS','RAMPS AND STUNT JUMPS'],
  g:['Rampas nos píeres e pela cidade lançam o carro longe. Nos saltos insanos a câmera muda de lugar e o tempo desacelera.','Ramps on the piers and around the city launch your car far. On insane jumps the camera moves and time slows down.'],
  p:[tvcP('ramp',['NO AR','AIRBORNE'])]},
 {k:'taxi',ic:'🚕',c:'#ffd200',l:'1',n:['TÁXI E MISSÕES DE VEÍCULO','TAXI AND VEHICLE MISSIONS'],
  g:['G assobia para um táxi ou ligue 555. Dentro de táxi, viatura ou ambulância, T começa a missão: taxista, vigilante ou paramédico.','G whistles for a cab, or dial 555. In a taxi, patrol car or ambulance, T starts the mission: cab driver, vigilante or paramedic.'],
  p:[tvcP('taxi',['TÁXI','TAXI'])]},
 {k:'mall',ic:'🛍',c:'#ff8ad8',l:'1',n:['SHOPPING','MALL'],
  g:['2 andares e 17 lojas: roupas, celulares, discos, farmácia, joias e skate. Vazio de dia, cheio à noite.','2 floors and 17 stores: clothes, phones, records, pharmacy, jewelry and skateboards. Empty by day, packed at night.'],
  p:[tvcP('mall_int',['À NOITE','AT NIGHT'])]},
 {k:'duo',ic:'👫',c:'#ff6ab0',l:'1',n:['NATHAN E CLAIRE','NATHAN AND CLAIRE'],
  g:['Alt troca de personagem. Caps Lock é o especial: bullet time do Nathan a pé, câmera lenta da Claire ao volante. Juntos no carro, um dirige e o outro atira.','Alt switches character. Caps Lock is the special: Nathan\'s bullet time on foot, Claire\'s slow motion behind the wheel. Together in a car, one drives and the other shoots.'],
  p:[tvcP(null,['DOIS PERSONAGENS','TWO CHARACTERS'],'duo')]},
 {k:'online',ic:'🌐',c:'#3ae08a',l:'1',n:['ONLINE','ONLINE'],
  g:['Jogue na mesma cidade com outras pessoas: os carros dos jogadores batem entre si e todos veem a vida e os amassados de cada um. O ESC não pausa. G pede carona no carro de alguém e a troca de mundo leva todos juntos.','Play in the same city with other people: players\' cars crash into each other and everyone sees each car\'s health and dents. ESC does not pause. G hitches a ride in someone\'s car and a world change takes everyone along.'],
  p:[tvcP(null,['CARONA','RIDE'],'online')]},
 {k:'pixnet',ic:'📡',c:'#3ad8ff',l:'1',n:['ONLINE · HACK DE PIX','ONLINE · PIX HACK'],
  g:['No online, o ctOS hackeia outros jogadores: aponte o PERFIL, fique entre 6 e 24 m e leve 20% do saldo (até $5.000). O Bloqueador de Sinal ($5.000 na AMOnições) protege o seu.','Online, ctOS hacks other players: aim PROFILE, stay 6 to 24 m away and take 20% of their balance (up to $5,000). The Signal Jammer ($5,000 at AMOnições) protects yours.'],
  p:[tvcP('ph_prof',['HACKEAR JOGADOR','HACK A PLAYER'],'pix',{fit:1}),tvcP(null,['BLOQUEADOR DE SINAL','SIGNAL JAMMER'],'sigblock')]},
 {k:'netrank',ic:'🏆',c:'#ffd23a',l:'2',n:['ONLINE · RANKING','ONLINE · RANKING'],
  g:['A tela de entrada do online mostra o top 10 por abates/mortes, somados na conta. O líder de cada categoria ganha um título. Depois de renascer, 15 s imortal e semitransparente para todos; atacar alguém acaba com a proteção.','The online login screen shows the top 10 by kills/deaths, added up on the account. Each category leader earns a title. After respawning, 15 s immortal and see-through for everyone; attacking someone ends the protection.'],
  p:[tvcP('net_rank',['RANKING E TÍTULOS','RANKING AND TITLES'],null,{fit:1}),tvcP(null,['RENASCER PROTEGIDO','RESPAWN PROTECTION'],'netprot')]},
 {k:'radio',ic:'📻',c:'#ff6ab0',l:'1',n:['RÁDIO E HEADPHONE','RADIO AND HEADPHONES'],
  g:['Segure Q para a roda do rádio; vírgula e ponto trocam a música. A KRFM toca ao vivo, carros que passam tocam música e, com o headphone da loja de eletrônicos, as rádios tocam a pé.','Hold Q for the radio wheel; comma and period change the song. KRFM plays live, passing cars play music and, with headphones from the electronics store, the stations play on foot.'],
  p:[tvcP('radio_wheel',['RODA DO RÁDIO','RADIO WHEEL'])]},
 {k:'news',ic:'🗞',c:'#e8e0c8',l:'2',n:['NOTÍCIAS','NEWS'],
  g:['Na banca, o jornal de $1 conta o que você aprontou: perseguições, prisões e explosões. No online, quem matou quem e os hacks de PIX também viram manchete. Em casa, a TV mostra plantões ao vivo da cidade.','At the newsstand, the $1 paper reports what you got up to: chases, arrests and explosions. Online, player kills and PIX hacks make the headlines too. At home, the TV shows live city bulletins.'],
  p:[tvcP('news',['BANCA DE JORNAL · $1','NEWSSTAND · $1'],null,{fit:1}),tvcP('tv_chase',['TV DA CASA','HOME TV'])]},
 {k:'controls',ic:'🎮',c:'#e6bf61',l:'3',n:['CONTROLES','CONTROLS'],
  g:['No controle, △ faz a ação do lugar: entra no carro, compra, abre o guarda-roupa. ✕ só corre. Esquema Moderno: ✕ pula, □ soco, L3 corre. No celular, segure ARMA para a roda e mude os botões em Controles de toque.','On a controller, △ does the context action: enter the car, buy, open the wardrobe. ✕ only sprints. Modern layout: ✕ jumps, □ punches, L3 sprints. On phones, hold WEAPON for the wheel and move the buttons in Touch controls.'],
  p:[tvcP(null,['CLÁSSICO × MODERNO','CLASSIC × MODERN'],'padmap'),tvcP('touch_edit',['EDITAR BOTÕES','EDIT BUTTONS'],null,{fit:1})]},
 {k:'photo',ic:'📷',c:'#f0f0f0',l:'1',n:['MODO FOTO','PHOTO MODE'],
  g:['No menu de pausa, 📷 congela o jogo: câmera livre, FOV, filtros e foto sem a interface.','In the pause menu, 📷 freezes the game: free camera, FOV, filters and a shot without the HUD.'],
  p:[tvcP('photo',['CÂMERA LIVRE','FREE CAMERA'])]},
 {k:'char3d',ic:'🧍',c:'#2f6fd6',l:'1',n:['PERSONAGENS 3D','3D CHARACTERS'],
  g:['Gráficos › Visual dos personagens: 2D, 2.5D ou 3D. O 3D (experimental) é um boneco low-poly com a roupa de cada um; atropelado ou na explosão, o corpo cai solto.','Graphics › Character look: 2D, 2.5D or 3D. 3D (experimental) is a low-poly figure wearing each person\'s outfit; hit by a car or caught in a blast, the body goes limp.'],
  p:[tvcP('char3d_rua',['NA RUA','ON THE STREET']),tvcP('char3d_perto',['DE PERTO','UP CLOSE']),tvcP('char3d_retrato',['RETRATO NAS CONVERSAS','PORTRAIT IN DIALOGUE']),tvcP('char3d_pets',['CÃES E GATOS','DOGS AND CATS']),tvcP('char3d_ragdoll',['CORPO SOLTO','RAGDOLL'])]},
 {k:'cheats',ic:'⌨',c:'#7ae07a',l:'2',n:['CHEATS','CHEATS'],
  g:['Aperte ` (crase) e digite o código: HESOYAM, AEZAKMI, THEMASK, IMPOSSIBLETOSEE e outros. Atenção: qualquer cheat bloqueia o save até um jogo novo.','Press ` (backtick) and type a code: HESOYAM, AEZAKMI, THEMASK, IMPOSSIBLETOSEE and more. Warning: any cheat blocks saving until a new game.'],
  p:[tvcP('cheat_box',['CAIXA DE CHEAT','CHEAT BOX']),tvcP('its',['IMPOSSIBLETOSEE','IMPOSSIBLETOSEE'])]}
];
function tvcL(a){return Array.isArray(a)?(S.lang==='en'?a[1]:a[0]):(a||'')}
function tvcE(s){return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;')}
function tvcT(a,cls){return '<span class="'+(cls||'t')+'" data-t="'+tvcE(tvcL(a))+'"></span>'}
function tvcSrc(i){return 'tvcat/'+i+'.jpg'}
function tvcFx(f){
 if(f==='disguise')return '<div class="fx-dis">'+tvcT(['ZONA','ZONE'],'fx-tag')+'<i class="ic">'+TVC_SHIRT+'</i><i class="ic">'+TVC_CAR+'</i></div>';
 if(f==='ringR')return '<div class="fx-ring r"></div>';
 if(f==='ringB')return '<div class="fx-ring b"></div>';
 if(f==='gang')return '<div class="fx-gang y"></div><div class="fx-gang gr"></div>';
 if(f==='levels'){const r=[['★','1 viatura','1 patrol car'],['★★','2 viaturas atirando','2 patrol cars shooting'],['★★★','helicóptero atirando do alto','helicopter shooting from above']];
  return '<div class="fx-lv">'+r.map(q=>'<div><b data-t="'+q[0]+'"></b>'+tvcT([q[1],q[2]])+'</div>').join('')+'</div>'}
 if(f==='x9')return '<div class="fx-x9"><b>📞</b><span class="n" data-t="190"></span><i class="bar"><u></u></i>'+tvcT(['10 s para calar a testemunha','10 s to silence the witness'])+'</div>';
 if(f==='pix')return '<div class="fx-pix">'+tvcT(['PIX · 6–24 m','PIX · 6–24 m'])+'<i class="bar"><u></u></i></div>';
 if(f==='scan')return '<div class="fx-scan"><i></i><i></i><i></i><i></i></div>';
 if(f==='flash')return '<div class="fx-flash"></div>';
 if(f==='rain')return '<div class="fx-bolt"></div>';
 if(f==='tracer')return '<div class="fx-tracer"><i></i><i></i><i></i></div>';
 if(f==='bomb')return '<div class="fx-card"><b class="big" data-t="💣"></b>'+tvcT(['plante na parede ou no chão','plant it on a wall or the floor'])+tvcT(['celular › Agenda › Bomba Remota','phone › Contacts › Remote Bomb'],'t warn')+'</div>';
 if(f==='timer')return '<div class="fx-dig">'+tvcT(['TV · MICRO-ONDAS · DVD · CELULAR','TV · MICROWAVE · DVD · PHONE'])+'<i class="bar"><u class="drain"></u></i></div>';
 if(f==='padmap'){const r=[['△','ação do lugar · entrar','context action · enter'],['✕','correr  ·  moderno: pular','sprint  ·  modern: jump'],['□','pular  ·  moderno: soco','jump  ·  modern: punch'],['L3','moderno: liga a corrida','modern: toggle sprint']];
  return '<div class="fx-lv">'+r.map(q=>'<div><b data-t="'+q[0]+'"></b>'+tvcT([q[1],q[2]])+'</div>').join('')+'</div>'}
 if(f==='touchfade')return '<div class="fx-tch"><i class="m"></i><i class="b"></i><i class="b"></i><i class="b"></i><i class="j"></i><span class="h" data-t="'+tvcE(tvcL(['ENTRAR','ENTER']))+'"></span></div>';
 if(f==='pump')return '<div class="fx-pump">'+tvcT(['ABASTECER','REFUEL'])+tvcT(['CONSERTAR','REPAIR'])+'</div>';
 if(f==='alarm')return '<div class="fx-alarm">'+tvcT(['ASSALTO!','ROBBERY!'])+'</div>';
 if(f==='corona')return '<div class="fx-corona"></div>';
 if(f==='deal')return '<div class="fx-card"><b class="big" data-t="$1.200 – $25.000"></b>'+tvcT(['da moto ao supercarro, na cor que você quiser','from motorbike to supercar, in any color'])+tvcT(['o carro novo vai direto para a garagem','the new car goes straight to the garage'])+'</div>';
 if(f==='target')return '<div class="fx-target"><i></i><i></i><i></i></div>';
 if(f==='dig')return '<div class="fx-dig">'+tvcT(['COLHER · 30 s CAVANDO','SPOON · 30 s OF DIGGING'])+'<i class="bar"><u></u></i></div>';
 if(f==='loan')return '<div class="fx-card"><b class="big" data-t="$10.000"></b>'+tvcT(['10 horas para pagar','10 hours to pay back'])+tvcT(['atrasou: 3 carros de cobradores','late: 3 cars of collectors'],'t warn')+'</div>';
 if(f==='vinyl')return '<div class="fx-card"><div class="disc"></div><b class="big" data-t="15"></b>'+tvcT(['discos pela cidade','records around the city'])+tvcT(['venda: $150 cada','sell: $150 each'])+'</div>';
 if(f==='duo')return '<div class="fx-card duo"><div class="pair"><span class="who n" data-t="N"></span><span class="who c" data-t="C"></span></div><div class="pair lbl"><span data-t="NATHAN"></span><span data-t="CLAIRE"></span></div>'+tvcT(['ALT troca · CAPS LOCK especial','ALT switch · CAPS LOCK special'])+'</div>';
 if(f==='netprot')return '<div class="fx-card"><div style="font-size:64px;opacity:.42">🧍</div>'+tvcT(['15 s imortal','15 s immortal'])+tvcT(['semitransparente para todos','see-through for everyone'])+tvcT(['morte não conta no ranking','death does not count'])+'</div>';
 if(f==='online')return '<div class="fx-card"><div class="net"><i></i><i></i><i></i><i></i></div>'+tvcT(['até 3 de carona num carro de 4 portas','up to 3 riders in a 4-door car'])+tvcT(['viagem no tempo leva os passageiros','time travel takes the passengers'])+'</div>';
 if(f==='sigblock')return '<div class="fx-card"><b class="big" data-t="📡 $5.000"></b>'+tvcT(['AMOnições › APP ctOS','AMOnições › ctOS APP'])+tvcT(['ninguém hackeia seu PIX','nobody hacks your PIX'])+tvcT(['fica na conta','stays on your account'],'t warn')+'</div>';
 if(f==='stats'){const r=[['carros destruídos','cars destroyed'],['tempo procurado','time wanted'],['tempo dirigindo','time driving'],['dias','days'],['vezes preso','arrests'],['fugas da prisão','jailbreaks'],['carros roubados','cars stolen']];
  return '<div class="fx-card stats">'+r.map(q=>'<div>'+tvcT(q)+'</div>').join('')+'</div>'}
 return '';
}
function tvcPanel(q,k){const st=[];if(q.br)st.push('--br:'+q.br);if(q.zoom)st.push('--zm:1');
 const img=q.i?'<img alt="" decoding="async" src="'+tvcSrc(q.i)+'" class="'+(q.fit?'fit':'')+(q.dim?' dim':'')+'" onerror="this.closest(\'.tvc-pn\').classList.add(\'nosig\')">':'';
 return '<div class="tvc-pn p'+k+(q.i?'':' gfx')+(q.zoom?' zm':'')+'" style="'+st.join(';')+'">'+img+(q.f?tvcFx(q.f):'')+'<div class="tvc-cap">'+tvcT(q.t)+'</div><div class="tvc-nosig" data-t="'+(S.lang==='en'?'NO SIGNAL':'SEM SINAL')+'"></div></div>'}
function tvcRender(){const ch=TVCAT[TVC.i],el=$('#tvcScr');if(!ch||!el)return;
 el.className='tvc-scr lay-'+ch.l;el.style.setProperty('--cc',ch.c);
 el.innerHTML='<div class="tvc-grid">'+ch.p.map(tvcPanel).join('')+'</div>'+
  '<div class="tvc-logo"><b>'+ch.ic+'</b>'+tvcT(ch.n,'t nm')+'</div><div class="tvc-osd" data-t="CH '+String(TVC.i+1).padStart(2,'0')+'"></div>'+
  (ch.l==='alt'?'<div class="tvc-dots">'+ch.p.map((q,k)=>'<i class="'+(k?'':'on')+'"></i>').join('')+'</div>':'')+
  '<canvas class="tvc-noise" width="160" height="90"></canvas>';
 $('#tvcLeg').innerHTML=tvcT(ch.g,'t');
 {const en=S.lang==='en';$('#tvcGuideLbl').setAttribute('data-t',en?'GUIDE':'GUIA');$('#tvcHelp').setAttribute('data-t',en?'←/→ channel · G guide · 0–9 number · Esc exit':'←/→ canal · G guia · 0–9 número · Esc sai')}
 $('#tvcNum').setAttribute('data-t',String(TVC.i+1).padStart(2,'0')+' / '+TVCAT.length);
 TVC.altI=0;TVC.altT=performance.now();if(ch.l==='alt')tvcAltShow(0);
 for(const d of [1,-1]){const n=TVCAT[(TVC.i+d+TVCAT.length)%TVCAT.length];for(const q of n.p)if(q.i){const im=new Image();im.src=tvcSrc(q.i)}}
 if(TVC.guide)tvcGuideRender();
}
function tvcAltShow(k){const ps=[...document.querySelectorAll('#tvcScr .tvc-pn')],ds=[...document.querySelectorAll('#tvcScr .tvc-dots i')];
 ps.forEach((p,j)=>p.classList.toggle('on',j===k));ds.forEach((d,j)=>d.classList.toggle('on',j===k))}
function tvcNoise(ms){const cv=document.querySelector('#tvcScr .tvc-noise');if(!cv)return;const g=cv.getContext('2d'),t0=performance.now();cv.classList.add('on');
 const id=g.createImageData(160,90),d=id.data;
 const step=()=>{if(!TVC.open||!cv.isConnected)return;for(let i=0;i<d.length;i+=4){const v=Math.random()*255|0;d[i]=d[i+1]=d[i+2]=v;d[i+3]=255}g.putImageData(id,0,0);
  if(performance.now()-t0<ms)requestAnimationFrame(step);else cv.classList.remove('on')};step();
 try{initAudio();if(!AC||!master)return;const t=AC.currentTime,len=Math.floor(AC.sampleRate*ms/1000),b=AC.createBuffer(1,len,AC.sampleRate),a=b.getChannelData(0);for(let i=0;i<len;i++)a[i]=Math.random()*2-1;
  const s=AC.createBufferSource();s.buffer=b;const f=AC.createBiquadFilter();f.type='bandpass';f.frequency.value=2400;f.Q.value=.6;const gn=AC.createGain();gn.gain.setValueAtTime(.0001,t);gn.gain.linearRampToValueAtTime(.09,t+.02);gn.gain.setValueAtTime(.09,t+ms/1000-.06);gn.gain.linearRampToValueAtTime(.0001,t+ms/1000);
  s.connect(f);f.connect(gn);gn.connect(master);s.start(t);s.stop(t+ms/1000+.02)}catch(e){}}
function tvcGo(i,noise){TVC.i=(i+TVCAT.length)%TVCAT.length;tvcRender();if(noise!==false)tvcNoise(260)}
function tvcStep(d){tvcGo(TVC.i+d)}
function tvcGuideRender(){const g=$('#tvcGuide');g.innerHTML='<div class="tvc-ghead">'+tvcT(['GUIA DE CANAIS','CHANNEL GUIDE'])+'</div><div class="tvc-glist">'+TVCAT.map((c,k)=>'<button type="button" class="tvc-gi'+(k===TVC.i?' cur':'')+'" data-k="'+k+'" style="--cc:'+c.c+'"><b data-t="'+String(k+1).padStart(2,'0')+'"></b><i>'+c.ic+'</i>'+tvcT(c.n)+'</button>').join('')+'</div>';
 const cur=g.querySelector('.tvc-gi.cur');if(cur){cur.focus({preventScroll:true});cur.scrollIntoView({block:'nearest'})}}
function tvcGuide(on){TVC.guide=on===undefined?!TVC.guide:on;$('#tvcGuide').hidden=!TVC.guide;$('#tvcat').classList.toggle('guide',TVC.guide);if(TVC.guide)tvcGuideRender();else{const b=$('#tvcNext');if(b)b.focus({preventScroll:true})}}
function tvcOpen(){if(TVC.open)return;TVC.open=true;TVC.ret=document.activeElement;for(const k in keys)keys[k]=false;try{GUN.firing=false}catch(e){}if(document.pointerLockElement)document.exitPointerLock();
 $('#tvcat').hidden=false;document.body.classList.add('tvc-on');tvcGuide(false);tvcGo(TVC.i,true);$('#tvcNext').focus({preventScroll:true});TVC.raf=requestAnimationFrame(tvcLoop)}
function tvcClose(){if(!TVC.open)return;TVC.open=false;TVC.guide=false;$('#tvcat').hidden=true;document.body.classList.remove('tvc-on');$('#tvcScr').innerHTML='';
 const r=TVC.ret&&TVC.ret.isConnected?TVC.ret:$('#tvCatBtn');try{r&&r.focus()}catch(e){}}
function tvcLoop(now){if(!TVC.open)return;const ch=TVCAT[TVC.i];
 if(ch&&ch.l==='alt'&&!TVC.guide&&now-TVC.altT>TVC_ALT_MS){TVC.altT=now;TVC.altI=(TVC.altI+1)%ch.p.length;tvcAltShow(TVC.altI)}
 if(TVC.num&&now-TVC.numT>1400){const n=parseInt(TVC.num,10);TVC.num='';$('#tvcOsdIn').hidden=true;if(n>=1&&n<=TVCAT.length&&n-1!==TVC.i)tvcGo(n-1)}
 requestAnimationFrame(tvcLoop)}
function tvcDigit(d){TVC.num=(TVC.num+d).slice(-2);TVC.numT=performance.now();const o=$('#tvcOsdIn');o.hidden=false;o.setAttribute('data-t',TVC.num.padStart(2,'-'));if(TVC.num.length>=2||parseInt(TVC.num+'0',10)>TVCAT.length)TVC.numT=-1e9}
function tvcGuideMove(dx,dy){const L=[...document.querySelectorAll('#tvcGuide .tvc-gi')];if(!L.length)return;let i=L.indexOf(document.activeElement);if(i<0)i=TVC.i;
 const cols=Math.max(1,Math.round($('#tvcGuide .tvc-glist').clientWidth/Math.max(1,L[0].offsetWidth)));i=clamp(i+dx+dy*cols,0,L.length-1);L[i].focus();L[i].scrollIntoView({block:'nearest'})}
addEventListener('keydown',e=>{if(!TVC.open)return;const c=e.code;if(/^F(5|11|12)$/.test(c))return;e.stopImmediatePropagation();
 if(c==='Escape'||c==='Backspace'){e.preventDefault();if(e.repeat)return;if(TVC.guide)tvcGuide(false);else tvcClose();return}
 if(c==='Tab'){return}
 if(TVC.guide){e.preventDefault();if(c==='ArrowLeft'||c==='KeyA')tvcGuideMove(-1,0);else if(c==='ArrowRight'||c==='KeyD')tvcGuideMove(1,0);else if(c==='ArrowUp'||c==='KeyW')tvcGuideMove(0,-1);else if(c==='ArrowDown'||c==='KeyS')tvcGuideMove(0,1);
  else if((c==='Enter'||c==='Space'||c==='NumpadEnter')&&!e.repeat){const b=document.activeElement;if(b&&b.dataset&&b.dataset.k!=null){tvcGuide(false);tvcGo(+b.dataset.k)}}else if(c==='KeyG'&&!e.repeat)tvcGuide(false);return}
 if(c==='ArrowLeft'||c==='KeyA'||c==='PageDown'||c==='Comma'){e.preventDefault();tvcStep(-1);return}
 if(c==='ArrowRight'||c==='KeyD'||c==='PageUp'||c==='Period'){e.preventDefault();tvcStep(1);return}
 if((c==='KeyG'||c==='ArrowUp'||c==='ArrowDown'||c==='KeyW'||c==='KeyS')&&!e.repeat){e.preventDefault();tvcGuide(true);return}
 const m=/^(?:Digit|Numpad)(\d)$/.exec(c);if(m){e.preventDefault();tvcDigit(m[1]);return}
 if(c==='Enter'||c==='Space'||c==='NumpadEnter'){const b=document.activeElement;if(b&&$('#tvcat').contains(b)&&b.tagName==='BUTTON')return;e.preventDefault();tvcStep(1);return}
 e.preventDefault()},true);
/* controle: ←/→ ou L1/R1 = canal, △ = guia, ○/OPTIONS = sair; no guia, direcional/analógico anda e ✕ escolhe */
function tvcPad(B,pr,g,dt){const ax=g.axes||[],lx=padAxis(ax[0]||0),ly=padAxis(ax[1]||0);TVC.navT-=dt;let sx=0,sy=0;
 if(TVC.navT<=0){if(lx>.6)sx=1;else if(lx<-.6)sx=-1;if(ly>.6)sy=1;else if(ly<-.6)sy=-1;if(sx||sy)TVC.navT=.22}else if(Math.abs(lx)<.3&&Math.abs(ly)<.3)TVC.navT=0;
 if(pr(1)||pr(9)){if(TVC.guide)tvcGuide(false);else tvcClose();return}
 if(TVC.guide){if(pr(14)||sx<0)tvcGuideMove(-1,0);else if(pr(15)||sx>0)tvcGuideMove(1,0);else if(pr(12)||sy<0)tvcGuideMove(0,-1);else if(pr(13)||sy>0)tvcGuideMove(0,1);
  if(pr(0)){const b=document.activeElement;if(b&&b.dataset&&b.dataset.k!=null){tvcGuide(false);tvcGo(+b.dataset.k)}}if(pr(3))tvcGuide(false);return}
 if(pr(14)||pr(4)||sx<0)tvcStep(-1);else if(pr(15)||pr(5)||pr(0)||sx>0)tvcStep(1);if(pr(3)||pr(12)||pr(13))tvcGuide(true)}
(function tvcBind(){const r=$('#tvcat');if(!r)return;
 $('#tvCatBtn').addEventListener('click',e=>{e.stopPropagation();tvcOpen()});
 $('#tvcPrev').addEventListener('click',()=>tvcStep(-1));$('#tvcNext').addEventListener('click',()=>tvcStep(1));
 $('#tvcClose').addEventListener('click',tvcClose);$('#tvcGuideBtn').addEventListener('click',()=>tvcGuide());
 $('#tvcGuide').addEventListener('click',e=>{const b=e.target.closest('.tvc-gi');if(b){tvcGuide(false);tvcGo(+b.dataset.k)}});
 const sc=$('#tvcScr');sc.addEventListener('pointerdown',e=>{TVC.sw={x:e.clientX,y:e.clientY,t:performance.now()}});
 sc.addEventListener('pointerup',e=>{const s=TVC.sw;TVC.sw=null;if(!s)return;const dx=e.clientX-s.x,dy=e.clientY-s.y;if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy)*1.3)tvcStep(dx<0?1:-1);else if(Math.abs(dx)<8&&Math.abs(dy)<8&&performance.now()-s.t<350)tvcStep(1)});
 sc.addEventListener('pointercancel',()=>{TVC.sw=null});
 r.addEventListener('wheel',e=>{if(TVC.guide)return;e.preventDefault();if(Math.abs(e.deltaY)<4)return;const n=performance.now();if(n-(TVC.wT||0)<220)return;TVC.wT=n;tvcStep(e.deltaY>0?1:-1)},{passive:false});
})();


