#!/usr/bin/env sh
# Coastal Chaos — servidor ONLINE local (jogo + api.php) usando o PHP embutido.
# Uso: ./servidor-online.sh [porta]   (padrão 8080)
# Depois: abra http://IP-DESTA-MÁQUINA:PORTA/ nos navegadores (ou ponha IP:PORTA no campo SERVIDOR do menu ONLINE).
cd "$(dirname "$0")" || exit 1
PORT="${1:-8080}"
command -v php >/dev/null 2>&1 || { echo "PHP não encontrado. Debian/Ubuntu: sudo apt install php-cli php-sqlite3 php-mbstring"; exit 1; }
for ext in pdo_sqlite mbstring; do php -m | grep -qi "^$ext$" || { echo "Falta a extensão PHP: $ext"; exit 1; }; done
mkdir -p online/data
IP=$(hostname -I 2>/dev/null | awk '{print $1}')
echo "Servidor ONLINE em http://${IP:-localhost}:$PORT/  (Ctrl+C para parar)"
# vários processos para aguentar ~24 jogadores (cada um faz ~6 pedidos por segundo)
PHP_CLI_SERVER_WORKERS=8 exec php -S 0.0.0.0:"$PORT" -t .
