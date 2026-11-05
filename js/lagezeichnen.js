/* Planbesprechung Musterstadt · Lagekarte ergänzen
   Der Prüfling ergänzt die übergebene Lagekarte durch handgezeichnete Elemente und taktische Zeichen.
   Die Ergänzungen liegen im Spielzustand (G.lk) und erscheinen in den Unterlagen und auf der Arbeitstafel.
   Bedienung: Jedes eigene Element ist direkt anklickbar. Ein Klick wählt es aus, daneben erscheinen
   »Löschen« und »Duplizieren«. Gezogen wird es verschoben. Der Radierer löscht alles, worüber er wischt. */
(function () {
"use strict";
const P = window.__pms;
const $ = s => document.querySelector(s);
const esc = t => String(t == null ? "" : t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const FARBEN = [["#d81b1b", "Rot"], ["#1d4ed8", "Blau"], ["#111111", "Schwarz"], ["#15803d", "Grün"], ["#ea7c00", "Orange"]];
const BREITEN = [[2, "dünn"], [3.5, "mittel"], [6, "dick"]];
const WERKZEUGE = [
  ["wahl", "↖", "Auswählen"], ["zeichen", "⚑", "Taktisches Zeichen"], ["stift", "✎", "Stift"], ["linie", "╱", "Linie"],
  ["pfeil", "➚", "Pfeil"], ["kreis", "○", "Kreis"], ["text", "T", "Text"], ["radierer", "⌫", "Radierer"]
];
const HILFE = {
  wahl: "Eigenes Element anklicken, um es auszuwählen. Ziehen verschiebt es. Neben dem gewählten Element stehen »Löschen« und »Duplizieren«.",
  zeichen: "Zeichen rechts wählen und in die Karte klicken oder direkt auf die Karte ziehen. Gesetzte Zeichen lassen sich anklicken und verschieben.",
  stift: "Mit gedrückter Maustaste oder dem Finger frei zeichnen.",
  linie: "Vom Anfang zum Ende ziehen.", pfeil: "Vom Anfang zur Spitze ziehen.", kreis: "Vom Mittelpunkt nach außen ziehen.",
  text: "In die Karte klicken, Text eingeben und mit Enter bestätigen.",
  radierer: "Über eigene Elemente klicken oder wischen, um sie zu löschen."
};
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
const NAMEN = { pfad: "Freihandlinie", linie: "Linie", pfeil: "Pfeil", kreis: "Kreis", text: "Text", zeichen: "Zeichen" };
const ov = $("#lzOv"), flaeche = $("#lzFlaeche"), seite = $("#lzSeite");
flaeche.innerHTML = `<div class="lz-buehne" id="lzBuehne"><div class="lz-svg" id="lzSvg"></div>
  <div class="lz-pop" id="lzPop" hidden><button type="button" data-pop="del" class="rot">Löschen</button><button type="button" data-pop="dup">Duplizieren</button><button type="button" data-pop="txt">Beschriften</button></div>
  <input class="lz-inline" id="lzInline" hidden maxlength="60" placeholder="Text eingeben, Enter"></div>`;
const buehne = $("#lzBuehne"), svgBox = $("#lzSvg"), pop = $("#lzPop"), inline = $("#lzInline");
let werkzeug = "wahl", farbe = FARBEN[0][0], breite = BREITEN[1][0], zeichen = "Feuerwehr_Einheiten/Löschzug", gruppe = "Feuerwehr", suche = "", groesse = 40;
let wahl = -1, aktiv = null, zieh = null, radiert = false, start = null, verlauf = [], inlineZiel = null;
const items = () => (P.G ? (P.G.lk = P.G.lk || []) : []);

/* ───────── Darstellung ───────── */
function kopf(x1, y1, x2, y2, f, w) {
  const a = Math.atan2(y2 - y1, x2 - x1), l = 8 + w * 2.2, b = 4 + w * 1.2;
  const p = [[x2, y2], [x2 - l * Math.cos(a) + b * Math.sin(a), y2 - l * Math.sin(a) - b * Math.cos(a)], [x2 - l * Math.cos(a) - b * Math.sin(a), y2 - l * Math.sin(a) + b * Math.cos(a)]];
  return `<polygon points="${p.map(q => q.map(v => v.toFixed(1)).join(",")).join(" ")}" fill="${f}"/>`;
}
function itemSvg(i) {
  const f = /^#[0-9a-f]{6}$/i.test(i.f) ? i.f : "#d81b1b", w = Number(i.w) || 3;
  if (i.t === "pfad") return `<polyline points="${i.pts.map(p => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ")}" fill="none" stroke="${f}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  if (i.t === "linie" || i.t === "pfeil") {
    const a = Math.atan2(i.y2 - i.y1, i.x2 - i.x1), l = i.t === "pfeil" ? 6 + w * 1.6 : 0;
    return `<line x1="${i.x1}" y1="${i.y1}" x2="${(i.x2 - l * Math.cos(a)).toFixed(1)}" y2="${(i.y2 - l * Math.sin(a)).toFixed(1)}" stroke="${f}" stroke-width="${w}" stroke-linecap="round"/>${i.t === "pfeil" ? kopf(i.x1, i.y1, i.x2, i.y2, f, w) : ""}`;
  }
  if (i.t === "kreis") return `<circle cx="${i.cx}" cy="${i.cy}" r="${Math.max(2, i.r).toFixed(1)}" fill="none" stroke="${f}" stroke-width="${w}"/>`;
  if (i.t === "text") return `<text x="${i.x}" y="${i.y}" font-size="${(10 + w * 1.6).toFixed(1)}" font-weight="700" fill="${f}" font-family="Arial,Helvetica,sans-serif">${esc(i.txt)}</text>`;
  if (i.t === "zeichen") { const s = i.s || 40; return `<g>${P.tz(i.z, { x: i.x - s / 2, y: i.y - s / 2, w: s, h: s })}${i.txt ? `<text x="${i.x}" y="${i.y + s / 2 + 9}" text-anchor="middle" font-size="9.5" font-weight="700" fill="#111" font-family="Arial,Helvetica,sans-serif">${esc(i.txt)}</text>` : ""}</g>`; }
  return "";
}
function svg(list) { return `<g class="lz-ergaenzung">${(list || []).map(itemSvg).join("")}</g>`; }
// Unsichtbare, breite Trefferfläche je Element, damit auch dünne Linien sicher getroffen werden
function trefferSvg(i) {
  const h = 'fill="none" stroke="transparent" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" pointer-events="stroke"';
  if (i.t === "pfad") return `<polyline points="${i.pts.map(p => p.join(",")).join(" ")}" ${h}/>`;
  if (i.t === "linie" || i.t === "pfeil") return `<line x1="${i.x1}" y1="${i.y1}" x2="${i.x2}" y2="${i.y2}" ${h}/>`;
  if (i.t === "kreis") return `<circle cx="${i.cx}" cy="${i.cy}" r="${Math.max(2, i.r)}" ${h}/>`;
  const b = box(i); return `<rect x="${b[0] - 4}" y="${b[1] - 4}" width="${b[2] - b[0] + 8}" height="${b[3] - b[1] + 8}" fill="transparent" pointer-events="all"/>`;
}
function box(i) {
  if (i.t === "pfad") { const xs = i.pts.map(p => p[0]), ys = i.pts.map(p => p[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; }
  if (i.t === "linie" || i.t === "pfeil") return [Math.min(i.x1, i.x2), Math.min(i.y1, i.y2), Math.max(i.x1, i.x2), Math.max(i.y1, i.y2)];
  if (i.t === "kreis") return [i.cx - i.r, i.cy - i.r, i.cx + i.r, i.cy + i.r];
  if (i.t === "text") { const fs = 10 + (i.w || 3) * 1.6; return [i.x, i.y - fs, i.x + Math.max(1, i.txt.length) * fs * 0.6, i.y + 3]; }
  if (i.t === "zeichen") { const s = i.s || 40; return [i.x - s / 2, i.y - s / 2, i.x + s / 2, i.y + s / 2 + (i.txt ? 12 : 0)]; }
  return [0, 0, 0, 0];
}
function verschiebe(i, dx, dy) {
  if (i.t === "pfad") i.pts = i.pts.map(p => [p[0] + dx, p[1] + dy]);
  else if (i.t === "linie" || i.t === "pfeil") { i.x1 += dx; i.y1 += dy; i.x2 += dx; i.y2 += dy; }
  else if (i.t === "kreis") { i.cx += dx; i.cy += dy; }
  else { i.x += dx; i.y += dy; }
}
function rund(i) { ["x", "y", "x1", "y1", "x2", "y2", "cx", "cy", "r"].forEach(k => { if (typeof i[k] === "number") i[k] = Math.round(i[k] * 10) / 10; }); if (i.pts) i.pts = i.pts.map(p => [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10]); return i; }
function abstandSeg(px, py, ax, ay, bx, by) { const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy; let t = l ? ((px - ax) * dx + (py - ay) * dy) / l : 0; t = Math.max(0, Math.min(1, t)); return Math.hypot(px - ax - t * dx, py - ay - t * dy); }
function rdp(pts, eps) {
  if (pts.length < 3) return pts;
  let dmax = 0, idx = 0; const a = pts[0], b = pts[pts.length - 1];
  for (let i = 1; i < pts.length - 1; i++) { const d = abstandSeg(pts[i][0], pts[i][1], a[0], a[1], b[0], b[1]); if (d > dmax) { dmax = d; idx = i; } }
  if (dmax > eps) { const l = rdp(pts.slice(0, idx + 1), eps), r = rdp(pts.slice(idx), eps); return l.slice(0, -1).concat(r); }
  return [a, b];
}

/* Grundkarte einmal zeichnen, eigene Ebenen getrennt aktualisieren (flüssiges Zeichnen) */
function grundkarte() {
  const basis = P.svgLage(P.G.sz, true, true), ende = basis.lastIndexOf("</svg>");
  svgBox.innerHTML = basis.slice(0, ende) + '<g id="lzEig"></g><g id="lzVor" pointer-events="none"></g><g id="lzMark" pointer-events="none"></g>' + basis.slice(ende);
}
function zeichneEigene() {
  const g = $("#lzEig"); if (!g) return;
  g.innerHTML = items().map((i, k) => `<g class="lz-el${k === wahl ? " gewaehlt" : ""}" data-i="${k}">${itemSvg(i)}${trefferSvg(i)}</g>`).join("");
  zeichneMarke();
}
function zeichneVorschau() { const g = $("#lzVor"); if (g) g.innerHTML = aktiv ? itemSvg(aktiv) : ""; }
function zeichneMarke() {
  const g = $("#lzMark"), i = items()[wahl];
  if (!g) return;
  if (!i) { g.innerHTML = ""; pop.hidden = true; return; }
  const b = box(i);
  g.innerHTML = `<rect x="${b[0] - 6}" y="${b[1] - 6}" width="${b[2] - b[0] + 12}" height="${b[3] - b[1] + 12}" rx="4" fill="rgba(241,166,43,.08)" stroke="#f1a62b" stroke-width="1.8" stroke-dasharray="6 4"/>`;
  // Kontextleiste oberhalb des gewählten Elements
  const r = svgBox.querySelector("svg").getBoundingClientRect(), rb = buehne.getBoundingClientRect(), sx = r.width / 640, sy = r.height / 400;
  pop.hidden = false;
  pop.querySelector('[data-pop="txt"]').hidden = !(i.t === "zeichen" || i.t === "text");
  const px = r.left - rb.left + (b[0] + b[2]) / 2 * sx, py = r.top - rb.top + (b[1] - 8) * sy;
  pop.style.left = Math.max(4, Math.min(rb.width - pop.offsetWidth - 4, px - pop.offsetWidth / 2)) + "px";
  pop.style.top = (py - pop.offsetHeight - 4 < 0 ? r.top - rb.top + (b[3] + 10) * sy : py - pop.offsetHeight - 4) + "px";
}
function alles() { zeichneEigene(); zeichneVorschau(); renderLeiste(); renderSeite(); }

/* ───────── Seitenleiste ───────── */
function zeichenListe() {
  const ordner = (GRUPPEN.find(g => g[0] === gruppe) || GRUPPEN[0])[1], q = suche.toLowerCase();
  return Object.keys(window.TZ).filter(k => q ? k.toLowerCase().replace(/_/g, " ").includes(q) : ordner.includes(k.split("/")[0])).slice(0, 200);
}
function renderSeite() {
  const sel = items()[wahl], istZ = werkzeug === "zeichen" || (sel && sel.t === "zeichen"), istStrich = !sel || sel.t !== "zeichen";
  let h = "";
  if (istZ) h += `<div class="lz-grp"><h5>Taktische Zeichen</h5><input id="lzSuche" type="search" placeholder="Suchen, z. B. Bereitstellungsraum" value="${esc(suche)}">
     ${suche ? "" : `<select id="lzGruppe">${GRUPPEN.map(g => `<option ${g[0] === gruppe ? "selected" : ""}>${esc(g[0])}</option>`).join("")}</select>`}
     <div class="lz-zeichen">${zeichenListe().map(k => `<button type="button" draggable="true" class="${k === (sel && sel.t === "zeichen" ? sel.z : zeichen) ? "on" : ""}" data-lzz="${esc(k)}" title="${esc(k.split("/")[1].replace(/_/g, " "))}">${P.tz(k)}</button>`).join("") || '<p class="note">Kein Zeichen gefunden.</p>'}</div>
     <h5 style="margin-top:10px">Größe</h5><input type="range" id="lzGr" min="20" max="90" step="2" value="${sel && sel.t === "zeichen" ? sel.s : groesse}"></div>`;
  if (istStrich && werkzeug !== "zeichen" && werkzeug !== "radierer") h += `<div class="lz-grp"><h5>Farbe</h5><div class="lz-farben">${FARBEN.map(([f, n]) => `<button type="button" class="${f === (sel ? sel.f : farbe) ? "on" : ""}" data-lzf="${f}" title="${n}" aria-label="${n}" style="--c:${f}"></button>`).join("")}</div></div>
     <div class="lz-grp"><h5>Strichstärke</h5><div class="lz-seg">${BREITEN.map(([w, n]) => `<button type="button" class="${w === (sel ? sel.w : breite) ? "on" : ""}" data-lzw="${w}">${n}</button>`).join("")}</div></div>`;
  h += `<div class="lz-grp"><h5>Ihre Ergänzungen <span class="rc">${items().length}</span></h5>${items().length ? `<div class="lz-liste">${items().map((i, k) => `<div class="lz-li ${k === wahl ? "on" : ""}"><button type="button" class="lz-lin" data-lzsel="${k}">${esc(NAMEN[i.t] + (i.t === "zeichen" ? ": " + i.z.split("/")[1].replace(/_/g, " ") : "") + (i.txt ? " · " + i.txt : ""))}</button><button type="button" class="lz-lix" data-lzdel="${k}" aria-label="Löschen" title="Löschen">✕</button></div>`).join("")}</div>` : '<p class="note">Noch keine Ergänzungen.</p>'}</div>
   <p class="note lz-hilfe"><b>${esc(WERKZEUGE.find(w => w[0] === werkzeug)[2])}:</b> ${HILFE[werkzeug]} Die übergebene Lagekarte selbst bleibt unverändert.</p>`;
  seite.innerHTML = h;
}
seite.addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  const sel = items()[wahl];
  if (b.dataset.lzf) { farbe = b.dataset.lzf; if (sel && sel.t !== "zeichen") { sichern(); sel.f = farbe; zeichneEigene(); } renderSeite(); }
  else if (b.dataset.lzw) { breite = +b.dataset.lzw; if (sel && sel.t !== "zeichen") { sichern(); sel.w = breite; zeichneEigene(); } renderSeite(); }
  else if (b.dataset.lzz) { zeichen = b.dataset.lzz; if (sel && sel.t === "zeichen") { sichern(); sel.z = zeichen; zeichneEigene(); } else setzeWerkzeug("zeichen"); renderSeite(); }
  else if (b.dataset.lzsel) { wahl = +b.dataset.lzsel; zeichneEigene(); renderSeite(); }
  else if (b.dataset.lzdel) { loesche(+b.dataset.lzdel); }
});
seite.addEventListener("input", e => {
  const sel = items()[wahl];
  if (e.target.id === "lzGr") { groesse = +e.target.value; if (sel && sel.t === "zeichen") { sel.s = groesse; zeichneEigene(); } }
  if (e.target.id === "lzSuche") { suche = e.target.value; const pos = e.target.selectionStart; renderSeite(); const n = $("#lzSuche"); n.focus(); n.setSelectionRange(pos, pos); }
});
seite.addEventListener("change", e => { if (e.target.id === "lzGruppe") { gruppe = e.target.value; renderSeite(); } if (e.target.id === "lzGr") sichern(); });
seite.addEventListener("dragstart", e => { const b = e.target.closest("[data-lzz]"); if (b) { e.dataTransfer.setData("text/plain", "lz:" + b.dataset.lzz); e.dataTransfer.effectAllowed = "copy"; } });

/* ───────── Werkzeugleiste ───────── */
function renderLeiste() {
  $("#lzWerkzeuge").innerHTML = WERKZEUGE.map(([k, ic, n]) => `<button type="button" class="${k === werkzeug ? "on" : ""}" data-lzt="${k}" title="${esc(n)}"><span class="ic">${ic}</span>${esc(n)}</button>`).join("");
  $("#lzUndo").disabled = !verlauf.length; $("#lzLeeren").disabled = !items().length;
  flaeche.dataset.werkzeug = werkzeug;
}
$("#lzWerkzeuge").addEventListener("click", e => { const b = e.target.closest("[data-lzt]"); if (b) setzeWerkzeug(b.dataset.lzt); });
function setzeWerkzeug(w) { werkzeug = w; if (w !== "wahl" && w !== "zeichen") wahl = -1; inlineAus(); zeichneEigene(); renderLeiste(); renderSeite(); }

/* ───────── Bearbeiten ───────── */
function sichern() { verlauf.push(JSON.stringify(items())); if (verlauf.length > 80) verlauf.shift(); $("#lzUndo").disabled = false; }
function loesche(k) { if (!items()[k]) return; sichern(); items().splice(k, 1); if (wahl === k) wahl = -1; else if (wahl > k) wahl--; alles(); }
function dupliziere(k) { const i = items()[k]; if (!i) return; sichern(); const c = JSON.parse(JSON.stringify(i)); verschiebe(c, 14, 14); items().push(c); wahl = items().length - 1; alles(); }
pop.addEventListener("pointerdown", e => e.stopPropagation());
pop.addEventListener("click", e => {
  const b = e.target.closest("[data-pop]"); if (!b || wahl < 0) return;
  if (b.dataset.pop === "del") loesche(wahl);
  if (b.dataset.pop === "dup") dupliziere(wahl);
  if (b.dataset.pop === "txt") { const i = items()[wahl], bx = box(i); inlineAn(i.t === "zeichen" ? i.x : bx[0], i.t === "zeichen" ? bx[3] + 4 : i.y, wahl, i.txt || ""); }
});

/* Texteingabe direkt in der Karte */
function inlineAn(x, y, ziel, wert) {
  const r = svgBox.querySelector("svg").getBoundingClientRect(), rb = buehne.getBoundingClientRect();
  inlineZiel = { x, y, k: ziel };
  inline.hidden = false; inline.value = wert || "";
  inline.style.left = Math.min(rb.width - 220, Math.max(0, r.left - rb.left + x / 640 * r.width)) + "px";
  inline.style.top = Math.max(0, r.top - rb.top + y / 400 * r.height - 30) + "px";
  inline.focus(); inline.select();
  setTimeout(() => { if (document.activeElement !== inline) { inline.focus(); } }, 0);
}
function inlineAus() { inline.hidden = true; inlineZiel = null; }
function inlineFertig() {
  if (!inlineZiel) return;
  const v = inline.value.trim(), z = inlineZiel; inlineAus();
  if (z.k != null && items()[z.k]) { sichern(); items()[z.k].txt = v; wahl = z.k; }
  else if (v) { sichern(); items().push({ t: "text", x: Math.round(z.x), y: Math.round(z.y), txt: v, f: farbe, w: breite }); wahl = items().length - 1; }
  alles();
}
inline.addEventListener("keydown", e => { e.stopPropagation(); if (e.key === "Enter") { e.preventDefault(); inlineFertig(); } if (e.key === "Escape") { e.preventDefault(); inlineAus(); } });
inline.addEventListener("blur", () => setTimeout(() => { if (!inline.hidden) inlineFertig(); }, 0));
inline.addEventListener("pointerdown", e => e.stopPropagation());

/* ───────── Zeigereingabe auf der Karte ───────── */
function koord(e) { const r = svgBox.querySelector("svg").getBoundingClientRect(); return [Math.max(0, Math.min(640, (e.clientX - r.left) / r.width * 640)), Math.max(0, Math.min(400, (e.clientY - r.top) / r.height * 400))]; }
function elementAn(e) { const el = (e.target.closest && e.target.closest(".lz-el")) || (document.elementFromPoint(e.clientX, e.clientY) || { closest: () => null }).closest(".lz-el"); return el ? +el.dataset.i : -1; }
svgBox.addEventListener("pointerdown", e => {
  if (!P.G || e.button > 0) return;
  if (!inline.hidden) { inlineFertig(); return; }
  e.preventDefault(); svgBox.setPointerCapture(e.pointerId);
  const [x, y] = koord(e), k = elementAn(e);
  start = { x, y, k, bewegt: false };
  if (werkzeug === "radierer") { radiert = false; if (k >= 0) { sichern(); radiert = true; items().splice(k, 1); wahl = -1; zeichneEigene(); } return; }
  if (werkzeug === "wahl" || werkzeug === "zeichen" || werkzeug === "text") {
    if (k >= 0) { wahl = k; sichern(); zieh = [x, y]; zeichneEigene(); renderSeite(); return; }
    if (werkzeug === "wahl") { wahl = -1; zeichneEigene(); renderSeite(); return; }
    if (werkzeug === "zeichen") { sichern(); items().push({ t: "zeichen", z: zeichen, x: Math.round(x), y: Math.round(y), s: groesse, txt: "" }); wahl = items().length - 1; alles(); return; }
    if (werkzeug === "text") { wahl = -1; zeichneEigene(); inlineAn(x, y, null, ""); return; }
  }
  if (werkzeug === "stift") aktiv = { t: "pfad", pts: [[x, y]], f: farbe, w: breite };
  if (werkzeug === "linie" || werkzeug === "pfeil") aktiv = { t: werkzeug, x1: x, y1: y, x2: x, y2: y, f: farbe, w: breite };
  if (werkzeug === "kreis") aktiv = { t: "kreis", cx: x, cy: y, r: 0, f: farbe, w: breite };
  wahl = -1; zeichneMarke(); zeichneVorschau();
});
svgBox.addEventListener("pointermove", e => {
  if (!start) return;
  const [x, y] = koord(e);
  if (Math.hypot(x - start.x, y - start.y) > 2) start.bewegt = true;
  if (werkzeug === "radierer") {
    const k = elementAn(e);
    if (k >= 0) { if (!radiert) { sichern(); radiert = true; } items().splice(k, 1); zeichneEigene(); }
    return;
  }
  if (zieh && wahl >= 0) { verschiebe(items()[wahl], x - zieh[0], y - zieh[1]); zieh = [x, y]; zeichneEigene(); return; }
  if (!aktiv) return;
  if (aktiv.t === "pfad") { const l = aktiv.pts[aktiv.pts.length - 1]; if (Math.hypot(x - l[0], y - l[1]) > 1.2) aktiv.pts.push([x, y]); }
  else if (aktiv.t === "kreis") aktiv.r = Math.hypot(x - aktiv.cx, y - aktiv.cy);
  else { aktiv.x2 = x; aktiv.y2 = y; }
  zeichneVorschau();
});
function loslassen() {
  const s = start; start = null;
  if (!s) return;
  if (werkzeug === "radierer") { if (radiert) alles(); radiert = false; return; }
  if (zieh) { zieh = null; if (!s.bewegt) verlauf.pop(); else rund(items()[wahl]); alles(); return; }
  if (!aktiv) return;
  const a = aktiv; aktiv = null; zeichneVorschau();
  // Kurzer Klick mit einem Zeichenwerkzeug auf ein eigenes Element wählt dieses aus
  if (!s.bewegt && s.k >= 0) { wahl = s.k; alles(); return; }
  if (a.t === "pfad") { a.pts = rdp(a.pts, 0.7); if (a.pts.length < 2) a.pts.push([a.pts[0][0] + 0.6, a.pts[0][1] + 0.6]); }
  const zuKlein = (a.t === "linie" || a.t === "pfeil") ? Math.hypot(a.x2 - a.x1, a.y2 - a.y1) < 4 : a.t === "kreis" ? a.r < 3 : false;
  if (!zuKlein) { sichern(); items().push(rund(a)); }
  alles();
}
svgBox.addEventListener("pointerup", loslassen); svgBox.addEventListener("pointercancel", loslassen);
svgBox.addEventListener("dblclick", e => { const k = elementAn(e), i = items()[k]; if (i && (i.t === "text" || i.t === "zeichen")) { wahl = k; zeichneEigene(); const b = box(i); inlineAn(i.t === "zeichen" ? i.x : b[0], i.t === "zeichen" ? b[3] + 4 : i.y, k, i.txt || ""); } });
svgBox.addEventListener("contextmenu", e => { const k = elementAn(e); if (k >= 0) { e.preventDefault(); loesche(k); } });
svgBox.addEventListener("dragover", e => { if ([...e.dataTransfer.types].includes("text/plain")) { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; } });
svgBox.addEventListener("drop", e => {
  const d = e.dataTransfer.getData("text/plain"); if (!/^lz:/.test(d)) return; e.preventDefault();
  const [x, y] = koord(e); zeichen = d.slice(3); sichern();
  items().push({ t: "zeichen", z: zeichen, x: Math.round(x), y: Math.round(y), s: groesse, txt: "" }); wahl = items().length - 1;
  if (werkzeug !== "zeichen") werkzeug = "zeichen"; alles();
});

/* ───────── Kopfleiste ───────── */
$("#lzUndo").addEventListener("click", () => { if (!verlauf.length || !P.G) return; P.G.lk = JSON.parse(verlauf.pop()); wahl = -1; alles(); });
$("#lzLeeren").addEventListener("click", () => {
  if (!items().length) return;
  const b = $("#lzLeeren");
  if (b.dataset.sicher !== "1") { b.dataset.sicher = "1"; b.textContent = "Wirklich alle entfernen?"; setTimeout(() => { b.dataset.sicher = ""; b.textContent = "Alle Ergänzungen entfernen"; }, 3000); return; }
  sichern(); P.G.lk = []; wahl = -1; b.dataset.sicher = ""; b.textContent = "Alle Ergänzungen entfernen"; alles();
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
function schliesse() { inlineFertig(); ov.hidden = true; aktiv = null; zieh = null; start = null; P.lageGeaendert(); }
$("#lzClose").addEventListener("click", schliesse);
document.addEventListener("keydown", e => {
  if (ov.hidden) return;
  const tipp = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
  if (e.key === "Escape") { e.stopImmediatePropagation(); if (wahl >= 0) { wahl = -1; alles(); } else schliesse(); return; }
  if (tipp) return;
  if ((e.key === "Delete" || e.key === "Backspace") && wahl >= 0) { e.preventDefault(); loesche(wahl); }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); $("#lzUndo").click(); }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d" && wahl >= 0) { e.preventDefault(); dupliziere(wahl); }
}, true);
window.addEventListener("resize", () => { if (!ov.hidden) zeichneMarke(); });
document.addEventListener("click", e => { if (e.target.closest("[data-lzopen]")) oeffne(); });

function oeffne() {
  if (!P.G) return;
  wahl = -1; aktiv = null; zieh = null; start = null; inlineAus(); ov.hidden = false;
  $("#lzTitel").textContent = P.G.sz.titel;
  grundkarte(); alles();
}
window.Lagezeichnen = { svg, oeffne };
})();
