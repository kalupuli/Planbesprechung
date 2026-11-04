"""Erzeugt die vektorisierte Kartentextur assets/karte.svg und js/kartesvg.js.
Grundlage: Seite 25 der Lernunterlage B2-211 als SVG (pdftocairo -svg), Texte und Symbole entfernt.
Aufruf: python3 tools/karte_vektor.py <karte_clean.svg> [<maske.webp>]
Die Stadtgrenze für die Freistellung wird aus dem Alphakanal der bisherigen Rastertextur gewonnen.
"""
import sys, re, pathlib, json
import numpy as np, cv2
from PIL import Image
import xml.etree.ElementTree as ET

root = pathlib.Path(__file__).resolve().parent.parent
src = sys.argv[1]
maske = sys.argv[2] if len(sys.argv) > 2 else str(root / "assets/karte.webp")
X0, Y0, W, H = 54, 156, 388, 462          # Ausschnitt in pt, identisch mit der bisherigen Textur
TINT = (0.941, 0.945, 0.909)               # Papierton der bisherigen Textur

ET.register_namespace("", "http://www.w3.org/2000/svg")
ET.register_namespace("xlink", "http://www.w3.org/1999/xlink")
NS = "{http://www.w3.org/2000/svg}"
tree = ET.parse(src); svg = tree.getroot()

# Glyphen und ungenutzte Definitionen entfernen, Clip-Pfade behalten
for defs in svg.findall(NS + "defs"):
    for g in list(defs):
        if g.tag == NS + "g": defs.remove(g)

def farbe(m):
    r, g, b = [float(v) for v in m.groups()]
    r, g, b = r * 2.55 * TINT[0], g * 2.55 * TINT[1], b * 2.55 * TINT[2]
    return "#%02x%02x%02x" % (round(min(255, r)), round(min(255, g)), round(min(255, b)))
RGB = re.compile(r"rgb\(([\d.]+)%,\s*([\d.]+)%,\s*([\d.]+)%\)")
def zahl(m):
    v = float(m.group(0)); s = ("%.2f" % v).rstrip("0").rstrip(".")
    return "0" if s in ("-0", "") else s

for el in svg.iter():
    for k in list(el.attrib):
        v = el.attrib[k]
        if k in ("fill", "stroke"): el.attrib[k] = RGB.sub(farbe, v)
        if k in ("d", "transform", "points"): el.attrib[k] = re.sub(r"-?\d+\.\d+", zahl, v)
        if k == "stroke-width": el.attrib[k] = re.sub(r"-?\d+\.\d+", zahl, v)

# Stadtgrenze aus der Maske der Rastertextur
a = np.array(Image.open(maske).convert("RGBA"))[:, :, 3]
_, b = cv2.threshold(a, 10, 255, cv2.THRESH_BINARY)
cs, _ = cv2.findContours(b, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
c = max(cs, key=cv2.contourArea)
c = cv2.approxPolyDP(c, 1.2, True)[:, 0, :]
mh, mw = a.shape
pts = " ".join("%.2f,%.2f" % (X0 + x / mw * W, Y0 + y / mh * H) for x, y in c)

inhalt = list(svg)
for e in inhalt: svg.remove(e)
defs = ET.SubElement(svg, NS + "defs")
cp = ET.SubElement(defs, NS + "clipPath", {"id": "stadt"}); ET.SubElement(cp, NS + "polygon", {"points": pts})
for e in inhalt:
    if e.tag == NS + "defs":
        for k in list(e): defs.append(k)
grp = ET.SubElement(svg, NS + "g", {"clip-path": "url(#stadt)"})
ET.SubElement(grp, NS + "rect", {"x": str(X0 - 5), "y": str(Y0 - 5), "width": str(W + 10), "height": str(H + 10), "fill": "#eff0e7"})
for e in inhalt:
    if e.tag != NS + "defs": grp.append(e)
svg.attrib["viewBox"] = "%d %d %d %d" % (X0, Y0, W, H)
svg.attrib["width"] = "2560"; svg.attrib["height"] = "3048"
svg.attrib["preserveAspectRatio"] = "none"
text = ET.tostring(svg, encoding="unicode")
text = re.sub(r">\s+<", "><", text)
(root / "assets/karte.svg").write_text(text, encoding="utf-8")
(root / "js/kartesvg.js").write_text("/* Vektorisierte Karte Musterstadt, erzeugt mit tools/karte_vektor.py aus Anhang I der Lernunterlage B2-211 (IdF NRW) */\nwindow.KARTE_SVG = " + json.dumps(text) + ";\n", encoding="utf-8")
print("karte.svg", round(len(text) / 1024), "KB,", len(c), "Punkte Stadtgrenze")

# Stadtkarte (Originalseite mit Beschriftung) als Vektor: Seite 25 ohne Kopf- und Fußzeile
if len(sys.argv) > 3:
    t = pathlib.Path(sys.argv[3]).read_text(encoding="utf-8")
    t = re.sub(r"<\?xml[^>]*>\s*", "", t)
    t = re.sub(r'width="[^"]*" height="[^"]*" viewBox="[^"]*"', 'width="2527" height="3101" viewBox="40 92 520 638"', t, count=1)
    t = re.sub(r"(<svg[^>]*>)", r'\1<rect x="0" y="0" width="600" height="850" fill="#ffffff"/>', t, count=1)
    t = re.sub(r"-?\d+\.\d{3,}", lambda m: ("%.2f" % float(m.group(0))).rstrip("0").rstrip("."), t)
    t = re.sub(r">\s+<", "><", t)
    (root / "assets/stadtkarte.svg").write_text(t, encoding="utf-8")
    print("stadtkarte.svg", round(len(t) / 1024), "KB")
