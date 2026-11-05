/* Planbesprechung Musterstadt · Lagekarte ergänzen
   Der Prüfling ergänzt die übergebene Lagekarte durch handgezeichnete Elemente und taktische Zeichen.
   Die Ergänzungen liegen im Spielzustand (G.lk) und erscheinen in den Unterlagen und auf der Arbeitstafel. */
(function () {
"use strict";
const P = window.__pms;
const $ = s => document.querySelector(s);
const esc = t => String(t == null ? "" : t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const FARBEN = [["#d81b1b", "Rot"], ["#1d4ed8", "Blau"], ["#111111", "Schwarz"], ["#15803d", "Grün"], ["#ea7c00", "Orange"]];
const BREITEN = [[2, "dünn"], [3.5, "mittel"], [6, "dick"]];
const WERKZEUGE = [["wahl", "Auswählen"], ["stift", "Stift"], ["linie", "Linie"], ["pfeil", "Pfeil"], ["kreis", "Kreis"], ["text", "Text"], ["zeichen", "Taktisches Zeichen"], ["radierer", "Radierer"]];
const GRUPPEN = [
  ["Feuerwehr", ["Feuerwehr_Einheiten", "Feuerwehr_Fahrzeuge", "Feuerwehr_Gebäude"]],
  ["Führung", ["Führungsstellen", "Einheiten", "Abgeleitet"]],
  ["Rettungswesen", ["Rettungswesen_Einheiten", "Rettungswesen_Fahrzeuge", "Rettungswesen_Einrichtungen"]],
  ["Katastrophenschutz", ["Katastrophenschutz_Einheiten", "Katastrophenschutz_Fahrzeuge"]],
  ["THW", ["THW_Einheiten", "THW_Fahrzeuge", "THW_Gebäude", "THW_Personen"]],
  ["Polizei", ["Polizei_Einheiten", "Polizei_Fahrzeuge"]],
  ["Gefahren", ["Gefahren"]], ["Maßnahmen", ["Maßnahmen"]], ["Einrichtungen", ["Einrichtungen"]],
  ["Personen", ["Personen"]], ["Fahrzeuge allgemein", ["Fahrzeuge"]], ["Sonstiges", ["Sonstiges"]]
];
const ov = $("#lzOv"), flaeche = $("#lzFlaeche"), seite = $("#lzSeite");
let werkzeug = "stift", farbe = FARBEN[0][0], breite = BREITEN[1][0], zeichen = "Feuerwehr_Einheiten/Löschzug", gruppe = "Feuerwehr", suche = "", groesse = 40;
let wahl = -1, aktiv = null, zieh = null, verlauf = [];
const items = () => (P.G ? (P.G.lk = P.G.lk || []) : []);

/* ───────── Darstellung der Ergänzungen als SVG ───────── */
function kopf(x1, y1, x2, y2, f, w) {
  const a = Math.atan2(y2 - y1, x2 - x1), l = 8 + w * 2.2, b = 4 + w * 1.2;
  const p = [[x2, y2], [x2 - l * Math.cos(a) + b * Math.sin(a), y2 - l * Math.sin(a) - b * Math.cos(a)], [x2 - l * Math.cos(a) - b * Math.sin(a), y2 - l * Math.sin(a) + b * Math.cos(a)]];
  return `<polygon points="${p.map(q => q.map(v => v.toFixed(1)).join(",")).join(" ")}" fill="${f}"/>`;
}
function itemSvg(i) {
  const f = /^#[0-9a-f]{6}$/i.test(i.f) ? i.f : "#d81b1b", w = Number(i.w) || 3;
  if (i.t === "pfad") return `<polyline points="${i.pts.map(p => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ")}" fill="none" stroke="${f}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  if (i.t === "linie" || i.t === "pfeil") {
    const k = i.t === "pfeil" ? kopf(i.x1, i.y1, i.x2, i.y2, f, w) : "";
    const ende = i.t === "pfeil" ? (() => { const a = Math.atan2(i.y2 - i.y1, i.x2 - i.x1), l = 6 + w * 1.6; return [i.x2 - l * Math.cos(a), i.y2 - l * Math.sin(a)]; })() : [i.x2, i.y2];
    return `<line x1="${i.x1}" y1="${i.y1}" x2="${ende[0].toFixed(1)}" y2="${ende[1].toFixed(1)}" stroke="${f}" stroke-width="${w}" stroke-linecap="round"${i.gestrichelt ? ' stroke-dasharray="10 7"' : ""}/>${k}`;
  }
  if (i.t === "kreis") return `<circle cx="${i.cx}" cy="${i.cy}" r="${Math.max(2, i.r).toFixed(1)}" fill="none" stroke="${f}" stroke-width="${w}"${i.gestrichelt ? ' stroke-dasharray="10 7"' : ""}/>`;
  if (i.t === "text") return `<text x="${i.x}" y="${i.y}" font-size="${(10 + w * 1.6).toFixed(1)}" font-weight="700" fill="${f}" font-family="Arial,Helvetica,sans-serif">${esc(i.txt)}</text>`;
  if (i.t === "zeichen") { const s = i.s || 40; return `<g>${P.tz(i.z, { x: i.x - s / 2, y: i.y - s / 2, w: s, h: s })}${i.txt ? `<text x="${i.x}" y="${i.y + s / 2 + 9}" text-anchor="middle" font-size="9.5" font-weight="700" fill="#111" font-family="Arial,Helvetica,sans-serif">${esc(i.txt)}</text>` : ""}</g>`; }
  return "";
}
function svg(list) { return `<g class="lz-ergaenzung">${(list || []).map(itemSvg).join("")}</g>`; }

/* ───────── Treffer und Begrenzung ───────── */
function box(i) {
  if (i.t === "pfad") { const xs = i.pts.map(p => p[0]), ys = i.pts.map(p => p[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; }
  if (i.t === "linie" || i.t === "pfeil") return [Math.min(i.x1, i.x2), Math.min(i.y1, i.y2), Math.max(i.x1, i.x2), Math.max(i.y1, i.y2)];
  if (i.t === "kreis") return [i.cx - i.r, i.cy - i.r, i.cx + i.r, i.cy + i.r];
  if (i.t === "text") { const fs = 10 + (i.w || 3) * 1.6; return [i.x, i.y - fs, i.x + i.txt.length * fs * 0.58, i.y + 3]; }
  if (i.t === "zeichen") { const s = i.s || 40; return [i.x - s / 2, i.y - s / 2, i.x + s / 2, i.y + s / 2 + (i.txt ? 12 : 0)]; }
  return [0, 0, 0, 0];
}
function abstandSeg(px, py, ax, ay, bx, by) { const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy; let t = l ? ((px - ax) * dx + (py - ay) * dy) / l : 0; t = Math.max(0, Math.min(1, t)); return Math.hypot(px - ax - t * dx, py - ay - t * dy); }
function treffer(x, y) {
  const L = items();
  for (let k = L.length - 1; k >= 0; k--) {
    const i = L[k], tol = 7 + (i.w || 3) / 2;
    if (i.t === "pfad") { for (let j = 1; j < i.pts.length; j++) if (abstandSeg(x, y, i.pts[j - 1][0], i.pts[j - 1][1], i.pts[j][0], i.pts[j][1]) < tol) return k; continue; }
    if (i.t === "linie" || i.t === "pfeil") { if (abstandSeg(x, y, i.x1, i.y1, i.x2, i.y2) < tol) return k; continue; }
    if (i.t === "kreis") { if (Math.abs(Math.hypot(x - i.cx, y - i.cy) - i.r) < tol) return k; continue; }
    const b = box(i); if (x >= b[0] - 4 && x <= b[2] + 4 && y >= b[1] - 4 && y <= b[3] + 4) return k;
  }
  return -1;
}
function verschiebe(i, dx, dy) {
  if (i.t === "pfad") i.pts = i.pts.map(p => [p[0] + dx, p[1] + dy]);
  else if (i.t === "linie" || i.t === "pfeil") { i.x1 += dx; i.y1 += dy; i.x2 += dx; i.y2 += dy; }
  else if (i.t === "kreis") { i.cx += dx; i.cy += dy; }
  else { i.x += dx; i.y += dy; }
}
// Vereinfachung handgezeichneter Linien (Ramer-Douglas-Peucker)
function rdp(pts, eps) {
  if (pts.length < 3) return pts;
  let dmax = 0, idx = 0; const a = pts[0], b = pts[pts.length - 1];
  for (let i = 1; i < pts.length - 1; i++) { const d = abstandSeg(pts[i][0], pts[i][1], a[0], a[1], b[0], b[1]); if (d > dmax) { dmax = d; idx = i; } }
  if (dmax > eps) { const l = rdp(pts.slice(0, idx + 1), eps), r = rdp(pts.slice(idx), eps); return l.slice(0, -1).concat(r); }
  return [a, b];
}

/* ───────── Oberfläche ───────── */
function sichern() { verlauf.push(JSON.stringify(items())); if (verlauf.length > 60) verlauf.shift(); }
function zeichneFlaeche() {
  if (!P.G) return;
  const basis = P.svgLage(P.G.sz, true, true);
  let markierung = "";
  if (wahl >= 0 && items()[wahl]) { const b = box(items()[wahl]); markierung = `<rect x="${b[0] - 5}" y="${b[1] - 5}" width="${b[2] - b[0] + 10}" height="${b[3] - b[1] + 10}" fill="none" stroke="#f1a62b" stroke-width="1.6" stroke-dasharray="5 4"/>`; }
  const vorschau = aktiv ? itemSvg(aktiv) : "";
  const ende = basis.lastIndexOf("</svg>");
  flaeche.innerHTML = basis.slice(0, ende) + svg(items()) + vorschau + markierung + basis.slice(ende);
  flaeche.style.cursor = werkzeug === "wahl" ? "default" : werkzeug === "radierer" ? "not-allowed" : "crosshair";
}
function zeichenListe() {
  const ordner = (GRUPPEN.find(g => g[0] === gruppe) || GRUPPEN[0])[1];
  const q = suche.toLowerCase();
  return Object.keys(window.TZ).filter(k => q ? k.toLowerCase().replace(/_/g, " ").includes(q) : ordner.includes(k.split("/")[0])).slice(0, 160);
}
function renderSeite() {
  const sel = wahl >= 0 ? items()[wahl] : null;
  let h = `<div class="lz-grp"><h5>Farbe</h5><div class="lz-farben">${FARBEN.map(([f, n]) => `<button type="button" class="${f === farbe ? "on" : ""}" data-lzf="${f}" title="${n}" aria-label="${n}" style="--c:${f}"></button>`).join("")}</div></div>
   <div class="lz-grp"><h5>Strichstärke</h5><div class="lz-seg">${BREITEN.map(([w, n]) => `<button type="button" class="${w === breite ? "on" : ""}" data-lzw="${w}">${n}</button>`).join("")}</div></div>
   <div class="lz-grp"><h5>Beschriftung</h5><input id="lzTxt" placeholder="${werkzeug === "text" ? "Text, dann in die Karte tippen" : "optional, z. B. EA 1 oder BR"}" value="${esc(sel && (sel.t === "text" || sel.t === "zeichen") ? sel.txt || "" : $("#lzTxt") ? $("#lzTxt").value : "")}"></div>`;
  if (werkzeug === "zeichen" || (sel && sel.t === "zeichen")) {
    h += `<div class="lz-grp"><h5>Größe</h5><input type="range" id="lzGr" min="20" max="90" step="2" value="${sel && sel.t === "zeichen" ? sel.s : groesse}"></div>
     <div class="lz-grp"><h5>Taktische Zeichen</h5><input id="lzSuche" type="search" placeholder="Zeichen suchen" value="${esc(suche)}">
     <select id="lzGruppe" ${suche ? "disabled" : ""}>${GRUPPEN.map(g => `<option ${g[0] === gruppe ? "selected" : ""}>${esc(g[0])}</option>`).join("")}</select>
     <div class="lz-zeichen">${zeichenListe().map(k => `<button type="button" class="${k === zeichen ? "on" : ""}" data-lzz="${esc(k)}" title="${esc(k.split("/")[1].replace(/_/g, " "))}">${P.tz(k)}</button>`).join("")}</div></div>`;
  }
  if (sel) h += `<div class="lz-grp"><button type="button" class="mini sec" id="lzDel">Gewähltes Element löschen</button></div>`;
  h += `<p class="note lz-hilfe">${{ wahl: "Element antippen und ziehen, um es zu verschieben. Entf löscht.", stift: "Freihand zeichnen.", linie: "Von Anfang bis Ende ziehen.", pfeil: "Von Anfang bis Spitze ziehen.", kreis: "Vom Mittelpunkt nach außen ziehen.", text: "Text eingeben und in die Karte tippen.", zeichen: "Zeichen wählen und in die Karte tippen.", radierer: "Element antippen, um es zu löschen." }[werkzeug]}</p>`;
  seite.innerHTML = h;
  seite.querySelectorAll("[data-lzf]").forEach(b => b.addEventListener("click", () => { farbe = b.dataset.lzf; if (sel && sel.t !== "zeichen") { sichern(); sel.f = farbe; zeichneFlaeche(); } renderSeite(); }));
  seite.querySelectorAll("[data-lzw]").forEach(b => b.addEventListener("click", () => { breite = +b.dataset.lzw; if (sel && sel.t !== "zeichen") { sichern(); sel.w = breite; zeichneFlaeche(); } renderSeite(); }));
  seite.querySelectorAll("[data-lzz]").forEach(b => b.addEventListener("click", () => { zeichen = b.dataset.lzz; if (sel && sel.t === "zeichen") { sichern(); sel.z = zeichen; zeichneFlaeche(); } else { werkzeug = "zeichen"; renderLeiste(); } renderSeite(); }));
  const txt = $("#lzTxt"); txt.addEventListener("input", () => { if (sel && (sel.t === "text" || sel.t === "zeichen")) { sel.txt = txt.value.slice(0, 60); zeichneFlaeche(); } });
  txt.addEventListener("focus", () => { if (sel) sichern(); }, { once: true });
  const gr = $("#lzGr"); if (gr) gr.addEventListener("input", () => { groesse = +gr.value; if (sel && sel.t === "zeichen") { sel.s = groesse; zeichneFlaeche(); } });
  const su = $("#lzSuche"); if (su) su.addEventListener("input", () => { suche = su.value; const pos = su.selectionStart; renderSeite(); const n = $("#lzSuche"); n.focus(); n.setSelectionRange(pos, pos); });
  const gs = $("#lzGruppe"); if (gs) gs.addEventListener("change", () => { gruppe = gs.value; renderSeite(); });
  const del = $("#lzDel"); if (del) del.addEventListener("click", loescheWahl);
}
function renderLeiste() {
  $("#lzWerkzeuge").innerHTML = WERKZEUGE.map(([k, n]) => `<button type="button" class="${k === werkzeug ? "on" : ""}" data-lzt="${k}">${esc(n)}</button>`).join("");
  $("#lzWerkzeuge").querySelectorAll("[data-lzt]").forEach(b => b.addEventListener("click", () => { werkzeug = b.dataset.lzt; if (werkzeug !== "wahl") wahl = -1; renderLeiste(); renderSeite(); zeichneFlaeche(); }));
  $("#lzUndo").disabled = !verlauf.length;
}
function loescheWahl() { if (wahl < 0) return; sichern(); items().splice(wahl, 1); wahl = -1; geaendert(); }
function geaendert() { renderLeiste(); renderSeite(); zeichneFlaeche(); }
function koord(e) {
  const s = flaeche.querySelector("svg"), r = s.getBoundingClientRect();
  return [Math.max(0, Math.min(640, (e.clientX - r.left) / r.width * 640)), Math.max(0, Math.min(400, (e.clientY - r.top) / r.height * 400))];
}
flaeche.addEventListener("pointerdown", e => {
  if (!P.G) return; e.preventDefault(); flaeche.setPointerCapture(e.pointerId);
  const [x, y] = koord(e), txt = ($("#lzTxt") || {}).value || "";
  if (werkzeug === "radierer") { const k = treffer(x, y); if (k >= 0) { sichern(); items().splice(k, 1); wahl = -1; geaendert(); } return; }
  if (werkzeug === "wahl") { wahl = treffer(x, y); if (wahl >= 0) { sichern(); zieh = [x, y]; } renderSeite(); zeichneFlaeche(); return; }
  if (werkzeug === "text") { if (!txt.trim()) { $("#lzTxt").focus(); $("#lzTxt").classList.add("fehlt"); return; } sichern(); items().push({ t: "text", x: Math.round(x), y: Math.round(y), txt: txt.slice(0, 60), f: farbe, w: breite }); $("#lzTxt").value = ""; geaendert(); return; }
  if (werkzeug === "zeichen") { sichern(); items().push({ t: "zeichen", z: zeichen, x: Math.round(x), y: Math.round(y), s: groesse, txt: txt.slice(0, 40) }); wahl = items().length - 1; werkzeug = "wahl"; geaendert(); return; }
  if (werkzeug === "stift") aktiv = { t: "pfad", pts: [[x, y]], f: farbe, w: breite };
  if (werkzeug === "linie" || werkzeug === "pfeil") aktiv = { t: werkzeug, x1: x, y1: y, x2: x, y2: y, f: farbe, w: breite };
  if (werkzeug === "kreis") aktiv = { t: "kreis", cx: x, cy: y, r: 0, f: farbe, w: breite };
  zeichneFlaeche();
});
flaeche.addEventListener("pointermove", e => {
  const [x, y] = koord(e);
  if (zieh && wahl >= 0) { verschiebe(items()[wahl], x - zieh[0], y - zieh[1]); zieh = [x, y]; zeichneFlaeche(); return; }
  if (!aktiv) return;
  if (aktiv.t === "pfad") { const l = aktiv.pts[aktiv.pts.length - 1]; if (Math.hypot(x - l[0], y - l[1]) > 1.2) aktiv.pts.push([x, y]); }
  else if (aktiv.t === "kreis") aktiv.r = Math.hypot(x - aktiv.cx, y - aktiv.cy);
  else { aktiv.x2 = x; aktiv.y2 = y; }
  zeichneFlaeche();
});
const loslassen = () => {
  if (zieh) { zieh = null; if (verlauf.length && verlauf[verlauf.length - 1] === JSON.stringify(items())) verlauf.pop(); renderLeiste(); return; }
  if (!aktiv) return;
  const a = aktiv; aktiv = null;
  if (a.t === "pfad") { a.pts = rdp(a.pts, 0.7).map(p => [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10]); if (a.pts.length < 2) a.pts.push([a.pts[0][0] + 0.5, a.pts[0][1] + 0.5]); }
  const zuKlein = (a.t === "linie" || a.t === "pfeil") ? Math.hypot(a.x2 - a.x1, a.y2 - a.y1) < 4 : a.t === "kreis" ? a.r < 3 : false;
  if (!zuKlein) { sichern(); ["x1", "y1", "x2", "y2", "cx", "cy", "r"].forEach(k => { if (a[k] != null) a[k] = Math.round(a[k] * 10) / 10; }); items().push(a); }
  geaendert();
};
flaeche.addEventListener("pointerup", loslassen); flaeche.addEventListener("pointercancel", loslassen);

$("#lzUndo").addEventListener("click", () => { if (!verlauf.length || !P.G) return; P.G.lk = JSON.parse(verlauf.pop()); wahl = -1; geaendert(); });
$("#lzLeeren").addEventListener("click", () => {
  if (!items().length) return;
  const b = $("#lzLeeren");
  if (b.dataset.sicher !== "1") { b.dataset.sicher = "1"; b.textContent = "Wirklich alles entfernen?"; setTimeout(() => { b.dataset.sicher = ""; b.textContent = "Alle Ergänzungen entfernen"; }, 3000); return; }
  sichern(); P.G.lk = []; wahl = -1; b.dataset.sicher = ""; b.textContent = "Alle Ergänzungen entfernen"; geaendert();
});
$("#lzSpeichern").addEventListener("click", async () => {
  if (!P.G) return;
  const text = '<?xml version="1.0" encoding="UTF-8"?>\n' + P.svgLage(P.G.sz, false).replace("<svg ", '<svg width="1280" height="800" ');
  const name = "lagekarte-" + P.G.sz.titel.toLowerCase().replace(/[äöüß]/g, c => ({ ä: "ae", ö: "oe", ü: "ue", ß: "ss" }[c])).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + ".svg";
  const blob = new Blob([text], { type: "image/svg+xml" });
  let dl = null; try { if (window.claude && window.claude.use) dl = await window.claude.use("downloads"); } catch (e) { dl = null; }
  if (dl) { try { await dl.save({ filename: name, data: blob }); return; } catch (e) { if (e && e.code !== "unavailable") { P.toast("Speichern nicht möglich"); return; } } }
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
});
function schliesse() { ov.hidden = true; aktiv = null; zieh = null; P.lageGeaendert(); }
$("#lzClose").addEventListener("click", schliesse);
document.addEventListener("keydown", e => {
  if (ov.hidden) return;
  if (e.key === "Escape") { e.stopImmediatePropagation(); schliesse(); return; }
  if ((e.key === "Delete" || e.key === "Backspace") && wahl >= 0 && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); loescheWahl(); }
  if ((e.ctrlKey || e.metaKey) && e.key === "z" && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); $("#lzUndo").click(); }
}, true);
document.addEventListener("click", e => { const b = e.target.closest("[data-lzopen]"); if (b) oeffne(); });

function oeffne() {
  if (!P.G) return;
  wahl = -1; aktiv = null; ov.hidden = false;
  $("#lzTitel").textContent = P.G.sz.titel;
  renderLeiste(); renderSeite(); zeichneFlaeche();
}
window.Lagezeichnen = { svg, oeffne };
})();
