"""Assemble the portable Windows runtime from the verified Electron distribution."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import shutil
import sys

engine, work = map(Path, sys.argv[1:])
desktop = work / "desktop.zip"
shutil.copyfile(engine, desktop)
with ZipFile(desktop, "a", ZIP_DEFLATED) as app, ZipFile(work / "game.zip") as game:
    for file in Path("tools/desktop").iterdir():
        app.write(file, "resources/app/" + file.name)
    for name in game.namelist():
        asset = name.removeprefix("v77/")
        if asset.split("/")[0] in {
            "appicons", "css", "js", "lib", "radios", "tvcat", "index.html", "LICENSE",
            "locale_en_catalog.json", "peds.json", "version.txt", "manifest.webmanifest", "pwa.js"
        }:
            app.writestr("resources/app/game/" + asset, game.read(name))
