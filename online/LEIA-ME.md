# Modo ONLINE — instalação (Apache + PHP)

O servidor é só o arquivo `online/api.php`, servido pelo mesmo Apache do jogo. Não precisa de VPS, Node nem porta extra.

## Requisitos
- PHP 7.4 ou mais novo (testado no 8.3) com **pdo_sqlite** e **mbstring** (`php -m` deve listar os dois).
- A pasta `online/` precisa ter permissão de escrita para o usuário do Apache (`www-data`): o banco é criado em `online/data/online.sqlite` no primeiro acesso.

```bash
sudo apt install php libapache2-mod-php php-sqlite3 php-mbstring   # Debian/Ubuntu
sudo chown -R www-data:www-data /caminho/do/jogo/online
sudo systemctl restart apache2
```

Teste: abrir `https://gta.linuxuniverse.com.br/online/api.php?a=info` deve responder algo como `{"ok":true,"players":0,"max":24,...}`.

## Jeitos rápidos de subir
- **Um comando (Docker):** `sudo sh online/servidor-docker.sh` (baixa do GitHub) ou `sudo sh servidor-docker.sh jogo.zip`. Sobe `php:apache` na porta 8080 (`PORTA=` muda), jogo só leitura em `/srv/coastal-chaos/www`, banco em `/srv/coastal-chaos/data`. Rodar de novo atualiza o jogo e mantém o banco.
- **Docker:** dentro de `online/`, `docker compose up -d` → jogo + online em `http://IP:8080/` (Apache + PHP oficiais, banco em volume).
- **Sem Apache:** na pasta do jogo, `./servidor-online.sh 8080` (Linux/macOS) ou `servidor-online.bat 8080` (Windows). Usa o servidor embutido do PHP com 8 processos; serve o jogo e o online juntos.
- **Servidor em outro endereço:** no menu ONLINE, campo **SERVIDOR**: `192.168.0.10:8080`, `meuhost.com` ou a URL completa. Vazio (**Automático**) = o próprio site. 404/403 = endereço errado: o menu pede para digitar outro. O `api.php` libera CORS, então o jogo pode estar num site e o servidor em outro. Página em `https://` só conversa com servidor `https://` (o navegador bloqueia `http://`).

## Como funciona
- **Sessão do dia:** a seed da cidade muda à meia-noite (horário de Brasília); todo mundo joga a mesma cidade 14×14.
- **Até 24 jogadores.** Nome + senha (mín. 6): a primeira vez cria a conta com $500; depois dinheiro, armas, colete e o carro pessoal voltam. Conta sem entrar há 30 dias é apagada e o nome fica livre. Nome em uso com a senha certa derruba a sessão antiga; sem a senha não entra (quem ficar 45 s sem responder sai sozinho; o jogo reentra sozinho com o mesmo nome se a sessão cair).
- **Sem conexão persistente:** cada jogador manda o próprio estado ~6×/s e recebe o dos outros; o jogo suaviza o movimento.
- **Cidade vazia (estilo SA-MP):** sem trânsito, pedestres andando e polícia. Cada um só vê os NPCs parados do próprio jogo.
- **Antes de entrar:** primeiro NOME + SENHA (nome novo cria a conta); depois a tela de personagem já vem com a roupa/carro salvos na conta. Nathan ou Claire + roupa (camisa, estampa, calça, calçado, boné, óculos, colar, fivela). **EXPORTAR/IMPORTAR** guarda tudo num `.json` (nome, carro, placa, roupa e servidor). Sem troca de personagem durante a partida.
- **Sincronizado:** posição, roupa, carro (tipo, cor e placa), chat (tecla **T**), tiro/soco/atropelamento/explosão entre jogadores e o kill feed. Jogadores aparecem no minimapa e no mapa grande com a cor da camisa.
- **Mundo do servidor:** carros estacionados (os da seed + extras nos estacionamentos e no meio-fio) são os mesmos para todos: quem pega, os outros veem andando; onde larga, fica para todos; explodiu, some para todos. Carro da concessionária/garagem entra no servidor quando é dirigido. Armas, vida e colete da seed: quem pega, some para todos e volta em 5 min. Quem morre larga a arma da mão + 10% do dinheiro (no lugar da conta do hospital): o primeiro que encostar leva; some em 3 min.
- **Hora e clima iguais para todos:** a hora vem do servidor; o clima (chuva, previsão, tempestade) é do jogador mais antigo na partida e os outros copiam.
- **Casa segura:** uma por conta (até 24), espalhadas pela cidade; só o dono vê e entra.
- **Carro pessoal:** o do começo fica salvo onde você largou e marcado no seu mapa. Explodiu/levaram: celular → ENTREGA DE VEÍCULO (ou `/carro`) chega em 1 h de jogo; na porta da delegacia, E paga 15% do dinheiro (mín. $100) e ele sai na hora.
- **Táxi:** carona num carro tipo táxi custa $10 + $1 a cada 25 m para o passageiro; o motorista recebe.
- **Agenda:** todo mundo da sala aparece no celular (P → AGENDA), em ordem alfabética. Ligar pede um encontro; se o outro atender (Y), você é levado até ele.
- **Quem está online:** no mapa (M), botão JOGADORES acima da legenda; ou `/jogadores` no chat.
- **Carro de outro jogador:** **G** = carona (dá para atirar de dentro; **F** desce). **F** = roubar (o motorista é jogado para fora e você assume o carro).
- **Hack de PIX (v3 r9):** com o app ctOS, celular › ctOS › PERFIL apontado para outro jogador → HACKEAR PIX (fique entre 6 e 24 m por 7 s). Leva 20% do saldo dele (máx. $5.000); recarga de 90 s; quem foi hackeado fica 5 min protegido. O servidor confere tudo. **Bloqueador de Sinal:** AMOnições › APP ctOS, $5.000, fica na conta e ninguém hackeia mais o seu PIX. Ajustes no topo do `api.php` (`SIG_PRICE`, `HACK_*`).
- **Backrooms (v3 r14):** o trecho de beco com falha é o mesmo para todos (troca a cada 3 h de jogo). Quem cai vai para o mesmo labirinto e vê os outros que estão lá; a saída (só no minimapa) é a mesma para todos e troca a cada 3 min. As entidades são de cada jogador.
- **Desligado no online:** save, cheats e modo história. Para sair, recarregue a página.

## Ajustes (topo do `api.php`)
`MAX_PLAYERS` (24), `CITY_SIZE` (14), `TIMEOUT` (45 s), `PK_RESPAWN` (300 s), `DROP_TTL` (180 s), `START_MONEY` ($500), `ACCOUNT_TTL` (30 dias).

## Segurança
- `online/data/` é bloqueada pelo `.htaccess` (o banco não pode ser baixado). Se o Apache tiver `AllowOverride None`, bloqueie a pasta na configuração do site.
- O acerto de tiro é decidido por quem atira (modelo simples, bom para jogar entre amigos; dá para trapacear com o console do navegador).

## Conta admin (r25)
- Nome `admin`, senha definida pelo dono do servidor: variável de ambiente `CCSS_ADMIN_PASS` (mín. 6 caracteres). Docker: `CCSS_ADMIN_PASS=SuaSenha docker compose up -d` ou `sudo CCSS_ADMIN_PASS=SuaSenha sh servidor-docker.sh`. Sem a variável, o servidor gera uma senha em `data/admin-pass.txt` (no Docker: `/data/admin-pass.txt`, no host `/srv/coastal-chaos/data/`).
- No jogo: CONFIGURAÇÕES → ONLINE → LIMPAR BANCO DE DADOS (apaga todas as contas menos o admin, carros/coletáveis do mundo e o chat; todos são desconectados). No chat: `/contas`, `/apagar Nome`, `/limparbanco confirmar`.
- Todo jogador tem CONFIGURAÇÕES → ONLINE → APAGAR MINHA CONTA (apaga a conta e sai do servidor).
