/* Stadtkarte: Originalkarte aus Anhang I der Lernunterlage B2-211 als verschiebbare 2D-Ansicht.
   Die Spielkoordinaten (Prozent der Kartentextur) werden über den Ausschnitt der PDF-Seite umgerechnet:
   Textur = Seite 25, Punkte (54,156) bis (442,618). Stadtkarte = Seite 25, Punkte (40,92) bis (560,730). */
(function () {
"use strict";
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const umr = (x, y) => ({ x: (54 + x / 100 * 388 - 40) / 520 * 100, y: (156 + y / 100 * 462 - 92) / 638 * 100 });
const stage = $("#stage"), ov = $("#stadtOv"), vp = $("#stadtVp"), inn = $("#stadtIn"), img = $("#stadtImg"), marken = $("#stadtMarken");
let s = 1, tx = 0, ty = 0, s0 = 1, iw = 2527, ih = 3101, timer = 0;
const zeiger = new Map(); let pinch = null;

function anwenden() {
  inn.style.transform = `translate(${tx}px,${ty}px) scale(${s})`;
  inn.style.setProperty("--inv", (1 / s).toFixed(4));
}
function begrenzen() {
  const w = vp.clientWidth, h = vp.clientHeight, bw = iw * s, bh = ih * s, rand = 60;
  tx = bw <= w ? (w - bw) / 2 : Math.min(rand, Math.max(w - bw - rand, tx));
  ty = bh <= h ? (h - bh) / 2 : Math.min(rand, Math.max(h - bh - rand, ty));
}
function zoomUm(f, cx, cy) {
  const n = Math.max(s0 * 0.9, Math.min(s0 * 12, s * f)); f = n / s;
  tx = cx - (cx - tx) * f; ty = cy - (cy - ty) * f; s = n; begrenzen(); anwenden();
}
function einpassen() {
  s0 = Math.min(vp.clientWidth / iw, vp.clientHeight / ih) * 0.98; s = s0; begrenzen(); anwenden();
}
function zentriere(x, y, fak) {
  const p = umr(x, y); s = Math.min(s0 * 12, s0 * (fak || 3.2));
  tx = vp.clientWidth / 2 - p.x / 100 * iw * s; ty = vp.clientHeight / 2 - p.y / 100 * ih * s; begrenzen(); anwenden();
}

function zeichneMarken() {
  const api = window.__pms, daten = api && api.stadtMarken ? api.stadtMarken() : { est: null, fz: [] };
  let h = "";
  if (daten.est) {
    const p = umr(daten.est.x, daten.est.y);
    h += `<div class="sk-m sk-est" style="left:${p.x}%;top:${p.y}%"><i></i><i></i><span><small>${esc(daten.est.art)}</small><b>${esc(daten.est.titel)}</b>${daten.est.vorOrt ? `<em>${daten.est.vorOrt} Einheiten vor Ort</em>` : ""}</span></div>`;
  }
  daten.fz.forEach(f => { const p = umr(f.x, f.y); h += `<div class="sk-m sk-fz ${f.kls}" style="left:${p.x}%;top:${p.y}%"><span>${esc(f.text)}</span></div>`; });
  marken.innerHTML = h;
  const est = $("#stadtEst"); if (est) est.hidden = !daten.est;
}

function zeige() {
  ov.hidden = false; stage.classList.add("stadt-an");
  einpassen(); zeichneMarken();
  clearInterval(timer); timer = setInterval(zeichneMarken, 700);
}
function verstecke() {
  ov.hidden = true; stage.classList.remove("stadt-an");
  clearInterval(timer);
}
const offen = () => !ov.hidden;

img.addEventListener("load", () => { iw = img.naturalWidth || iw; ih = img.naturalHeight || ih; inn.style.width = iw + "px"; inn.style.height = ih + "px"; if (offen()) einpassen(); });
inn.style.width = iw + "px"; inn.style.height = ih + "px";
$("#stadtPlus").addEventListener("click", () => zoomUm(1.4, vp.clientWidth / 2, vp.clientHeight / 2));
$("#stadtMinus").addEventListener("click", () => zoomUm(1 / 1.4, vp.clientWidth / 2, vp.clientHeight / 2));
$("#stadtFit").addEventListener("click", einpassen);
$("#stadtEst").addEventListener("click", () => { const d = window.__pms.stadtMarken(); if (d.est) zentriere(d.est.x, d.est.y); });

vp.addEventListener("wheel", e => {
  e.preventDefault(); const r = vp.getBoundingClientRect();
  zoomUm(Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0018)), e.clientX - r.left, e.clientY - r.top);
}, { passive: false });
vp.addEventListener("dblclick", e => { const r = vp.getBoundingClientRect(); zoomUm(1.8, e.clientX - r.left, e.clientY - r.top); });
vp.addEventListener("pointerdown", e => {
  vp.setPointerCapture(e.pointerId); zeiger.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (zeiger.size === 2) { const [a, b] = [...zeiger.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), s }; }
  vp.classList.add("zieht");
});
vp.addEventListener("pointermove", e => {
  const alt = zeiger.get(e.pointerId); if (!alt) return;
  const neu = { x: e.clientX, y: e.clientY }; zeiger.set(e.pointerId, neu);
  if (zeiger.size === 1) { tx += neu.x - alt.x; ty += neu.y - alt.y; begrenzen(); anwenden(); }
  else if (zeiger.size === 2 && pinch) {
    const [a, b] = [...zeiger.values()], r = vp.getBoundingClientRect();
    const d = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2 - r.left, my = (a.y + b.y) / 2 - r.top;
    tx += (neu.x - alt.x) / 2; ty += (neu.y - alt.y) / 2;
    zoomUm(pinch.s * d / pinch.d / s, mx, my);
  }
});
const los = e => { zeiger.delete(e.pointerId); if (zeiger.size < 2) pinch = null; if (!zeiger.size) vp.classList.remove("zieht"); };
vp.addEventListener("pointerup", los); vp.addEventListener("pointercancel", los);
window.addEventListener("resize", () => { if (offen()) einpassen(); });
document.addEventListener("keydown", e => {
  if (e.key !== "Escape" || !offen()) return;
  if (document.querySelector(".overlay:not([hidden])") || !document.querySelector("#drawer").hidden) return;
  verstecke();
});

window.Stadtkarte = { zeige, verstecke, offen, zentriere };

/* Ansicht der Bühne: Taktische Arbeitstafel (ab Übernahme der Einsatzleitung, mit Lagebild und Führungsorganisation), 3D-Karte oder Originalstadtkarte */
const lageStage = $("#lageStage"), gruppe = $("#ansicht");
let modus = "3d";
function setzeAnsicht(m) {
  const P = window.__pms, G = P && P.G;
  if (m === "tafel" && !G) m = "3d";
  modus = m;
  if (m === "stadt") zeige(); else verstecke();
  lageStage.hidden = m !== "tafel"; stage.classList.toggle("lage-an", m === "tafel");
  if (m !== "tafel") { lageStage.classList.remove("voll"); stage.classList.remove("voll-an"); $("#lsVoll").textContent = "Vollbild"; $("#lsVoll").setAttribute("aria-pressed", "false"); }
  if (m === "tafel") { $("#lsTitel").textContent = G.sz.titel; P.renderTafel(); }
  syncAnsicht();
}
function syncAnsicht() {
  const G = window.__pms && window.__pms.G;
  gruppe.querySelectorAll("[data-ansicht]").forEach(b => { b.setAttribute("aria-pressed", b.dataset.ansicht === modus ? "true" : "false"); if (b.dataset.ansicht === "tafel") b.hidden = !G; });
}
gruppe.addEventListener("click", e => { const b = e.target.closest("[data-ansicht]"); if (b) setzeAnsicht(b.dataset.ansicht); });
$("#lsVoll").addEventListener("click", () => { const an = !lageStage.classList.contains("voll"); lageStage.classList.toggle("voll", an); stage.classList.toggle("voll-an", an); $("#lsVoll").setAttribute("aria-pressed", an ? "true" : "false"); $("#lsVoll").textContent = an ? "Vollbild beenden" : "Vollbild"; window.__pms.tafelZoom(); });
$("#lsWk").addEventListener("click", () => { const w = $("#lsWerkzeuge"), an = w.hidden; w.hidden = !an; $("#lsWk").setAttribute("aria-pressed", an ? "true" : "false"); try { localStorage.setItem("pms_werkzeuge", an ? "1" : "0"); } catch (e) {} setTimeout(() => window.__pms.tafelZoom(), 0); });
try { if (localStorage.getItem("pms_werkzeuge") === "0") { $("#lsWerkzeuge").hidden = true; $("#lsWk").setAttribute("aria-pressed", "false"); } } catch (e) {}
/* Einführung */
const introOv = $("#introOv");
const introZu = () => { introOv.hidden = true; };
$("#btnIntro").addEventListener("click", () => { introOv.hidden = false; introOv.querySelector(".ov-scroll").scrollTop = 0; });
$("#introClose").addEventListener("click", introZu); $("#introLos").addEventListener("click", introZu);
document.addEventListener("keydown", e => { if (e.key === "Escape" && !introOv.hidden) { e.stopImmediatePropagation(); introZu(); } }, true);
window.Ansicht = { setze: setzeAnsicht, modus: () => modus, sync: syncAnsicht, voll: () => lageStage.classList.contains("voll") };
})();
