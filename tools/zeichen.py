"""Erzeugt js/zeichen.js aus dem Repository jonas-koeritz/Taktische-Zeichen (CC BY 4.0).
Aufruf: python3 tools/zeichen.py <Pfad zum geklonten Repository>
"""
import glob, jinja2, json, os, re, sys
repo = sys.argv[1]
theme = json.load(open(os.path.join(repo, "themes/default.json")))
env = jinja2.Environment(loader=jinja2.FileSystemLoader([repo]))
ordner = ["Feuerwehr_Fahrzeuge", "Feuerwehr_Einheiten", "Rettungswesen_Fahrzeuge", "Rettungswesen_Einheiten", "Rettungswesen_Einrichtungen", "Katastrophenschutz_Einheiten", "Katastrophenschutz_Fahrzeuge", "Führungsstellen", "Personen", "Einrichtungen", "Gefahren", "Polizei_Fahrzeuge", "Polizei_Einheiten", "Fahrzeuge", "Einheiten", "Maßnahmen", "Feuerwehr_Gebäude", "Sonstiges", "THW_Einheiten", "THW_Fahrzeuge", "THW_Gebäude", "THW_Personen"]
out = {}
for d in ordner:
    for f in sorted(glob.glob(os.path.join(repo, "symbols", d, "*.j2"))):
        src = open(f, encoding="utf-8").read()
        src = re.sub(r"\{%\s*include\s+'\./fonts/fonts\.j2'\s*%\}", "", src)
        svg = env.from_string(src).render(**theme)
        svg = re.sub(r"<!DOCTYPE[^>]*>", "", svg).strip()
        svg = re.sub(r"<title>.*?</title>", "", svg, flags=re.S)
        svg = re.sub(r'<style type="text/css">\s*</style>', "", svg)
        svg = svg.replace("font-family: 'Roboto Slab'", "font-family: 'Roboto Slab', 'Arial Narrow', Arial, sans-serif")
        out[d + "/" + os.path.basename(f)[:-3]] = re.sub(r"\s+", " ", svg).replace("> <", "><")
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
head = open(os.path.join(root, "js/zeichen.js"), encoding="utf-8").read().split("window.TZ")[0] if os.path.exists(os.path.join(root, "js/zeichen.js")) else ""
open(os.path.join(root, "js/zeichen.js"), "w", encoding="utf-8").write(head + "window.TZ = " + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n")
print(len(out), "Zeichen geschrieben")
