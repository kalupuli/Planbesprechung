"""Hebt die Infrastruktur der Vektorkarte hervor und erzeugt js/kartesvg.js.
Grundlage ist assets/karte.svg (erzeugt mit tools/karte_vektor.py), welche unverändert bleibt.
Ergebnis:
  assets/karte_infra.svg  Karte mit Klassen, Farbgebung und Flächen der Wach- und Ausrückebereiche
  js/kartesvg.js          window.KARTE_SVG (diese Karte) und window.KARTE_INFRA (Klassen, Bereiche)
Klassen der Elemente werden aus Farbe und Breite der Pfade abgeleitet:
  Autobahn, Hauptverkehrsstraße, Straße, Bahnstrecke, Wasserstraße, Hafenbecken, Erholungssee, Stillgewässer, Fließgewässer,
  Siedlungsfläche, Wachbezirksgrenze, Grenze des Ausrückebereichs.
Wachbezirke und Ausrückebereiche werden aus den roten Grenzlinien als Flächen berechnet und den Wachen zugeordnet.
Aufruf aus dem Projektordner: python3 tools/karte_infra.py   (benötigt numpy und opencv-python)
"""
import re, json, math, pathlib, subprocess
import numpy as np, cv2

root = pathlib.Path(__file__).resolve().parent.parent
s = (root / "assets/karte.svg").read_text(encoding="utf-8")
X0, Y0, W, H, K = 54, 156, 388, 462, 5

# Stationen aus js/daten.js (über Node), Rückfall auf feste Liste
try:
    st = json.loads(subprocess.run(["node", "-e", """
global.window={};require(process.argv[1]);const M=window.MS;
const st=M.wachen.filter(w=>w.art==="bf").map(w=>({kurz:w.kurz,x:w.x,y:w.y,wb:w.wb,bf:true}));
M.ff.forEach(f=>st.push({kurz:(f[1]==="LZ"?"LZ ":"LG ")+f[0],x:f[4],y:f[5],wb:Math.floor(f[0]/10)}));
console.log(JSON.stringify(st));""", str(root / "js/daten.js")], capture_output=True, text=True, check=True).stdout)
except Exception as e:
    raise SystemExit("Stationen konnten nicht aus js/daten.js gelesen werden: %s" % e)

def polys(d):
    out, cur = [], []
    for cmd, args in re.findall(r"([MLZ])([^MLZ]*)", d):
        n = [float(v) for v in args.split()]
        if cmd == "M":
            if cur: out.append(cur)
            cur = [(n[0], n[1])]
        elif cmd == "L": cur.append((n[0], n[1]))
        else:
            if cur: out.append(cur); cur = []
    if cur: out.append(cur)
    return out
def breite(d):
    A = P = 0
    for p in polys(d):
        if len(p) < 3: continue
        A += abs(sum(p[i - 1][0] * p[i][1] - p[i][0] * p[i - 1][1] for i in range(len(p)))) / 2
        P += sum(math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]) for i in range(len(p)))
    return (2 * A / P if P else 0), P / 2

def klasse(a):
    m = re.search(r' d="([^"]*)"', " " + a)
    if not m: return None
    if 'stroke="#6b6c67"' in a and 'stroke-width="0.49"' in a: return "k-ns"
    if 'fill="#a7a9a3"' in a: return "k-bahnh"
    if 'fill="#282825"' in a: return "k-bahn"
    if 'fill="#cccec6"' in a: return "k-sied"
    w, l = breite(m.group(1))
    if 'fill="#6b6c67"' in a: return "k-ab" if w > 1.0 else "k-hs"
    if 'fill="#0097ce"' in a:
        # Hafenbecken: kurzer Arm des Kanals westlich der FRW 2 (Angabe des Nutzers)
        pts = [q for p in polys(m.group(1)) for q in p]
        cx = sum(q[0] for q in pts) / len(pts); cy = sum(q[1] for q in pts) / len(pts)
        if abs((cx - X0) / W * 100 - 56.4) < 3 and abs((cy - Y0) / H * 100 - 49.8) < 3 and w > 1.1: return "k-hafen"
        # Erholungssee ohne Schifffahrt südwestlich der Altstadt (breite, langgestreckte Wasserfläche)
        if w > 2.2 and l > 30: return "k-erhol"
        if w > 1.5: return "k-see"
        if w > 1.1: return "k-kanal"
        return "k-fluss"
    if 'fill="#d61c21"' in a: return "k-wbg" if w > 0.4 else "k-abg"
    return None

zaehl = {}
def setze(m):
    a = m.group(1); k = klasse(a)
    if not k: return m.group(0)
    zaehl[k] = zaehl.get(k, 0) + 1
    return "<path class=\"%s\" %s" % (k, a) + (" />" if m.group(0).endswith("/>") else ">")
s2 = re.sub(r"<path ([^>]*?)\s*/?>", setze, s)

# Flächen der Wachbezirke und Ausrückebereiche aus den roten Grenzlinien
px = lambda p: np.array([[(x - X0) * K, (y - Y0) * K] for x, y in p], np.int32)
clip = re.search(r'<clipPath id="stadt"><polygon points="([^"]*)"', s).group(1)
cp = [tuple(map(float, q.split(","))) for q in clip.split()]
mask = np.zeros((H * K, W * K), np.uint8); cv2.fillPoly(mask, [px(cp)], 255)
dick, alle = np.zeros_like(mask), np.zeros_like(mask)
for m in re.finditer(r'<path class="(k-wbg|k-abg)" ([^>]*)', s2):
    d = re.search(r' d="([^"]*)"', " " + m.group(2)).group(1)
    for p in polys(d):
        if len(p) < 2: continue
        for z in ([alle, dick] if m.group(1) == "k-wbg" else [alle]):
            if len(p) >= 3: cv2.fillPoly(z, [px(p)], 255)
            cv2.polylines(z, [px(p)], True, 255, 3)
ker = np.ones((5, 5), np.uint8)
def flaechen(lines):
    frei = cv2.bitwise_and(mask, cv2.bitwise_not(cv2.dilate(lines, ker, iterations=2)))
    n, lab, stats, _ = cv2.connectedComponentsWithStats(frei, 8)
    return n, lab, stats
def stationen_in(lab, i):
    out = []
    for q in st:
        yy, xx = int((q["y"] / 100 * H) * K), int((q["x"] / 100 * W) * K)
        if 0 <= yy < lab.shape[0] and 0 <= xx < lab.shape[1] and lab[yy, xx] == i: out.append(q)
    return out
def kontur(maske_i):
    # Fläche um die Linienbreite wieder aufweiten, damit benachbarte Flächen lückenlos aneinanderstoßen
    m = cv2.dilate(maske_i, ker, iterations=3); m = cv2.bitwise_and(m, mask)
    cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    d = ""
    for c in cs:
        if cv2.contourArea(c) < 400: continue
        c = cv2.approxPolyDP(c, 1.2, True)
        d += "M " + " L ".join("%.1f %.1f" % (X0 + q[0][0] / K, Y0 + q[0][1] / K) for q in c) + " Z "
    return d.strip()

nW, labW, statsW = flaechen(dick)
wb = []
for i in range(1, nW):
    if statsW[i, 4] < 2000: continue
    q = [x for x in stationen_in(labW, i) if x.get("bf")]
    if not q: continue
    wb.append({"nr": q[0]["wb"], "wache": q[0]["kurz"], "lab": i})
wb.sort(key=lambda w: w["nr"])
nA, labA, statsA = flaechen(alle)
ab = []
for i in range(1, nA):
    if statsA[i, 4] < 2000: continue
    q = stationen_in(labA, i)
    werte, anz = np.unique(labW[labA == i], return_counts=True)
    haupt = [int(v) for v, c in sorted(zip(werte, anz), key=lambda t: -t[1]) if v > 0]
    nr = next((w["nr"] for w in wb if haupt and w["lab"] == haupt[0]), None)
    bf = [x["kurz"] for x in q if x.get("bf")]; ff = [x["kurz"] for x in q if not x.get("bf")]
    if bf: name = bf[0] + (" mit " + " und ".join(ff) if ff else "")
    elif ff: name = " und ".join(ff)
    else: name = ""
    ab.append({"lab": i, "wb": nr, "name": name})

reg = '<g id="k-bereiche">'
for w in wb:
    reg += '<path class="k-wb k-wb%d" data-wb="%d" d="%s"/>' % (w["nr"], w["nr"], kontur(np.where(labW == w["lab"], 255, 0).astype(np.uint8)))
for k, a in enumerate(ab):
    reg += '<path class="k-abr k-abr%d" d="%s"/>' % (k, kontur(np.where(labA == a["lab"], 255, 0).astype(np.uint8)))
reg += "</g>"
# Bereiche direkt hinter die Papierfläche der Stadt legen
s2 = re.sub(r'(<g clip-path="url\(#stadt\)"><rect [^>]*/>)', lambda m: m.group(1) + reg, s2, count=1)

STIL = """.k-wb{stroke:none}.k-wb1{fill:#3d6fc4;fill-opacity:.11}.k-wb2{fill:#2e9a55;fill-opacity:.11}.k-wb3{fill:#d4952a;fill-opacity:.14}
.k-abr{fill:none;stroke:none}
.k-sied{fill:#e8c8ae;stroke:#c39373;stroke-width:.3}
.k-ns{stroke:#7f827c;stroke-width:.6}
.k-hs{fill:#f0b429;stroke:#9c6d0c;stroke-width:.18}
.k-ab{fill:#e4571b;stroke:#8f2f07;stroke-width:.28}
.k-bahn{fill:#232323}.k-bahnh{fill:#ffffff;stroke:#232323;stroke-width:.16}
.k-kanal{fill:#0d5fc2;stroke:#0d5fc2;stroke-width:.45}.k-hafen{fill:#0d5fc2;stroke:#0d5fc2;stroke-width:.45}.k-erhol{fill:#3a9de0}.k-see{fill:#3a9de0}.k-fluss{fill:#3a9de0}
.k-wbg{fill:#d61c21;stroke:#d61c21;stroke-width:.45}.k-abg{fill:#d61c21}"""
s2 = re.sub(r"(<svg[^>]*>)", lambda m: m.group(1) + '<style id="infra">' + STIL.replace("\n", "") + "</style>", s2, count=1)

INFRA = {
    "klassen": {
        "k-ab": ["Autobahn", "Bundesautobahn mit Anschlussstellen, Zufahrt der Einsatzkräfte nur über die Richtungsfahrbahn"],
        "k-hs": ["Hauptverkehrsstraße", "Bundes-, Landes- oder Kreisstraße, Hauptanfahrtsweg"],
        "k-ns": ["Straße", "Gemeindestraße oder Erschließungsstraße"],
        "k-bahn": ["Bahnstrecke", "Eisenbahnstrecke, bei Einsätzen Sperrung über den Notfallmanager der Bahn"],
        "k-bahnh": ["Bahnstrecke", "Eisenbahnstrecke, bei Einsätzen Sperrung über den Notfallmanager der Bahn"],
        "k-kanal": ["Wasserstraße", "Schiffbarer Kanal mit Güterverkehr"],
        "k-hafen": ["Hafenbecken", "Stadthafen am Kanal westlich der FRW 2"],
        "k-erhol": ["Erholungssee", "See ohne Schifffahrt, Freizeit- und Erholungsnutzung"],
        "k-see": ["Stillgewässer", "See oder Teich"],
        "k-fluss": ["Fließgewässer", "Fluss oder Bach"],
        "k-sied": ["Wohn- und Siedlungsgebiet", "Geschlossene Bebauung"],
        "k-wbg": ["Wachbezirksgrenze", "Grenze zwischen zwei Wachbezirken"],
        "k-abg": ["Grenze Ausrückebereich", "Grenze zwischen zwei Ausrückebereichen"]
    },
    "wb": [{"nr": w["nr"], "wache": w["wache"]} for w in wb],
    "ab": [{"wb": a["wb"], "name": a["name"]} for a in ab]
}
(root / "assets/karte_infra.svg").write_text(s2, encoding="utf-8")
(root / "js/kartesvg.js").write_text(
    "/* Vektorisierte Karte Musterstadt mit hervorgehobener Infrastruktur, erzeugt mit tools/karte_vektor.py und tools/karte_infra.py aus Anhang I der Lernunterlage B2-211 (IdF NRW) */\n"
    "window.KARTE_SVG = " + json.dumps(s2) + ";\n"
    "window.KARTE_INFRA = " + json.dumps(INFRA, ensure_ascii=False) + ";\n"
    'document.getElementById("maptex").src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(window.KARTE_SVG);\n',
    encoding="utf-8")
print("Klassen:", zaehl)
print("Wachbezirke:", [(w["nr"], w["wache"]) for w in wb])
print("Ausrückebereiche:", [(a["wb"], a["name"]) for a in ab])
