"""Erzeugt lagen/index.json mit allen Lage-Dateien des Ablageordners.
Aufruf aus dem Projektordner: python3 tools/lagen_index.py
Nötig für Webserver ohne Verzeichnisliste. Auf GitHub Pages und im Build wird der Ordner auch ohne index.json gelesen."""
import json, pathlib

def schreibe(root=None):
    root = pathlib.Path(root or pathlib.Path(__file__).resolve().parent.parent)
    ordner = root / "lagen"; ordner.mkdir(exist_ok=True)
    dateien = sorted(f.name for f in ordner.glob("*.json") if f.name.lower() != "index.json")
    (ordner / "index.json").write_text(json.dumps({"format": "planbesprechung-musterstadt/ordner", "dateien": dateien}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return dateien

if __name__ == "__main__":
    d = schreibe()
    print("lagen/index.json:", len(d), "Dateien")
