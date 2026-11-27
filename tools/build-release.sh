#!/usr/bin/env bash
set -euo pipefail
repo=$(cd "$(dirname "$0")/.." && pwd)
cd "$repo"
tag=$(tr -d '\r\n' < version.txt)
[[ $tag =~ ^r[1-9][0-9]*$ ]] || { echo "Revisão inválida em version.txt" >&2; exit 1; }
grep -Fq "BUILD_TAG='$tag'" js/inicio-versao.js
out=$(mkdir -p "${1:-../entregas}" && cd "${1:-../entregas}" && pwd)
case "$out/" in "$repo/"*) echo "Use uma pasta de saída fora do repositório." >&2; exit 1;; esac
: "${ANDROID_SDK_ROOT:?Defina a raiz do Android SDK}"
: "${ANDROID_KEYSTORE:?Defina o caminho absoluto da chave Android}"
: "${ANDROID_KEY_ALIAS:?Defina o alias da chave Android}"
: "${ANDROID_KS_PASS:?Defina a senha da chave Android no ambiente}"
sdk="$ANDROID_SDK_ROOT/build-tools/${ANDROID_BUILD_TOOLS:-35.0.1}"
platform="$ANDROID_SDK_ROOT/platforms/android-35/android.jar"
go_bin=${GO_BIN:-go}
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
stem="coastal-chaos-v4-$tag"
template="$work/android-r67.apk"
if [[ -n ${ANDROID_TEMPLATE_APK:-} ]]; then
 cp "$ANDROID_TEMPLATE_APK" "$template"
else
 curl --fail --silent --show-error --location --retry 2 \
  "https://github.com/linuxuniverseofficial/cc.ss.github.io/releases/download/v4-r67/coastal-chaos-v4-r67-android-debug.apk" -o "$template"
fi
printf '%s  %s\n' '158df77fba7998cdb61a05dcfc67bd15bbc05ebec330f7d85ca7a23cfb46c003' "$template" | sha256sum -c -
mkdir -p "$work/android" "$work/windows"
python3 - "$work" "$template" <<'PY'
from pathlib import Path
import re
import subprocess
import sys
from zipfile import ZIP_DEFLATED, ZipFile

work, template = map(Path, sys.argv[1:])
android = work / 'android'
web = {'appicons', 'css', 'js', 'lib', 'radios', 'tvcat', 'index.html',
       'locale_en_catalog.json', 'peds.json', 'version.txt', 'manifest.webmanifest'}
files = subprocess.check_output(['git', 'ls-files', '-z']).decode().split('\0')
with ZipFile(work / 'windows/game.zip', 'w', ZIP_DEFLATED) as bundle:
    for name in files:
        if not name or name.startswith('online/data/'):
            continue
        p = Path(name)
        bundle.write(p, 'v77/' + name)
        if p.parts[0] in web:
            dest = android / 'assets' / p
            dest.parent.mkdir(parents=True, exist_ok=True)
            data = p.read_bytes()
            if name == 'index.html':
                data = re.sub(rb'<script[^>]+src="(?:\./)?pwa\.js[^"]*"[^>]*></script>', b'', data)
            elif name == 'js/37-save-garagem.js':
                anchor = b'  a.href=URL.createObjectURL(b);'
                assert data.count(anchor) == 1, 'Atualize a integração Android do save'
                bridge = b'  if(window.CoastalAndroid){window.CoastalAndroid.save(a.download,txt);SAVE.fileT=simT;syncSave();return true}\n'
                data = data.replace(anchor, bridge + anchor, 1)
            dest.write_bytes(data)
with ZipFile(template) as source:
    with ZipFile(work / 'launcher.apk', 'w') as launcher:
        launcher.writestr('classes.dex', source.read('classes.dex'))
PY
apktool=(java -jar "${APKTOOL_JAR:?Defina o caminho do apktool.jar}")
"${apktool[@]}" d -r "$work/launcher.apk" -o "$work/launcher"
bridge="$work/launcher/smali/io/github/linuxuniverseofficial/coastalchaos/"'GameActivity$1.smali'
sed -i '/^\.super /a .implements Ljava/lang/Runnable;' "$bridge"
cat tools/android-launcher/exit-methods.smali >> "$bridge"
"${apktool[@]}" b "$work/launcher" -o "$work/launcher-updated.apk"
unzip -p "$work/launcher-updated.apk" classes.dex > "$work/android/classes.dex"
cp -R tools/android-launcher/res "$work/android/res"
mkdir -p "$work/android/res/drawable-nodpi"
cp appicons/icon-512.png "$work/android/res/drawable-nodpi/game_icon.png"
"$sdk/aapt2" compile --dir "$work/android/res" -o "$work/android/res.zip"
"$sdk/aapt2" link --manifest tools/android-launcher/AndroidManifest.xml -I "$platform" \
 --version-code "${tag#r}" --version-name "4.$tag" -A "$work/android/assets" \
 -o "$work/android/unsigned.apk" "$work/android/res.zip"
python3 - "$work/android" <<'PY'
from pathlib import Path
import sys
from zipfile import ZIP_DEFLATED, ZipFile
root = Path(sys.argv[1])
with ZipFile(root / 'unsigned.apk', 'a', ZIP_DEFLATED) as apk:
    apk.write(root / 'classes.dex', 'classes.dex')
PY
"$sdk/zipalign" -f 4 "$work/android/unsigned.apk" "$work/android/aligned.apk"
"$sdk/apksigner" sign --ks "$ANDROID_KEYSTORE" --ks-key-alias "$ANDROID_KEY_ALIAS" \
 --ks-pass env:ANDROID_KS_PASS --v4-signing-enabled false \
 --out "$work/$stem-android-debug.apk" "$work/android/aligned.apk"
"$sdk/apksigner" verify --print-certs "$work/$stem-android-debug.apk"
"$sdk/zipalign" -c 4 "$work/$stem-android-debug.apk"
win_engine=${ELECTRON_WINDOWS_ZIP:-$work/electron-windows.zip}
if [[ ! -f "$win_engine" ]]; then
 curl -fLsS --retry 2 https://github.com/electron/electron/releases/download/v45.5.0/electron-v45.5.0-win32-x64.zip -o "$win_engine"
fi
echo "20155c8b8aa5b1f575f3757bdf21490e0bac2f19a65a26ce9ba99bcf9f2c69bd  $win_engine" | sha256sum -c -
python3 tools/windows-launcher/package.py "$win_engine" "$work/windows"
cp tools/windows-launcher/{main.go,go.mod} "$work/windows/"
(cd "$work/windows" && GOOS=windows GOARCH=amd64 CGO_ENABLED=0 "$go_bin" build \
 -trimpath -ldflags='-s -w -H windowsgui' -o "$work/$stem-windows-x64.exe" .)
mv "$work/windows/game.zip" "$work/$stem.zip"
python3 - "$work" "$stem" "$tag" <<'PY'
from pathlib import Path
import sys
from zipfile import ZipFile
root, stem, tag = Path(sys.argv[1]), sys.argv[2], sys.argv[3]
bundle = root / (stem + '.zip')
for file, prefix in [(bundle, 'v77/'), (root / (stem + '-android-debug.apk'), 'assets/')]:
    with ZipFile(file) as z:
        assert z.testzip() is None, file
        assert z.read(prefix + 'version.txt').decode().strip() == tag, file
exe = (root / (stem + '-windows-x64.exe')).read_bytes()
assert exe[:2] == b'MZ' and (root / 'windows/desktop.zip').read_bytes() in exe
PY
mv "$work/$stem.zip" "$work/$stem-android-debug.apk" "$work/$stem-windows-x64.exe" "$out/"
printf 'Pacotes conferidos em %s\n' "$out"
