#!/bin/sh
# Coastal Chaos: Sunset Shores — servidor ONLINE em Docker (jogo + online, até 24 jogadores)
# Uso:   sudo sh servidor-docker.sh                 → baixa a versão mais nova do GitHub
#        sudo sh servidor-docker.sh jogo.zip        → usa um zip do jogo que você já tem
#        PORTA=9000 sudo sh servidor-docker.sh      → outra porta (padrão 8080)
# Rodar de novo = atualiza o jogo e recria o container (o banco do online é mantido).
set -e
PORTA="${PORTA:-8080}"
BASE="${BASE:-/srv/coastal-chaos}"
NOME="${NOME:-coastal-chaos}"
URL="https://github.com/linuxuniverseofficial/cc.ss.github.io/archive/refs/heads/main.zip"

command -v docker >/dev/null || { echo "Docker não encontrado."; exit 1; }
command -v unzip  >/dev/null || { echo "Falta o unzip (apt install unzip)."; exit 1; }

mkdir -p "$BASE/www" "$BASE/data"
TMP=$(mktemp -d)
if [ -n "$1" ]; then cp "$1" "$TMP/jogo.zip"; else echo "Baixando o jogo..."; curl -fsSL "$URL" -o "$TMP/jogo.zip"; fi
unzip -q "$TMP/jogo.zip" -d "$TMP/x"
SRC=$(dirname "$(find "$TMP/x" -maxdepth 3 -name index.html | head -1)")
[ -f "$SRC/online/api.php" ] || { echo "Esse pacote não tem o modo online (online/api.php)."; rm -rf "$TMP"; exit 1; }
rm -rf "$BASE/www" && mkdir -p "$BASE/www" && cp -a "$SRC/." "$BASE/www/"
rm -rf "$TMP"

# banco do online fora do site, gravável pelo Apache (www-data = uid 33)
chown -R 33:33 "$BASE/data"

docker rm -f "$NOME" >/dev/null 2>&1 || true
docker run -d --name "$NOME" --restart unless-stopped \
  -p "$PORTA":80 \
  -v "$BASE/www":/var/www/html:ro \
  -v "$BASE/data":/data -e CCSS_DATA=/data \
  -v /etc/localtime:/etc/localtime:ro \
  php:apache >/dev/null

sleep 2
IP=$(hostname -I 2>/dev/null | awk '{print $1}')
if curl -fs "http://127.0.0.1:$PORTA/online/api.php?a=info" | grep -q '"ok":true'; then
  echo "Pronto! Jogo e online em http://${IP:-localhost}:$PORTA/"
  echo "No jogo: menu → ONLINE (ou, de outro site, campo SERVIDOR = ${IP:-IP}:$PORTA)"
else
  echo "O container subiu, mas o online não respondeu. Veja: docker logs $NOME"
fi
