/* Planbesprechung Musterstadt · Infrastruktur der 3D-Karte
   Ein Klick auf die Karte zeigt kurz, welches Element getroffen wurde (Autobahn, Straße, Bahnstrecke, Wasserstraße,
   Gewässer, Siedlungsfläche, Grenzen) und in welchem Wachbezirk und Ausrückebereich der Punkt liegt.
   Erkannt wird über unsichtbare Auswahlbilder: Die Vektorkarte wird je Klasse und je Ausrückebereich in einer
   eindeutigen Farbe gezeichnet und an der Klickstelle ausgelesen. Daten: window.KARTE_INFRA aus tools/karte_infra.py */
(function () {
"use strict";
const I = window.KARTE_INFRA, SVG = window.KARTE_SVG;
if (!I || !SVG) return;
const esc = t => String(t == null ? "" : t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const KL = Object.keys(I.klassen);
const PRIO = ["k-ab", "k-bahn", "k-bahnh", "k-kanal", "k-hafen", "k-hs", "k-erhol", "k-see", "k-fluss", "k-ns", "k-wbg", "k-abg", "k-sied"];
const BREITE = { "k-ab": 1.1, "k-hs": 0.9, "k-ns": 1.5, "k-bahn": 1.2, "k-bahnh": 1.2, "k-kanal": 1, "k-hafen": 1, "k-erhol": 0.6, "k-see": 0.6, "k-fluss": 1, "k-wbg": 0.9, "k-abg": 0.9, "k-sied": 0 };
const PW = 1164, PH = Math.round(PW * 462 / 388);
const farbeA = i => `rgb(${12 + i * 12},0,0)`, farbeB = k => `rgb(0,0,${12 + k * 10})`;
let ebenen = null;

function bild(stil) {
  const t = SVG.replace(/<style id="infra">[\s\S]*?<\/style>/, '<style id="infra">' + stil + "</style>");
  return new Promise((ok, fehl) => {
    const img = new Image(); img.onload = () => {
      const c = document.createElement("canvas"); c.width = PW; c.height = PH;
      const g = c.getContext("2d", { willReadFrequently: true }); g.imageSmoothingEnabled = false; g.drawImage(img, 0, 0, PW, PH);
      ok(g.getImageData(0, 0, PW, PH).data);
    };
    img.onerror = fehl; img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(t);
  });
}
function laden() {
  if (ebenen) return ebenen;
  const basis = "svg *{fill:none;stroke:none;shape-rendering:crispEdges}";
  const a = basis + KL.map((k, i) => `.${k}{fill:${k === "k-ns" ? "none" : farbeA(i)};stroke:${farbeA(i)};stroke-width:${BREITE[k] || 0.6}}`).join("");
  const b = basis + I.ab.map((_, k) => `.k-abr${k}{fill:${farbeB(k)}}`).join("");
  ebenen = Promise.all([bild(a), bild(b)]);
  return ebenen;
}

function lesen([A, B], x, y, tol) {
  const R = Math.max(2, Math.min(14, Math.round((tol || 0.35) / 100 * PW)));
  const px = Math.round(x / 100 * PW), py = Math.round(y / 100 * PH);
  let best = -1, bereich = -1;
  for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
    if (dx * dx + dy * dy > R * R) continue;
    const xx = px + dx, yy = py + dy; if (xx < 0 || yy < 0 || xx >= PW || yy >= PH) continue;
    const o = (yy * PW + xx) * 4;
    if (A[o + 3] > 200 && A[o + 1] < 6 && A[o + 2] < 6) {
      const i = Math.round((A[o] - 12) / 12);
      if (i >= 0 && i < KL.length && Math.abs(A[o] - (12 + i * 12)) <= 3) {
        const p = PRIO.indexOf(KL[i]);
        if (best < 0 || p < PRIO.indexOf(KL[best])) best = i;
      }
    }
  }
  const o = (py * PW + px) * 4;
  if (px >= 0 && py >= 0 && px < PW && py < PH && B[o + 3] > 200 && B[o] < 6 && B[o + 1] < 6) {
    const k = Math.round((B[o + 2] - 12) / 10); if (k >= 0 && k < I.ab.length) bereich = k;
  }
  return { k: best >= 0 ? KL[best] : null, ab: bereich >= 0 ? I.ab[bereich] : null };
}

let pop = null, timer = 0;
function zeigePop(html, cx, cy) {
  const stage = document.querySelector("#stage"); if (!stage) return;
  if (!pop) { pop = document.createElement("div"); pop.className = "infra-pop"; pop.setAttribute("role", "status"); stage.appendChild(pop); }
  const r = stage.getBoundingClientRect();
  pop.innerHTML = html; pop.classList.add("an");
  const w = pop.offsetWidth, h = pop.offsetHeight;
  pop.style.left = Math.max(8, Math.min(r.width - w - 8, cx - r.left - w / 2)) + "px";
  pop.style.top = (cy - r.top - h - 16 < 8 ? cy - r.top + 18 : cy - r.top - h - 16) + "px";
  clearTimeout(timer); timer = setTimeout(() => pop.classList.remove("an"), 3800);
}
async function zeige(x, y, cx, cy, tol) {
  if (x < 0 || y < 0 || x > 100 || y > 100) return;
  let d; try { d = lesen(await laden(), x, y, tol); } catch (e) { return; }
  if (!d.k && !d.ab) return;
  const wb = d.ab ? I.wb.find(w => w.nr === d.ab.wb) : null;
  const ort = d.ab ? `Wachbezirk ${d.ab.wb}${wb ? " (" + esc(wb.wache) + ")" : ""}${d.ab.name ? " · Ausrückebereich " + esc(d.ab.name) : ""}` : "";
  let h;
  if (d.k) { const [t, b] = I.klassen[d.k]; h = `<i class="ip-farbe ${d.k}"></i><b>${esc(t)}</b><span>${esc(b)}</span>${ort ? `<small>${ort}</small>` : ""}`; }
  else h = `<i class="ip-farbe k-wb${d.ab.wb}"></i><b>Wachbezirk ${d.ab.wb}${wb ? " · " + esc(wb.wache) : ""}</b>${d.ab.name ? `<span>Ausrückebereich ${esc(d.ab.name)}</span>` : ""}`;
  zeigePop(h, cx, cy);
}
window.Infrastruktur = { zeige, laden };
})();
