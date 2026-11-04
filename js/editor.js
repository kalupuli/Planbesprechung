/* Planbesprechung Musterstadt · Lagen-Editor
   Eigene Lagen anlegen, bearbeiten, exportieren und importieren.
   Speicherung: im Claude-Viewer privat je Person (db, data/users/<id>/), sonst im Browser (localStorage).
   Austauschformat: JSON { format: "planbesprechung-musterstadt/lagen", version: 1, lagen: [ … ] } */
(function () {
"use strict";
const P = window.__pms, MS = window.MS, SZ = window.SZENARIEN;
const $ = s => document.querySelector(s);
const esc = t => String(t == null ? "" : t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const FORMAT = "planbesprechung-musterstadt/lagen";
const LS = "pms_eigene_lagen";
const WTAG = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
const MZ = ["Atemgifte", "Angstreaktion", "Ausbreitung", "Atomare Strahlung", "Chemische Stoffe", "Erkrankung/Verletzung", "Explosion", "Einsturz", "Elektrizität"];
const MSG = ["Menschen", "Tiere", "Umwelt", "Sachwerte", "Mannschaft", "Gerät"];

/* ───────── Normalisierung: jede Lage aus Editor, Import oder Speicher läuft hier durch ───────── */
const str = (v, max) => String(v == null ? "" : v).slice(0, max || 4000);
const num = (v, d, min, max) => { let n = Number(v); if (!isFinite(n)) n = d; if (min != null) n = Math.max(min, n); if (max != null) n = Math.min(max, n); return n; };
const arr = v => Array.isArray(v) ? v : [];
const pkt = v => num(v, 1, 0, 10);
const krit = v => arr(v).map(k => Array.isArray(k) ? [str(k[0], 400), pkt(k[1])] : [str(k && k.text, 400), pkt(k && k.punkte)]).filter(k => k[0].trim());
const STD = {
  orga: { titel: "Führungsorganisation und Abschnittsbildung", frage: "Skizzieren Sie die Führungsorganisation mit Abschnitten, Abschnittsleitern und Rufgruppen." },
  massnahmen: { titel: "Weitere Maßnahmen", frage: "Legen Sie die weiteren Maßnahmen und Einsatzschwerpunkte in der Reihenfolge fest." },
  lage: { titel: "Lagemeldung", frage: "Formulieren Sie Ihre Lagemeldung an die Leitstelle." },
  nachf: { titel: "Nachalarmierung", frage: "Alarmieren Sie über Karte, Leiste und Stichworte alle erforderlichen Kräfte nach und informieren Sie die erforderlichen Stellen." },
  gefahren: { titel: "Gefahren", frage: "Die Kommission fragt: Welche Gefahren sehen Sie an dieser Einsatzstelle und für wen?" },
  begruendung: { titel: "Begründung", frage: "Die Kommission fragt: Begründen Sie Ihre Abschnittsbildung und die räumliche Lage der Abschnitte." },
  befehl: { titel: "Befehl", frage: "Die Kommission fordert: Erteilen Sie dem Abschnittsleiter … Ihren Befehl." },
  lageaenderung: { titel: "Lageänderung", frage: "Lageänderung: …" },
  presse: { titel: "O-Ton Pressekonferenz", frage: "Geben Sie einen O-Ton von etwa 60 Sekunden ab." }
};
const LK_TYPEN = {
  fz: "Fahrzeug", el: "Einsatzleitung", brand: "Brand", personen: "Personen / Sammelstelle", ablage: "Patientenablage", offen: "Offener Punkt (?)",
  tz: "Taktisches Zeichen", warn: "Warntafel", wind: "Windrichtung", gebaeude: "Gebäude", zone: "Bereich (Kreis)", hydrant: "Hydrant",
  ausgang: "Ausgang", rauch: "Rauch", wolke: "Gaswolke", text: "Text", strasse: "Straße", linie: "Linie", schlauch: "Schlauchleitung", pfeil: "Pfeil", wasserschleier: "Wasserschleier"
};
const ZWEI = new Set(["strasse", "linie", "schlauch", "pfeil", "wasserschleier"]);
function lkItem(i) {
  if (!i || typeof i !== "object") return null;
  const n = (v, d) => num(v, d, -200, 840), t = str(i.txt, 120);
  switch (i.t) {
    case "fz": return { t: "fz", x: n(i.x, 320), y: n(i.y, 200), txt: t, org: ["fw", "rd", "pol", "zivil"].includes(i.org) ? i.org : "fw", w: i.w != null ? num(i.w, 46, 10, 300) : undefined, h: i.h != null ? num(i.h, 22, 8, 200) : undefined, vertikal: !!i.vertikal };
    case "el": case "brand": case "personen": case "ablage": case "offen": case "ausgang": case "text": return { t: i.t, x: n(i.x, 320), y: n(i.y, 200), txt: t };
    case "hydrant": case "rauch": case "wolke": return { t: i.t, x: n(i.x, 320), y: n(i.y, 200) };
    case "tz": return window.TZ && window.TZ[i.z] ? { t: "tz", z: i.z, x: n(i.x, 320), y: n(i.y, 200), s: num(i.s, 36, 12, 120), txt: t } : null;
    case "warn": return { t: "warn", x: n(i.x, 320), y: n(i.y, 200), oben: str(i.oben, 6), unten: str(i.unten, 6) };
    case "wind": return { t: "wind", x: n(i.x, 560), y: n(i.y, 60), dir: num(i.dir, 45, -360, 360), txt: t };
    case "gebaeude": return { t: "gebaeude", x: n(i.x, 200), y: n(i.y, 120), w: num(i.w, 160, 10, 640), h: num(i.h, 80, 10, 400), txt: t };
    case "zone": return { t: "zone", kind: i.kind === "absperr" ? "absperr" : "gefahr", cx: n(i.cx, 320), cy: n(i.cy, 200), r: num(i.r, 60, 5, 400), txt: t };
    case "flaeche": { const pts = arr(i.pts).slice(0, 40).map(p => [n(p && p[0], 0), n(p && p[1], 0)]); return pts.length >= 3 ? { t: "flaeche", pts, f: i.f === "strasse" ? "strasse" : "flaeche", txt: t } : null; }
    case "linie": { const pts = arr(i.pts).slice(0, 40).map(p => [n(p && p[0], 0), n(p && p[1], 0)]); return pts.length >= 2 ? { t: "linie", pts, s: ["mittel", "wasser", "brandwand", "gleis"].includes(i.s) ? i.s : "mittel", txt: t } : null; }
    case "schlauch": { const pts = arr(i.pts).slice(0, 40).map(p => [n(p && p[0], 0), n(p && p[1], 0)]); return pts.length >= 2 ? { t: "schlauch", pts } : null; }
    case "pfeil": case "wasserschleier": return { t: i.t, x1: n(i.x1, 100), y1: n(i.y1, 100), x2: n(i.x2, 200), y2: n(i.y2, 100), txt: t };
  }
  return null;
}
function aufgabe(id, typ, a) {
  a = a && typeof a === "object" ? a : {};
  const o = { id, typ, titel: str(a.titel || STD[id].titel, 120), frage: str(a.frage || STD[id].frage, 1200) };
  if (a.hinweis) o.hinweis = str(a.hinweis, 1500);
  if (typ === "text") o.kriterien = krit(a.kriterien);
  if (typ === "abschnitte") { o.soll = arr(a.soll).map(s => str(s, 80)).filter(Boolean); o.kann = arr(a.kann).map(s => str(s, 80)).filter(Boolean); }
  if (typ === "matrix") { const ok = new Set(MZ.flatMap(z => MSG.map(s => z + ":" + s))); o.soll = arr(a.soll).filter(k => ok.has(k)); }
  if (typ === "nachforderung") o.soll = arr(a.soll).map(r => {
    if (!r || typeof r !== "object") return null;
    const b = { pts: pkt(r.pts), label: str(r.label, 120), warum: str(r.warum, 400) };
    if (r.t === "lz") return Object.assign({ t: "lz", min: num(r.min, 1, 0.5, 20) }, b);
    if (r.t === "typ") return Object.assign({ t: "typ", typ: str(r.typ, 40), min: num(r.min, 1, 1, 20) }, b);
    const any = arr(r.any).map(k => str(k, 40)).filter(k => /^[A-Za-z0-9_-]+$/.test(k));
    return any.length ? Object.assign({ t: "key", any }, b) : null;
  }).filter(r => r && r.label);
  return o;
}
function finde(list, id) { return arr(list).find(a => a && a.id === id); }
function norm(l, eigenId) {
  l = l && typeof l === "object" ? l : {};
  const datum = /^\d{4}-\d{2}-\d{2}$/.test(l.datum) ? l.datum : new Date().toISOString().slice(0, 10);
  const wt = WTAG[new Date(datum + "T12:00:00").getDay()] || "";
  const id = eigenId || (/^eigen-[a-z0-9-]{1,40}$/.test(l.id) ? l.id : neueId());
  const o = {
    id, eigen: true, beispiel: false, geaendert: str(l.geaendert || new Date().toISOString(), 40),
    titel: str(l.titel, 120) || "Neue Lage", typ: P.TYPEN[l.typ] ? l.typ : "brand",
    x: num(l.x, 50, 0, 100), y: num(l.y, 50, 0, 100),
    ort: { adresse: str(l.ort && l.ort.adresse, 200), detail: str(l.ort && l.ort.detail, 200), wb: str(l.ort && l.ort.wb, 200) },
    zeit: wt, datum, t0: /^\d{2}:\d{2}$/.test(l.t0) ? l.t0 : "12:00", meldender: str(l.meldender, 200), wetter: str(l.wetter, 200), stichwort: str(l.stichwort, 120),
    meldung: str(l.meldung, 3000),
    alarmiert: arr(l.alarmiert).map(k => str(k, 40)).filter(k => P.ANF[k] && P.ANF[k].art !== "c"),
    cAlarm: num(l.cAlarm, 5, 0, 240),
    uebergabe: { von: str(l.uebergabe && l.uebergabe.von, 200), text: arr(l.uebergabe && l.uebergabe.text).map(p => str(p, 3000)).filter(p => p.trim()) },
    info: arr(l.info).map(b => ({ titel: str(b && b.titel, 80), zeilen: arr(b && b.zeilen).map(z => [str(z && z[0], 120), str(z && z[1], 600)]).filter(z => z[0] || z[1]) })).filter(b => b.titel || b.zeilen.length),
    lagekarte: arr(l.lagekarte).slice(0, 200).map(lkItem).filter(Boolean),
    nachfragen: arr(l.nachfragen).map(n => ({ f: str(n && n.f, 300), a: str(n && n.a, 1500), wichtig: !!(n && n.wichtig) })).filter(n => n.f.trim()),
    ausarbeitung: [aufgabe("orga", "abschnitte", finde(l.ausarbeitung, "orga")), aufgabe("massnahmen", "text", finde(l.ausarbeitung, "massnahmen")), aufgabe("lage", "text", finde(l.ausarbeitung, "lage")), aufgabe("nachf", "nachforderung", finde(l.ausarbeitung, "nachf"))],
    kommission: [aufgabe("gefahren", "matrix", finde(l.kommission, "gefahren")), aufgabe("begruendung", "text", finde(l.kommission, "begruendung")), aufgabe("befehl", "text", finde(l.kommission, "befehl")), aufgabe("lageaenderung", "text", finde(l.kommission, "lageaenderung"))]
  };
  const pr = aufgabe("presse", "text", l.presse); pr.anlass = str(l.presse && l.presse.anlass, 600); pr.sekunden = num(l.presse && l.presse.sekunden, 60, 20, 300);
  o.presse = pr;
  return o;
}
function neueId() { return "eigen-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6); }
function pruefen(l) {
  const w = [];
  if (!l.ort.adresse) w.push("Einsatzort ohne Adresse");
  if (!l.meldung) w.push("keine Initialmeldung der Leitstelle");
  if (!l.alarmiert.length) w.push("keine alarmierten Einheiten");
  if (!l.uebergabe.text.length) w.push("keine Übergabe");
  if (!l.ausarbeitung[0].soll.length) w.push("keine erwarteten Einsatzabschnitte");
  if (!l.kommission[0].soll.length) w.push("keine erwarteten Gefahren in der Matrix");
  ["massnahmen", "lage"].forEach(id => { if (!finde(l.ausarbeitung, id).kriterien.length) w.push("keine Kriterien für " + finde(l.ausarbeitung, id).titel); });
  return w;
}

/* ───────── Speicher ───────── */
const Speicher = {
  db: null, uid: null, bereit: false,
  lokal() { try { const v = JSON.parse(localStorage.getItem(LS) || "[]"); return Array.isArray(v) ? v : []; } catch (e) { return []; } },
  lokalSetzen(list) { try { localStorage.setItem(LS, JSON.stringify(list)); } catch (e) {} },
  async init() {
    try {
      if (window.claude && window.claude.use) {
        const [db, user] = await Promise.all([window.claude.use("db"), window.claude.use("user")]);
        const uid = user ? await user.id() : null;
        if (db && uid) { this.db = db; this.uid = uid; }
      }
    } catch (e) { this.db = null; }
    this.bereit = true;
  },
  col() { return this.db.collection("data/users/" + this.uid); },
  async alle() {
    const lok = this.lokal().map(l => norm(l, l.id));
    if (!this.db) return lok;
    try {
      const q = await this.col().get();
      const map = {}; lok.forEach(l => { map[l.id] = l; });
      q.docs.forEach(d => { if (!/^lage-/.test(d.id)) return; const b = d.data(); if (!b || !b.json) return; try { const l = norm(JSON.parse(b.json), d.id.slice(5)); if (!map[l.id] || map[l.id].geaendert <= l.geaendert) map[l.id] = l; } catch (e) {} });
      const list = Object.values(map); this.lokalSetzen(list); return list;
    } catch (e) { return lok; }
  },
  async speichern(l) {
    const list = this.lokal().filter(x => x.id !== l.id); list.push(l); this.lokalSetzen(list);
    if (this.db) { try { await this.col().doc("lage-" + l.id).set({ json: JSON.stringify(l), titel: l.titel, geaendert: l.geaendert }); } catch (e) { return e && e.code === "quota_exceeded" ? "Speicher voll" : "nur im Browser gespeichert"; } }
    return null;
  },
  async loeschen(id) {
    this.lokalSetzen(this.lokal().filter(x => x.id !== id));
    if (this.db) { try { await this.col().doc("lage-" + id).delete(); } catch (e) {} }
  }
};
function einsetzen(l) {
  const i = SZ.findIndex(s => s.id === l.id);
  if (i >= 0) SZ[i] = l; else SZ.push(l);
}
async function ladeEigene() {
  await Speicher.init();
  const list = await Speicher.alle();
  list.forEach(einsetzen);
  if (list.length) P.szAktualisieren();
}

/* ───────── Export und Import ───────── */
function dateiname(t) { return (t || "lagen").toLowerCase().replace(/[äöüß]/g, c => ({ ä: "ae", ö: "oe", ü: "ue", ß: "ss" }[c])).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "lage"; }
function exportDaten(lagen) {
  const raus = lagen.map(l => { const c = JSON.parse(JSON.stringify(l)); delete c.eigen; delete c.beispiel; return c; });
  return JSON.stringify({ format: FORMAT, version: 1, erstellt: new Date().toISOString(), lagen: raus }, null, 2);
}
async function speichereDatei(name, text) {
  const blob = new Blob([text], { type: "application/json" });
  let dl = null;
  try { if (window.claude && window.claude.use) dl = await window.claude.use("downloads"); } catch (e) { dl = null; }
  if (dl) { try { await dl.save({ filename: name, data: blob }); return; } catch (e) { if (e && e.code !== "unavailable") { P.toast("Export nicht möglich: " + (e.message || e.code)); return; } } }
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
function exportiere(ids) {
  const lagen = ids.map(id => SZ.find(s => s.id === id)).filter(Boolean);
  if (!lagen.length) { P.toast("Keine eigenen Lagen vorhanden"); return; }
  speichereDatei((lagen.length === 1 ? "lage-" + dateiname(lagen[0].titel) : "planbesprechung-musterstadt-lagen") + ".json", exportDaten(lagen));
}
function importText(text) {
  let d; try { d = JSON.parse(text); } catch (e) { throw new Error("Die Datei ist kein gültiges JSON."); }
  let roh = Array.isArray(d) ? d : d && Array.isArray(d.lagen) ? d.lagen : d && d.titel ? [d] : null;
  if (!roh || !roh.length) throw new Error("In der Datei wurde keine Lage gefunden.");
  return roh.slice(0, 100).map(l => {
    const vorhanden = SZ.find(s => s.id === l.id);
    const id = vorhanden && vorhanden.eigen ? l.id : (/^eigen-/.test(l && l.id) && !vorhanden ? l.id : neueId());
    return norm(Object.assign({}, l, { geaendert: new Date().toISOString() }), id);
  });
}
async function importiereDatei(file) {
  if (!file) return;
  if (file.size > 3e6) { P.toast("Die Datei ist zu groß"); return; }
  try {
    const lagen = importText(await file.text());
    for (const l of lagen) { einsetzen(l); await Speicher.speichern(l); }
    P.szAktualisieren();
    P.toast(lagen.length === 1 ? "Lage importiert: " + lagen[0].titel : lagen.length + " Lagen importiert");
  } catch (e) { P.toast(e.message || "Import fehlgeschlagen"); }
}
function importDialog() {
  const inp = document.createElement("input"); inp.type = "file"; inp.accept = ".json,application/json";
  inp.addEventListener("change", () => importiereDatei(inp.files[0]));
  inp.click();
}

/* ───────── Editor ───────── */
const ov = $("#edOv"), nav = $("#edNav"), body = $("#edBody");
let D = null, abschnitt = "grund", lkWahl = null, lkNeu = null, lkStart = null, unsaved = false;
const ABSCHNITTE = [
  ["grund", "Grunddaten und Einsatzort"], ["alarm", "Alarmierung"], ["uebergabe", "Übergabe und Unterlagen"], ["karte", "Lagekarte"],
  ["fragen", "Nachfragen"], ["ausarb", "Ausarbeitung"], ["komm", "Kommission"], ["presse", "Pressekonferenz"], ["json", "JSON"]
];
function oeffne(l) {
  D = JSON.parse(JSON.stringify(l)); abschnitt = "grund"; lkWahl = null; lkNeu = null; lkStart = null; unsaved = false;
  ov.hidden = false; render();
}
function neu() {
  const heute = new Date(); heute.setDate(heute.getDate() + 3);
  oeffne(norm({ titel: "Neue Lage", datum: heute.toISOString().slice(0, 10), t0: "14:30", x: 50, y: 50, cAlarm: 6, presse: { sekunden: 60 },
    uebergabe: { von: "B-Dienst 1, Zugführer Löschzug 1", text: [] } }));
  $("#edTitel").textContent = "Neue Lage";
}
function vorlage(id) {
  const s = SZ.find(x => x.id === id); if (!s) return;
  const l = norm(Object.assign(JSON.parse(JSON.stringify(s)), { titel: s.titel + " (Kopie)" }), neueId());
  oeffne(l);
}
function bearbeiten(id) { const s = SZ.find(x => x.id === id); if (s && s.eigen) oeffne(norm(s, s.id)); }
async function loeschen(id) {
  const s = SZ.find(x => x.id === id); if (!s || !s.eigen) return;
  const i = SZ.findIndex(x => x.id === id); if (i >= 0) SZ.splice(i, 1);
  await Speicher.loeschen(id); P.szAktualisieren(); P.toast("Lage gelöscht: " + s.titel);
}
async function speichern(still) {
  D.geaendert = new Date().toISOString();
  const l = norm(D, D.id); D = l;
  einsetzen(l); const fehler = await Speicher.speichern(l); P.szAktualisieren(); unsaved = false;
  if (!still) P.toast(fehler ? "Gespeichert (" + fehler + ")" : "Lage gespeichert");
  renderKopf();
  return l;
}
function schliesse() {
  if (unsaved && !body.querySelector("#edVerwerfen")) {
    $("#edHinweis").innerHTML = 'Ungespeicherte Änderungen. <button type="button" class="link" id="edVerwerfen">Verwerfen und schließen</button>';
    $("#edVerwerfen").addEventListener("click", () => { unsaved = false; ov.hidden = true; });
    return;
  }
  ov.hidden = true;
}

/* Pfadzugriff für Formularfelder: data-p="ort.adresse", "info.0.titel" */
function hole(p) { return p.split(".").reduce((o, k) => o == null ? o : o[k], D); }
function setze(p, v) { const k = p.split("."); let o = D; for (let i = 0; i < k.length - 1; i++) o = o[k[i]]; o[k[k.length - 1]] = v; unsaved = true; }
const feld = (p, label, o) => { o = o || {}; const v = hole(p); return `<label class="ed-f ${o.cls || ""}"><span>${esc(label)}</span>${o.area ? `<textarea data-p="${p}" rows="${o.rows || 3}" placeholder="${esc(o.ph || "")}">${esc(v)}</textarea>` : `<input data-p="${p}" type="${o.type || "text"}" value="${esc(v)}" placeholder="${esc(o.ph || "")}"${o.step ? ` step="${o.step}"` : ""}${o.min != null ? ` min="${o.min}"` : ""}>`}${o.hint ? `<small>${esc(o.hint)}</small>` : ""}</label>`; };
const kritText = k => k.map(c => c[0] + (c[1] !== 1 ? " | " + c[1] : "")).join("\n");
const kritFeld = (p, label) => `<label class="ed-f"><span>${esc(label)}</span><textarea data-k="${p}" rows="6" placeholder="Ein Kriterium je Zeile, Punkte mit | anhängen, z. B. Menschenrettung hat Vorrang | 2">${esc(kritText(hole(p)))}</textarea><small>Ein Kriterium je Zeile. Ohne Angabe zählt ein Kriterium 1 Punkt.</small></label>`;

function renderKopf() {
  $("#edTitel").textContent = D.titel || "Lage";
  const w = pruefen(norm(D, D.id));
  $("#edHinweis").innerHTML = w.length ? `<span class="ed-warn">Noch offen: ${esc(w.join(", "))}</span>` : '<span class="ed-ok">Lage vollständig</span>';
  nav.innerHTML = ABSCHNITTE.map(([k, t]) => `<button type="button" class="${k === abschnitt ? "on" : ""}" data-eda="${k}">${esc(t)}</button>`).join("");
}
function render() { renderKopf(); body.innerHTML = abschnittHTML(); binden(); body.scrollTop = 0; }

function einheitenChips(sel, attr) {
  const set = new Set(sel);
  return P.railGruppen().filter(g => g.id !== "ext").map(g => `<div class="nch-g"><h5>${esc(g.titel)}</h5><div class="nch">${g.rows.map(r => {
    const d = r.d, on = set.has(d.id);
    return `<button type="button" class="nchip ${on ? "on" : ""}" ${attr}="${d.id}" title="${esc(d.name)}"><span class="nchip-z">${P.tzDef(d)}</span><span class="nchip-n">${esc(P.kurz(d).replace(" komplett", ""))}${on ? "<em>alarmiert</em>" : r.ort && r.ort !== P.kurz(d) ? `<small>${esc(r.ort)}</small>` : ""}</span></button>`;
  }).join("")}</div></div>`).join("");
}
function alleSchluessel() {
  const o = [];
  P.railGruppen().forEach(g => g.rows.forEach(r => o.push([r.d.id, r.d.name.replace(" komplett", "") + (r.ort && g.id !== "ext" ? " · " + r.ort : "")])));
  const extra = new Set(); Object.values(P.ANF).forEach(d => (d.keys || []).forEach(k => extra.add(k)));
  extra.forEach(k => { if (!P.ANF[k]) o.push([k, "Schlüssel " + k]); });
  return o;
}
function alleTypen() { const t = new Set(); Object.values(P.ANF).forEach(d => (d.typen || []).forEach(x => t.add(x))); return [...t].sort(); }

function abschnittHTML() {
  const A = k => finde(D.ausarbeitung, k), K = k => finde(D.kommission, k);
  if (abschnitt === "grund") return `<h3>Grunddaten</h3><div class="ed-grid">
    ${feld("titel", "Titel")}
    <label class="ed-f"><span>Art</span><select data-p="typ">${Object.entries(P.TYPEN).map(([k, v]) => `<option value="${k}" ${D.typ === k ? "selected" : ""}>${esc(v)}</option>`).join("")}</select></label>
    ${feld("stichwort", "Einsatzstichwort", { ph: "z. B. F 3 Y · MANV 10" })}
    ${feld("datum", "Datum", { type: "date", hint: "Der Wochentag wird aus dem Datum bestimmt." })}
    ${feld("t0", "Alarmzeit", { type: "time" })}
    ${feld("cAlarm", "Alarmierung C-Dienst (Minuten nach Alarm)", { type: "number", min: 0 })}
    ${feld("meldender", "Meldender")}
    ${feld("wetter", "Wetter", { ph: "z. B. 14 °C, bedeckt, Wind aus Südwest mit 3 m/s" })}
   </div>
   <h3>Einsatzort in Musterstadt</h3><div class="ed-grid">
    ${feld("ort.adresse", "Adresse oder Objekt")}
    ${feld("ort.detail", "Lage im Stadtgebiet", { ph: "z. B. Innenstadtrand Ost" })}
    ${feld("ort.wb", "Wachbezirk und Ausrückebereich", { ph: "z. B. Wachbezirk 2, Ausrückebereich LZ 24" })}
   </div>
   <p class="hint">Einsatzort auf der Karte antippen. Position: <b id="edPos">${D.x.toFixed(1)} / ${D.y.toFixed(1)}</b></p>
   <div class="ed-karte" id="edKarte"><img src="${$("#maptex").src}" alt="Karte Musterstadt" draggable="false"><span class="ed-pin" style="left:${D.x}%;top:${D.y}%"></span>${P.wachenPunkte().map(w => `<span class="ed-w ${w.art}" style="left:${w.x}%;top:${w.y}%" title="${esc(w.name)}">${esc(w.k)}</span>`).join("")}</div>`;
  if (abschnitt === "alarm") return `<h3>Initialmeldung der Leitstelle</h3>
   ${feld("meldung", "Meldung an den C-Dienst", { area: true, rows: 6, ph: "Leitstelle Musterstadt für C-Dienst. Einsatz … Alarmiert sind … Sie werden zur Übernahme der Einsatzleitung angefordert." })}
   <div class="actions"><button type="button" class="mini sec" id="edMeldung">Vorschlag aus den Grunddaten erzeugen</button></div>
   <h3>Alarmierte Einheiten (Lage bei Übergabe)</h3><p class="hint">Einheiten mit Eintreffzeit bis zur Übergabe stehen vor Ort, die übrigen sind auf Anfahrt. Die Eintreffzeit ergibt sich aus der Entfernung zur Einsatzstelle.</p>
   <div class="stich">${Object.keys(MS.manv).map(k => `<button type="button" class="${D.alarmiert.includes(k) ? "on" : ""}" data-alm="${k}">${esc(MS.manv[k].name)}</button>`).join("")}</div>
   <div class="nchips">${einheitenChips(D.alarmiert, "data-alm")}</div>`;
  if (abschnitt === "uebergabe") return `<h3>Übergabe durch den Zugführer</h3><div class="ed-grid">${feld("uebergabe.von", "Übergabe durch", { ph: "z. B. B-Dienst 1, Zugführer Löschzug 1" })}</div>
   <label class="ed-f"><span>Übergabetext</span><textarea data-abs="uebergabe.text" rows="12" placeholder="Absätze durch Leerzeile trennen">${esc(D.uebergabe.text.join("\n\n"))}</textarea><small>Absätze durch eine Leerzeile trennen. Offene Punkte für die Erkundung bewusst offen lassen.</small></label>
   <h3>Unterlagen</h3><p class="hint">z. B. Gefahrstoff, Objekt, Besondere Gefahr. Bei Titel »Gefahrstoff« wird eine Warntafel der Lagekarte mit angezeigt.</p>
   ${D.info.map((b, i) => `<div class="ed-card"><div class="ed-grid">${feld("info." + i + ".titel", "Titel")}</div>
     <label class="ed-f"><span>Angaben</span><textarea data-zeilen="${i}" rows="5" placeholder="Begriff: Angabe">${esc(b.zeilen.map(z => z[0] + ": " + z[1]).join("\n"))}</textarea><small>Eine Angabe je Zeile im Format »Begriff: Angabe«.</small></label>
     <div class="actions"><button type="button" class="mini sec" data-infodel="${i}">Unterlage entfernen</button></div></div>`).join("")}
   <div class="actions"><button type="button" class="mini" id="edInfoAdd">Unterlage hinzufügen</button></div>`;
  if (abschnitt === "karte") return lkHTML();
  if (abschnitt === "fragen") return `<h3>Nachfragen an den Zugführer</h3><p class="hint">»Wichtig« markierte Nachfragen werden in der Auswertung der Erkundung gezählt.</p>
   ${D.nachfragen.map((n, i) => `<div class="ed-card ed-frage"><div class="ed-grid">${feld("nachfragen." + i + ".f", "Frage")}<label class="ed-c"><input type="checkbox" data-pc="nachfragen.${i}.wichtig" ${n.wichtig ? "checked" : ""}> wichtig</label></div>${feld("nachfragen." + i + ".a", "Antwort des Zugführers", { area: true, rows: 3 })}<div class="actions"><button type="button" class="mini sec" data-fdel="${i}">Entfernen</button></div></div>`).join("")}
   <div class="actions"><button type="button" class="mini" id="edFrageAdd">Nachfrage hinzufügen</button></div>`;
  if (abschnitt === "ausarb") {
    const o = A("orga"), soll = new Set(o.soll), kann = new Set(o.kann);
    const liste = [...new Set(MS.abschnitte.concat(o.soll, o.kann))];
    return `<h3>Führungsorganisation: erwartete Einsatzabschnitte</h3><p class="hint">Der Prüfling benennt die Abschnitte frei. Gleichwertige Bezeichnungen werden bei der Bewertung zugeordnet.</p>
     <div class="ed-abs">${liste.map(a => `<label><span>${esc(a)}</span><select data-orga="${esc(a)}"><option value="">nicht erwartet</option><option value="soll" ${soll.has(a) ? "selected" : ""}>erwartet</option><option value="kann" ${kann.has(a) ? "selected" : ""}>ebenfalls sinnvoll</option></select></label>`).join("")}</div>
     <div class="ed-grid"><label class="ed-f"><span>Weiterer Abschnitt</span><input id="edAbsNeu" placeholder="Bezeichnung"></label><div class="actions"><button type="button" class="mini" id="edAbsAdd">Als erwartet hinzufügen</button></div></div>
     ${feld("ausarbeitung.0.hinweis", "Hinweis in der Auswertung", { area: true, rows: 2 })}
     <h3>Weitere Maßnahmen</h3>${feld("ausarbeitung.1.frage", "Aufgabe")}${kritFeld("ausarbeitung.1.kriterien", "Kriterien")}
     <h3>Lagemeldung</h3>${feld("ausarbeitung.2.frage", "Aufgabe")}${kritFeld("ausarbeitung.2.kriterien", "Kriterien")}
     <h3>Nachalarmierung: Erwartungshorizont</h3>
     ${A("nachf").soll.map((r, i) => nfZeile(r, i)).join("")}
     <div class="actions"><button type="button" class="mini" data-nfadd="key">Einheit oder Stelle</button><button type="button" class="mini" data-nfadd="lz">Anzahl Löschzüge</button><button type="button" class="mini" data-nfadd="typ">Anzahl Fahrzeugtyp</button></div>`;
  }
  if (abschnitt === "komm") {
    const g = K("gefahren"), soll = new Set(g.soll);
    return `<h3>Gefahrenmatrix nach FwDV 500</h3><p class="hint">Felder antippen, welche der Prüfling nennen soll.</p>
     <div class="ed-mx"><table><thead><tr><th></th>${MSG.map(s => `<th>${esc(s)}</th>`).join("")}</tr></thead><tbody>${MZ.map(z => `<tr><th>${esc(z)}</th>${MSG.map(s => `<td><button type="button" class="${soll.has(z + ":" + s) ? "on" : ""}" data-mx="${esc(z + ":" + s)}" aria-label="${esc(z + " für " + s)}"></button></td>`).join("")}</tr>`).join("")}</tbody></table></div>
     ${feld("kommission.0.hinweis", "Hinweis zur Gefahrenmatrix", { area: true, rows: 2 })}
     <h3>Begründung</h3>${feld("kommission.1.frage", "Frage der Kommission")}${kritFeld("kommission.1.kriterien", "Kriterien")}
     <h3>Befehl</h3>${feld("kommission.2.frage", "Frage der Kommission")}${kritFeld("kommission.2.kriterien", "Kriterien")}
     <h3>Lageänderung</h3>${feld("kommission.3.frage", "Lageänderung und Frage", { area: true, rows: 3 })}${kritFeld("kommission.3.kriterien", "Kriterien")}`;
  }
  if (abschnitt === "presse") return `<h3>O-Ton Pressekonferenz</h3>
   ${feld("presse.anlass", "Anlass", { area: true, rows: 2, ph: "z. B. 15:30 Uhr, zwei Fernsehteams sind an der Absperrung eingetroffen." })}
   ${feld("presse.frage", "Aufgabe")}
   <div class="ed-grid">${feld("presse.sekunden", "Sprechzeit in Sekunden", { type: "number", min: 20 })}</div>
   ${kritFeld("presse.kriterien", "Kriterien")}`;
  if (abschnitt === "json") return `<h3>Lage als JSON</h3><p class="hint">Für Fortgeschrittene. Änderungen werden mit »Übernehmen« geprüft und eingesetzt.</p>
   <textarea class="ed-json" id="edJson" spellcheck="false">${esc(JSON.stringify(Object.assign({}, D, { eigen: undefined, beispiel: undefined }), null, 2))}</textarea>
   <div class="actions"><button type="button" class="mini" id="edJsonOk">Übernehmen</button></div>`;
  return "";
}
function nfZeile(r, i) {
  const p = "ausarbeitung.3.soll." + i;
  const kopf = r.t === "key" ? `<label class="ed-f"><span>Einheit oder Stelle (eine davon genügt)</span><div class="ed-tags">${r.any.map((k, j) => `<span class="ed-tag">${esc(P.ANF[k] ? P.ANF[k].name.replace(" komplett", "") : k)}<button type="button" data-nfanydel="${i}.${j}" aria-label="entfernen">✕</button></span>`).join("")}</div><select data-nfany="${i}"><option value="">hinzufügen …</option>${alleSchluessel().map(([k, n]) => `<option value="${esc(k)}">${esc(n)}</option>`).join("")}</select></label>`
    : r.t === "lz" ? feld(p + ".min", "Mindestens Löschzüge (Löschgruppe = 0,5)", { type: "number", step: "0.5", min: 0.5 })
    : `<label class="ed-f"><span>Fahrzeugtyp</span><select data-p="${p}.typ">${alleTypen().map(t => `<option ${r.typ === t ? "selected" : ""}>${esc(t)}</option>`).join("")}</select></label>${feld(p + ".min", "Mindestanzahl", { type: "number", min: 1 })}`;
  return `<div class="ed-card"><div class="ed-grid">${feld(p + ".label", "Bezeichnung in der Auswertung")}${feld(p + ".pts", "Punkte", { type: "number", min: 0 })}</div><div class="ed-grid">${kopf}</div>${feld(p + ".warum", "Begründung")}<div class="actions"><button type="button" class="mini sec" data-nfdel="${i}">Entfernen</button></div></div>`;
}

/* ───────── Lagekarte ───────── */
function lkHTML() {
  const sel = lkWahl != null ? D.lagekarte[lkWahl] : null;
  return `<h3>Unvollständige Lagekarte</h3><p class="hint">Element wählen und in die Karte tippen. Linien, Straßen, Schläuche und Pfeile mit zwei Klicks setzen. Ein gewähltes Element wird durch Ziehen oder Antippen verschoben.</p>
   <div class="ed-lkpal">${Object.entries(LK_TYPEN).map(([k, v]) => `<button type="button" class="${lkNeu === k ? "on" : ""}" data-lkneu="${k}">${esc(v)}</button>`).join("")}</div>
   <div class="ed-lk" id="edLk">${P.svgLage(Object.assign({}, D, { lagekarte: D.lagekarte }), true)}${lkMarke()}</div>
   <p class="hint" id="edLkHint">${lkNeu ? (ZWEI.has(lkNeu) && lkStart ? "Endpunkt antippen." : `»${esc(LK_TYPEN[lkNeu])}« platzieren: in die Karte tippen.`) : sel ? "Gewähltes Element: in die Karte tippen oder ziehen, um es zu verschieben." : ""}</p>
   <div class="ed-lklist">${D.lagekarte.map((it, i) => `<div class="ed-lki ${i === lkWahl ? "on" : ""}"><button type="button" class="ed-lkn" data-lkw="${i}">${esc(lkName(it))}</button><button type="button" class="mini sec" data-lkdel="${i}">✕</button></div>`).join("") || '<p class="note">Noch keine Elemente.</p>'}</div>
   ${sel ? `<div class="ed-card"><h4>${esc(lkName(sel))}</h4><div class="ed-grid">${lkFelder(sel, "lagekarte." + lkWahl)}</div></div>` : ""}`;
}
function lkName(it) { const n = it.t === "flaeche" ? "Straße" : LK_TYPEN[it.t] || it.t; return n + (it.txt ? ": " + it.txt : it.t === "warn" ? ": " + it.oben + "/" + it.unten : ""); }
function lkMarke() {
  if (lkWahl == null) return "";
  const p = lkPunkt(D.lagekarte[lkWahl]); if (!p) return "";
  return `<span class="ed-lkm" style="left:${p[0] / 6.4}%;top:${p[1] / 4}%"></span>`;
}
function lkPunkt(it) {
  if (!it) return null;
  if (it.x != null) return [it.x + (it.t === "gebaeude" ? it.w / 2 : 0), it.y + (it.t === "gebaeude" ? it.h / 2 : 0)];
  if (it.cx != null) return [it.cx, it.cy];
  if (it.x1 != null) return [it.x1, it.y1];
  if (it.pts) return it.pts[0];
  return null;
}
function lkVerschiebe(it, x, y) {
  const p = lkPunkt(it); if (!p) return; const dx = x - p[0], dy = y - p[1];
  if (it.x != null) { it.x = Math.round(it.x + dx); it.y = Math.round(it.y + dy); }
  else if (it.cx != null) { it.cx = Math.round(x); it.cy = Math.round(y); }
  else if (it.x1 != null) { it.x1 = Math.round(it.x1 + dx); it.y1 = Math.round(it.y1 + dy); it.x2 = Math.round(it.x2 + dx); it.y2 = Math.round(it.y2 + dy); }
  else if (it.pts) it.pts = it.pts.map(q => [Math.round(q[0] + dx), Math.round(q[1] + dy)]);
}
function lkFelder(it, p) {
  const f = [];
  if ("txt" in it || ["fz", "el", "brand", "personen", "ablage", "offen", "ausgang", "text", "tz", "wind", "gebaeude", "zone", "pfeil", "linie", "flaeche"].includes(it.t)) f.push(feld(p + ".txt", "Beschriftung"));
  if (it.t === "fz") f.push(`<label class="ed-f"><span>Organisation</span><select data-p="${p}.org">${[["fw", "Feuerwehr"], ["rd", "Rettungsdienst"], ["pol", "Polizei"], ["zivil", "Zivilfahrzeug"]].map(([k, v]) => `<option value="${k}" ${it.org === k ? "selected" : ""}>${v}</option>`).join("")}</select></label>`);
  if (it.t === "tz") f.push(`<label class="ed-f"><span>Zeichen</span><select data-p="${p}.z">${Object.keys(window.TZ).filter(k => /^(Gefahren|Einrichtungen|Maßnahmen|Sonstiges|Personen)\//.test(k)).map(k => `<option value="${esc(k)}" ${it.z === k ? "selected" : ""}>${esc(k.replace(/_/g, " "))}</option>`).join("")}</select></label>`, feld(p + ".s", "Größe", { type: "number", min: 12 }));
  if (it.t === "warn") f.push(feld(p + ".oben", "Gefahrnummer"), feld(p + ".unten", "UN-Nummer"));
  if (it.t === "wind") f.push(feld(p + ".dir", "Richtung in Grad (0 = Wind nach Norden)", { type: "number" }));
  if (it.t === "gebaeude") f.push(feld(p + ".w", "Breite", { type: "number", min: 10 }), feld(p + ".h", "Höhe", { type: "number", min: 10 }));
  if (it.t === "zone") f.push(`<label class="ed-f"><span>Art</span><select data-p="${p}.kind"><option value="gefahr" ${it.kind === "gefahr" ? "selected" : ""}>Gefahrenbereich</option><option value="absperr" ${it.kind === "absperr" ? "selected" : ""}>Absperrbereich</option></select></label>`, feld(p + ".r", "Radius", { type: "number", min: 5 }));
  if (it.t === "linie") f.push(`<label class="ed-f"><span>Art</span><select data-p="${p}.s">${[["mittel", "Mittellinie"], ["wasser", "Gewässer"], ["brandwand", "Brandwand"], ["gleis", "Gleis"]].map(([k, v]) => `<option value="${k}" ${it.s === k ? "selected" : ""}>${v}</option>`).join("")}</select></label>`);
  return f.join("");
}
function lkPlatziere(x, y) {
  x = Math.round(x); y = Math.round(y);
  if (lkNeu) {
    if (ZWEI.has(lkNeu)) {
      if (!lkStart) { lkStart = [x, y]; renderLk(); return; }
      const [a, b] = lkStart; let it;
      if (lkNeu === "strasse") { const y1 = Math.min(b, y), y2 = Math.max(b, y), x1 = Math.min(a, x), x2 = Math.max(a, x); it = { t: "flaeche", f: "strasse", pts: [[x1, y1], [x2, y1], [x2, Math.max(y2, y1 + 20)], [x1, Math.max(y2, y1 + 20)]], txt: "" }; }
      else if (lkNeu === "linie") it = { t: "linie", s: "mittel", pts: [[a, b], [x, y]], txt: "" };
      else if (lkNeu === "schlauch") it = { t: "schlauch", pts: [[a, b], [x, y]] };
      else it = { t: lkNeu, x1: a, y1: b, x2: x, y2: y, txt: "" };
      lkStart = null; lkNeu = null; D.lagekarte.push(lkItem(it)); lkWahl = D.lagekarte.length - 1; unsaved = true; render(); return;
    }
    const vor = { fz: { org: "fw", txt: "HLF 20" }, el: { txt: "EL" }, brand: { txt: "" }, personen: { txt: "Personen" }, ablage: { txt: "Patientenablage" }, offen: { txt: "offen" }, tz: { z: "Gefahren/Akute_Gefahr_durch_Gas", s: 36, txt: "" },
      warn: { oben: "33", unten: "1203" }, wind: { dir: 45, txt: "Wind" }, gebaeude: { w: 160, h: 80, txt: "Gebäude" }, zone: { kind: "gefahr", r: 60, txt: "Gefahrenbereich" }, ausgang: { txt: "Ausgang" }, text: { txt: "Text" } }[lkNeu] || {};
    const it = Object.assign({ t: lkNeu }, vor);
    if (lkNeu === "zone") { it.cx = x; it.cy = y; } else if (lkNeu === "gebaeude") { it.x = x - 80; it.y = y - 40; } else { it.x = x; it.y = y; }
    const n = lkItem(it); if (n) { D.lagekarte.push(n); lkWahl = D.lagekarte.length - 1; unsaved = true; }
    lkNeu = null; render(); return;
  }
  if (lkWahl != null) { lkVerschiebe(D.lagekarte[lkWahl], x, y); unsaved = true; renderLk(); }
}
function renderLk() {
  const box = $("#edLk"); if (!box) return;
  box.innerHTML = P.svgLage(Object.assign({}, D), true) + lkMarke();
  const h = $("#edLkHint"); if (h) h.textContent = lkNeu ? (ZWEI.has(lkNeu) && lkStart ? "Endpunkt antippen." : `»${LK_TYPEN[lkNeu]}« platzieren: in die Karte tippen.`) : lkWahl != null ? "Gewähltes Element: in die Karte tippen oder ziehen, um es zu verschieben." : "";
}
function lkKoord(e) { const r = $("#edLk").getBoundingClientRect(); return [(e.clientX - r.left) / r.width * 640, (e.clientY - r.top) / r.height * 400]; }

/* ───────── Ereignisse ───────── */
function binden() {
  body.querySelectorAll("[data-p]").forEach(el => el.addEventListener(el.tagName === "SELECT" ? "change" : "input", () => {
    const p = el.dataset.p, alt = hole(p);
    let v = el.value; if (el.type === "number") v = el.value === "" ? 0 : Number(el.value);
    setze(p, typeof alt === "number" && el.type !== "number" ? Number(v) : v);
    if (p === "titel" || /^lagekarte\./.test(p)) { if (/^lagekarte\./.test(p)) { renderLk(); const b = body.querySelector(`[data-lkw="${lkWahl}"]`); if (b) b.textContent = lkName(D.lagekarte[lkWahl]); } renderKopf(); }
  }));
  body.querySelectorAll("[data-p]").forEach(el => el.addEventListener("change", () => renderKopf()));
  body.querySelectorAll("[data-pc]").forEach(el => el.addEventListener("change", () => setze(el.dataset.pc, el.checked)));
  body.querySelectorAll("[data-k]").forEach(el => el.addEventListener("input", () => {
    setze(el.dataset.k, el.value.split("\n").map(z => z.trim()).filter(Boolean).map(z => { const m = z.match(/^(.*?)\s*\|\s*(\d+(?:[.,]\d+)?)\s*$/); return m ? [m[1], pkt(m[2].replace(",", "."))] : [z, 1]; }));
  }));
  body.querySelectorAll("[data-k]").forEach(el => el.addEventListener("change", renderKopf));
  const abs = body.querySelector("[data-abs]"); if (abs) abs.addEventListener("input", () => { setze("uebergabe.text", abs.value.split(/\n\s*\n/).map(p => p.replace(/\s*\n\s*/g, " ").trim()).filter(Boolean)); });
  body.querySelectorAll("[data-zeilen]").forEach(el => el.addEventListener("input", () => {
    D.info[+el.dataset.zeilen].zeilen = el.value.split("\n").map(z => z.trim()).filter(Boolean).map(z => { const i = z.indexOf(":"); return i > 0 ? [z.slice(0, i).trim(), z.slice(i + 1).trim()] : [z, ""]; }); unsaved = true;
  }));
  const karte = body.querySelector("#edKarte");
  if (karte) karte.addEventListener("click", e => {
    const r = karte.getBoundingClientRect(); D.x = Math.round((e.clientX - r.left) / r.width * 1000) / 10; D.y = Math.round((e.clientY - r.top) / r.height * 1000) / 10; unsaved = true;
    karte.querySelector(".ed-pin").style.left = D.x + "%"; karte.querySelector(".ed-pin").style.top = D.y + "%"; $("#edPos").textContent = D.x.toFixed(1) + " / " + D.y.toFixed(1);
  });
  const lk = body.querySelector("#edLk");
  if (lk) {
    let zieh = false;
    lk.addEventListener("pointerdown", e => { if (lkNeu) return; if (lkWahl != null) { zieh = true; lk.setPointerCapture(e.pointerId); const [x, y] = lkKoord(e); lkPlatziere(x, y); } });
    lk.addEventListener("pointermove", e => { if (!zieh) return; const [x, y] = lkKoord(e); lkVerschiebe(D.lagekarte[lkWahl], Math.round(x), Math.round(y)); unsaved = true; renderLk(); });
    const ende = () => { zieh = false; };
    lk.addEventListener("pointerup", ende); lk.addEventListener("pointercancel", ende);
    lk.addEventListener("click", e => { if (!lkNeu) return; const [x, y] = lkKoord(e); lkPlatziere(x, y); });
  }
  const on = (sel, fn) => body.querySelectorAll(sel).forEach(el => el.addEventListener("click", () => fn(el)));
  on("[data-alm]", el => { const k = el.dataset.alm, i = D.alarmiert.indexOf(k); if (i >= 0) D.alarmiert.splice(i, 1); else D.alarmiert.push(k); unsaved = true; const s = body.scrollTop; render(); body.scrollTop = s; });
  on("#edMeldung", () => {
    const namen = D.alarmiert.map(k => P.ANF[k] ? P.ANF[k].name.replace(" komplett", "") : k);
    D.meldung = `Leitstelle Musterstadt für C-Dienst. Einsatz ${D.stichwort || "…"}, ${D.ort.adresse || "…"}${D.meldender ? ", Meldung durch " + D.meldender : ""}. ${namen.length ? "Alarmiert sind " + (namen.length > 1 ? namen.slice(0, -1).join(", ") + " und " + namen[namen.length - 1] : namen[0]) + ". " : ""}Sie werden zur Übernahme der Einsatzleitung angefordert.`;
    unsaved = true; render();
  });
  on("#edInfoAdd", () => { D.info.push({ titel: "", zeilen: [] }); unsaved = true; render(); });
  on("[data-infodel]", el => { D.info.splice(+el.dataset.infodel, 1); unsaved = true; render(); });
  on("#edFrageAdd", () => { D.nachfragen.push({ f: "", a: "", wichtig: false }); unsaved = true; const s = body.scrollHeight; render(); body.scrollTop = s; });
  on("[data-fdel]", el => { D.nachfragen.splice(+el.dataset.fdel, 1); unsaved = true; const s = body.scrollTop; render(); body.scrollTop = s; });
  body.querySelectorAll("[data-orga]").forEach(el => el.addEventListener("change", () => {
    const o = finde(D.ausarbeitung, "orga"), a = el.dataset.orga;
    o.soll = o.soll.filter(x => x !== a); o.kann = o.kann.filter(x => x !== a);
    if (el.value === "soll") o.soll.push(a); if (el.value === "kann") o.kann.push(a); unsaved = true; renderKopf();
  }));
  on("#edAbsAdd", () => { const v = $("#edAbsNeu").value.trim(); if (!v) return; const o = finde(D.ausarbeitung, "orga"); if (!o.soll.includes(v)) o.soll.push(v); unsaved = true; const s = body.scrollTop; render(); body.scrollTop = s; });
  on("[data-nfadd]", el => { const t = el.dataset.nfadd, n = finde(D.ausarbeitung, "nachf");
    n.soll.push(t === "lz" ? { t: "lz", min: 2, pts: 2, label: "Alarmstufe erhöhen", warum: "" } : t === "typ" ? { t: "typ", typ: alleTypen()[0], min: 1, pts: 1, label: "", warum: "" } : { t: "key", any: [], pts: 1, label: "", warum: "" });
    unsaved = true; const s = body.scrollHeight; render(); body.scrollTop = s; });
  on("[data-nfdel]", el => { finde(D.ausarbeitung, "nachf").soll.splice(+el.dataset.nfdel, 1); unsaved = true; const s = body.scrollTop; render(); body.scrollTop = s; });
  on("[data-nfanydel]", el => { const [i, j] = el.dataset.nfanydel.split(".").map(Number); finde(D.ausarbeitung, "nachf").soll[i].any.splice(j, 1); unsaved = true; const s = body.scrollTop; render(); body.scrollTop = s; });
  body.querySelectorAll("[data-nfany]").forEach(el => el.addEventListener("change", () => {
    if (!el.value) return; const r = finde(D.ausarbeitung, "nachf").soll[+el.dataset.nfany];
    if (!r.any.includes(el.value)) r.any.push(el.value);
    if (!r.label && P.ANF[el.value]) r.label = P.ANF[el.value].name.replace(" komplett", "");
    unsaved = true; const s = body.scrollTop; render(); body.scrollTop = s;
  }));
  on("[data-mx]", el => { const g = finde(D.kommission, "gefahren"), k = el.dataset.mx, i = g.soll.indexOf(k); if (i >= 0) g.soll.splice(i, 1); else g.soll.push(k); el.classList.toggle("on"); unsaved = true; renderKopf(); });
  on("[data-lkneu]", el => { lkNeu = lkNeu === el.dataset.lkneu ? null : el.dataset.lkneu; lkStart = null; lkWahl = null; render(); });
  on("[data-lkw]", el => { lkWahl = +el.dataset.lkw; lkNeu = null; const s = body.scrollTop; render(); body.scrollTop = s; });
  on("[data-lkdel]", el => { D.lagekarte.splice(+el.dataset.lkdel, 1); lkWahl = null; unsaved = true; const s = body.scrollTop; render(); body.scrollTop = s; });
  on("#edJsonOk", () => {
    try { const l = norm(JSON.parse($("#edJson").value), D.id); D = l; unsaved = true; P.toast("JSON übernommen"); render(); }
    catch (e) { P.toast("JSON fehlerhaft: " + e.message); }
  });
}
nav.addEventListener("click", e => { const b = e.target.closest("[data-eda]"); if (!b) return; abschnitt = b.dataset.eda; lkNeu = null; lkStart = null; render(); });
$("#edSave").addEventListener("click", () => speichern());
$("#edClose").addEventListener("click", schliesse);
$("#edExport").addEventListener("click", async () => { const l = await speichern(true); exportiere([l.id]); });
$("#edTest").addEventListener("click", async () => { const l = await speichern(true); ov.hidden = true; $("#listeOv").hidden = true; P.starte(l.id); });
$("#edDel").addEventListener("click", () => {
  const h = $("#edHinweis");
  if (!SZ.find(s => s.id === D.id)) { unsaved = false; ov.hidden = true; return; }
  h.innerHTML = 'Lage wirklich löschen? <button type="button" class="link" id="edDelOk">Ja, löschen</button>';
  $("#edDelOk").addEventListener("click", async () => { await loeschen(D.id); unsaved = false; ov.hidden = true; });
});
document.addEventListener("keydown", e => { if (e.key === "Escape" && !ov.hidden) { e.stopImmediatePropagation(); schliesse(); } }, true);

$("#lNeu").addEventListener("click", neu);
$("#lImport").addEventListener("click", importDialog);
$("#lExport").addEventListener("click", () => exportiere(SZ.filter(s => s.eigen).map(s => s.id)));
const lov = $("#listeOv");
lov.addEventListener("dragover", e => { if ([...e.dataTransfer.types].includes("Files")) { e.preventDefault(); lov.classList.add("drop"); } });
lov.addEventListener("dragleave", e => { if (e.target === lov) lov.classList.remove("drop"); });
lov.addEventListener("drop", e => { e.preventDefault(); lov.classList.remove("drop"); const f = e.dataTransfer.files[0]; if (f) importiereDatei(f); });

window.Editor = { neu, vorlage, bearbeiten, loeschen, exportiere, importDialog, importiereDatei, importText, norm, alleEigenen: () => SZ.filter(s => s.eigen).map(s => s.id), Speicher };
ladeEigene();
})();
