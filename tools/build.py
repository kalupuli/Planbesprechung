"""Baut eine eigenständige HTML-Datei (dist/planspiel-musterstadt.html) mit eingebetteten Styles, Skripten und Kartentextur.
Aufruf aus dem Projektordner: python3 tools/build.py
"""
import base64, pathlib, re

root = pathlib.Path(__file__).resolve().parent.parent
html = (root / "index.html").read_text(encoding="utf-8")

css = (root / "css/spiel.css").read_text(encoding="utf-8")
html = html.replace('<link rel="stylesheet" href="css/spiel.css">', "<style>\n" + css + "\n</style>")

# Kartentextur kommt als Vektor aus js/kartesvg.js

import json
daten = {d: base64.b64encode((root / "assets" / f).read_bytes()).decode() for d, f in
         [("lernunterlage", "lernunterlage_b2-211_musterstadt.pdf"), ("tafel", "taktische_arbeitstafel.pdf")]}
html = html.replace('<script src="js/unterlagen.js"></script>',
                    "<script>window.UNTERLAGEN_DATEN = " + json.dumps(daten) + ";</script>\n" + '<script src="js/unterlagen.js"></script>')

# Ablageordner lagen/: Inhaltsverzeichnis aktualisieren und alle Lagen einbetten
import sys
sys.path.insert(0, str(root / "tools"))
from lagen_index import schreibe
ordner = [{"datei": n, "inhalt": json.loads((root / "lagen" / n).read_text(encoding="utf-8"))} for n in schreibe(root)]
html = html.replace('<script src="js/ordner.js"></script>',
                    "<script>window.ORDNER_LAGEN = " + json.dumps(ordner, ensure_ascii=False).replace("</", "<\\/") + ";</script>\n" + '<script src="js/ordner.js"></script>')
print("Ablageordner:", len(ordner), "Dateien eingebettet")

img2 = base64.b64encode((root / "assets/stadtkarte.svg").read_bytes()).decode()
html = html.replace('src="assets/stadtkarte.svg"', 'src="data:image/svg+xml;base64,' + img2 + '"')

def inline(m):
    src = (root / m.group(1)).read_text(encoding="utf-8")
    return "<script>\n" + src.replace("</script", "<\\/script") + "\n</script>"
html = re.sub(r'<script src="((?:js|vendor)/[^"]+)"></script>', inline, html)

out = root / "dist"; out.mkdir(exist_ok=True)
(out / "planspiel-musterstadt.html").write_text(html, encoding="utf-8")
print("geschrieben:", out / "planspiel-musterstadt.html", round(len(html) / 1024), "KB")
