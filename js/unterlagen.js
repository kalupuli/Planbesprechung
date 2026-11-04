/* Unterlagen: Originaldokumente als PDF, angezeigt mit pdf.js (Mozilla, Apache 2.0).
   Im Build (tools/build.py) werden die PDF-Dateien als Base64 in window.UNTERLAGEN_DATEN eingebettet,
   im Projektordner werden sie aus assets/ geladen. */
(function () {
"use strict";
const DOKS = [
  { id: "lernunterlage", titel: "Lernunterlage Musterstadt", knapp: "Lernunterlage", datei: "assets/lernunterlage_b2-211_musterstadt.pdf",
    quelle: "IdF NRW, Lernunterlage B2-211 »Vorstellung einer Musterstadt«, Stand 10.07.2017",
    kapitel: [
      ["Inhaltsverzeichnis", 3], ["1 Einleitung", 4], ["2 Gefahrenabwehr", 5], ["2.2 Berufsfeuerwehr", 6], ["2.3 Freiwillige Feuerwehr", 8],
      ["2.4 Überörtliche Hilfe", 11], ["2.5 Rettungsdienst", 12], ["2.6 Führungsstruktur", 13], ["2.7 AAO", 14],
      ["3 ABC-Gefahren", 16], ["3.2 Dekontamination", 17], ["3.3 Messen und Warnen", 18], ["4 MANV-Strukturen", 19], ["4.2 Einsatzeinheiten", 21],
      ["5 Digitalfunk", 23], ["I Karte Musterstadt", 25], ["II Fahrzeugübersicht", 26], ["II.III Freiwillige Feuerwehr", 28], ["III Literatur", 30]
    ] },
  { id: "tafel", titel: "Taktische Arbeitstafel", knapp: "Arbeitstafel", datei: "assets/taktische_arbeitstafel.pdf",
    quelle: "Taktische Arbeitstafel für die Führungsstufen B + C, Druckvorlage", kapitel: [] }
];
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const ov = $("#docOv"), body = $("#docBody"), seiten = $("#docSeiten"), nav = $("#docNav");
const cache = {}; let akt = null, pdf = null, zoom = 1, beob = null, renderT = 0, laufend = 0;

function bytes(d) {
  const b64 = (window.UNTERLAGEN_DATEN || {})[d.id];
  if (b64) { const s = atob(b64), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return Promise.resolve(u); }
  return fetch(d.datei).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); }).then(b => new Uint8Array(b));
}
function laden(d) {
  if (!cache[d.id]) cache[d.id] = bytes(d).then(u => {
    const kopie = u.slice(0);
    return window.pdfjsLib.getDocument({ data: u, isEvalSupported: false }).promise.then(p => ({ p, u: kopie }));
  });
  return cache[d.id];
}

function tabs() {
  $("#docTabs").innerHTML = DOKS.map(d => `<button type="button" class="${akt && akt.id === d.id ? "on" : ""}" data-doctab="${d.id}"><span class="lang">${esc(d.titel)}</span><span class="knapp">${esc(d.knapp)}</span></button>`).join("");
}
function kapitel() {
  nav.hidden = !akt.kapitel.length;
  nav.innerHTML = akt.kapitel.length ? `<h5>Kapitel</h5>` + akt.kapitel.map(k => `<button type="button" data-docseite="${k[1]}"><span>${esc(k[0])}</span><i>${k[1]}</i></button>`).join("") : "";
}
function breite() { return Math.max(240, body.clientWidth - 32); }

async function aufbauen(ziel) {
  const nr = ++laufend;
  seiten.innerHTML = '<p class="doc-lade">Dokument wird geladen …</p>';
  let r;
  try { r = await laden(akt); } catch (e) { if (nr === laufend) seiten.innerHTML = `<p class="doc-lade">Das Dokument konnte nicht geladen werden (${esc(e.message || e)}).</p>`; return; }
  if (nr !== laufend) return;
  pdf = r.p;
  const p1 = await pdf.getPage(1), v1 = p1.getViewport({ scale: 1 });
  const w = breite() * zoom, h = w * v1.height / v1.width;
  if (beob) beob.disconnect();
  seiten.innerHTML = Array.from({ length: pdf.numPages }, (_, i) => `<div class="doc-seite" data-nr="${i + 1}" style="width:${w.toFixed(0)}px;height:${h.toFixed(0)}px"><span class="doc-nr">${i + 1}</span></div>`).join("");
  beob = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) zeichne(e.target, nr); }), { root: body, rootMargin: "600px 0px" });
  seiten.querySelectorAll(".doc-seite").forEach(el => beob.observe(el));
  $("#docAnz").textContent = `${ziel || 1} / ${pdf.numPages}`;
  $("#docZoom").textContent = Math.round(zoom * 100) + " %";
  body.scrollTop = 0;
  if (ziel > 1) springe(ziel, false);
}
async function zeichne(el, nr) {
  if (el.dataset.gez === String(zoom)) return;
  el.dataset.gez = String(zoom);
  const seite = await pdf.getPage(+el.dataset.nr);
  if (nr !== laufend) return;
  const v1 = seite.getViewport({ scale: 1 }), css = parseFloat(el.style.width);
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  const max = 16e6, px = (css * dpr) * (css * dpr * v1.height / v1.width);
  if (px > max) dpr *= Math.sqrt(max / px);
  const vp = seite.getViewport({ scale: css / v1.width * dpr });
  const c = document.createElement("canvas"); c.width = Math.floor(vp.width); c.height = Math.floor(vp.height);
  c.setAttribute("aria-label", `${akt.titel}, Seite ${el.dataset.nr}`);
  try { await seite.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise; } catch (e) { el.dataset.gez = ""; return; }
  if (nr !== laufend) return;
  el.querySelectorAll("canvas").forEach(x => x.remove());
  el.prepend(c);
}
function springe(n, weich) {
  const el = seiten.querySelector(`.doc-seite[data-nr="${n}"]`);
  if (el) body.scrollTo({ top: el.offsetTop - 12, behavior: weich ? "smooth" : "auto" });
}
function aktuelleSeite() {
  const m = body.scrollTop + body.clientHeight / 3; let n = 1;
  seiten.querySelectorAll(".doc-seite").forEach(el => { if (el.offsetTop <= m) n = +el.dataset.nr; });
  return n;
}
function setzeZoom(z) {
  const s = aktuelleSeite();
  zoom = Math.max(0.5, Math.min(4, z));
  aufbauen(s);
}

async function speichern() {
  const r = await laden(akt), name = akt.datei.split("/").pop(), blob = new Blob([r.u], { type: "application/pdf" });
  let dl = null;
  try { if (window.claude && window.claude.use) dl = await window.claude.use("downloads"); } catch (e) { dl = null; }
  if (dl) {
    try { await dl.save({ filename: name, data: blob }); return; }
    catch (e) { if (e && e.code !== "unavailable") { hinweis("Speichern nicht möglich: " + (e.message || e.code)); return; } }
  }
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
function hinweis(t) { $("#docHint").textContent = t; }

function oeffne(id, seite) {
  const d = DOKS.find(x => x.id === id) || DOKS[0];
  ov.hidden = false;
  if (!window.pdfjsLib) { seiten.innerHTML = '<p class="doc-lade">Die PDF-Anzeige steht nicht zur Verfügung.</p>'; return; }
  if (!akt || akt.id !== d.id) { akt = d; zoom = 1; tabs(); kapitel(); hinweis(d.quelle); aufbauen(seite || 1); }
  else if (seite) springe(seite, true);
}
function schliesse() { ov.hidden = true; }

document.addEventListener("click", e => {
  const t = e.target.closest("[data-doc],[data-doctab],[data-docseite]");
  if (!t) return;
  if (t.dataset.doc) { e.preventDefault(); oeffne(t.dataset.doc, +t.dataset.seite || 0); }
  else if (t.dataset.doctab) oeffne(t.dataset.doctab);
  else springe(+t.dataset.docseite, true);
});
$("#btnDocs").addEventListener("click", () => oeffne(akt ? akt.id : "lernunterlage"));
$("#docClose").addEventListener("click", schliesse);
$("#docPrev").addEventListener("click", () => springe(Math.max(1, aktuelleSeite() - 1), true));
$("#docNext").addEventListener("click", () => springe(Math.min(pdf ? pdf.numPages : 1, aktuelleSeite() + 1), true));
$("#docMinus").addEventListener("click", () => setzeZoom(zoom / 1.25));
$("#docPlus").addEventListener("click", () => setzeZoom(zoom * 1.25));
$("#docFit").addEventListener("click", () => setzeZoom(1));
$("#docSave").addEventListener("click", () => { if (akt) speichern(); });
body.addEventListener("scroll", () => { if (pdf) $("#docAnz").textContent = `${aktuelleSeite()} / ${pdf.numPages}`; }, { passive: true });
window.addEventListener("resize", () => { if (ov.hidden || !pdf) return; clearTimeout(renderT); renderT = setTimeout(() => aufbauen(aktuelleSeite()), 250); });
document.addEventListener("keydown", e => {
  if (ov.hidden) return;
  if (e.key === "Escape") { e.stopImmediatePropagation(); schliesse(); }
  else if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); $("#docNext").click(); }
  else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); $("#docPrev").click(); }
}, true);

window.Unterlagen = { oeffne, schliesse, DOKS };
})();
