#!/bin/sh
# Sobe a build de uma vez: BUILD_TAG (js/inicio-versao.js), version.txt e o ?v= de todos os <script>/<link> do index.html
# (o ?v= faz o navegador baixar os arquivos novos em vez de misturar com os velhos do cache).
# uso: sh tools/nova-build.sh r38
set -e
cd "$(dirname "$0")/.."
N="$1"
[ -n "$N" ] || { echo "uso: sh tools/nova-build.sh rN"; exit 1; }
sed -i "s/var BUILD_TAG='[^']*'/var BUILD_TAG='$N'/" js/inicio-versao.js
printf '%s\n' "$N" > version.txt
sed -i -E "s/\?v=[A-Za-z0-9.]+\"/?v=$N\"/g" index.html
echo "BUILD_TAG: $(grep -o "BUILD_TAG='[^']*'" js/inicio-versao.js)  version.txt: $(cat version.txt)  ?v= no index: $(grep -c "?v=$N\"" index.html) linhas"
