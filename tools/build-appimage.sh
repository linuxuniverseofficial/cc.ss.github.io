#!/usr/bin/env bash
set -euo pipefail
repo=$(cd "$(dirname "$0")/.." && pwd)
cd "$repo"
rev=$(cat version.txt)
out=$(mkdir -p "${1:-../entregas}" && cd "${1:-../entregas}" && pwd)
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
dir="$work/CoastalChaos.AppDir"
engine="$dir/usr/electron"
game="$engine/resources/app/game"
mkdir -p "$game"
zip=${ELECTRON_ZIP:-$work/electron.zip}
if [[ ! -f "$zip" ]]; then
  curl -fLsS --retry 2 https://github.com/electron/electron/releases/download/v45.5.0/electron-v45.5.0-linux-x64.zip -o "$zip"
fi
echo "36b44cd0c3d355ee74557bea2353e4539f96e1a09733a52a052bd093134a6142  $zip" | sha256sum -c -
unzip -q "$zip" -d "$engine"
find "$engine/locales" -name '*.pak' ! -name 'pt-BR.pak' ! -name 'en-US.pak' -delete
cp -R appicons css js lib radios tvcat index.html locale_en_catalog.json peds.json version.txt manifest.webmanifest pwa.js LICENSE "$game/"
cp tools/linux-launcher/{main.cjs,package.json} "$engine/resources/app/"
install -m755 tools/linux-launcher/AppRun "$dir/AppRun"
cp tools/linux-launcher/coastal-chaos.desktop "$dir/"
cp appicons/icon-512.png "$dir/coastal-chaos.png"
ln -s coastal-chaos.png "$dir/.DirIcon"
options=()
if [[ -n ${APPIMAGE_RUNTIME:-} ]]; then options+=(--runtime-file "$APPIMAGE_RUNTIME"); fi
ARCH=x86_64 "${APPIMAGETOOL:-appimagetool}" "${options[@]}" "$dir" "$out/coastal-chaos-v4-$rev-linux-x86_64.AppImage"
