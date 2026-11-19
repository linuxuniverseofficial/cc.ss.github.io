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
- **Servidor em outro endereço:** no menu ONLINE, campo **SERVIDOR**: `192.168.0.10:8080`, `meuhost.com` ou a URL completa. Vazio = o próprio site. O `api.php` libera CORS, então o jogo pode estar num site e o servidor em outro. Página em `https://` só conversa com servidor `https://` (o navegador bloqueia `http://`).

## Como funciona
- **Sessão do dia:** a seed da cidade muda à meia-noite (horário de Brasília); todo mundo joga a mesma cidade 7×7.
- **Até 24 jogadores.** Nome sem senha; nome em uso não entra (quem ficar 15 s sem responder sai sozinho).
- **Sem conexão persistente:** cada jogador manda o próprio estado ~6×/s e recebe o dos outros; o jogo suaviza o movimento.
- **Cidade vazia (estilo SA-MP):** sem trânsito, pedestres andando e polícia. Cada um só vê os NPCs parados do próprio jogo.
- **Sincronizado:** posição, roupa, carro (tipo, cor e placa), chat (tecla **T**), tiro/soco/atropelamento/explosão entre jogadores e o kill feed.
- **Desligado no online:** save, cheats e modo história. Para sair, recarregue a página.

## Ajustes (topo do `api.php`)
`MAX_PLAYERS` (24), `CITY_SIZE` (7 ou 14), `TIMEOUT` (15 s).

## Segurança
- `online/data/` é bloqueada pelo `.htaccess` (o banco não pode ser baixado). Se o Apache tiver `AllowOverride None`, bloqueie a pasta na configuração do site.
- O acerto de tiro é decidido por quem atira (modelo simples, bom para jogar entre amigos; dá para trapacear com o console do navegador).
