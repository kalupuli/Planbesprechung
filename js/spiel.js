/* Planbesprechung Musterstadt · Spiellogik */
(function () {
"use strict";
const MS = window.MS, SZ = window.SZENARIEN;
const $ = s => document.querySelector(s);
const esc = t => String(t == null ? "" : t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const BW = 900, BH = 1072;
const MONATE = ["jan", "feb", "mär", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "dez"];
const RUFRANG = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
const MATRIX_Z = ["Atemgifte", "Angstreaktion", "Ausbreitung", "Atomare Strahlung", "Chemische Stoffe", "Erkrankung/Verletzung", "Explosion", "Einsturz", "Elektrizität"];
const MATRIX_S = ["Menschen", "Tiere", "Umwelt", "Sachwerte", "Mannschaft", "Gerät"];
const store = { get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };

/* ───────── Stammdaten aufbereiten ───────── */
const WACHEN = {};
MS.wachen.forEach(w => { WACHEN[w.id] = w; });
MS.ff.forEach(f => {
  const [nr, typ, partner, sa, x, y, tot, fz] = f;
  const w = { id: "FF" + nr, nr, kurz: (typ === "LZ" ? "LZ " : "LG ") + nr, name: (typ === "LZ" ? "Löschzug " : "Löschgruppe ") + nr, art: "ff", wb: Math.floor(nr / 10), x, y, typ, partner,
    rolle: [sa, partner ? "Löschzug mit Einheit " + partner : ""].filter(Boolean).join(" · "),
    gruppen: [{ t: "Fahrzeuge", tot, v: fz.map(v => [v[0], v[1], v[2] || ""]) }], ab: [], anf: [] };
  w.anf.push({ id: w.id, name: w.name + " komplett", typen: fz.map(v => v[0]), lz: typ === "LZ" ? 1 : 0.5, tok: w.kurz, st: tot, fzn: fz.length });
  (MS.komponenten[nr] || []).forEach(k => w.anf.push(Object.assign({ pk: true }, k)));
  WACHEN[w.id] = w;
});
if (MS.thw) WACHEN[MS.thw.id] = MS.thw;
const ANF = {};
Object.values(WACHEN).forEach(w => w.anf.forEach(a => { ANF[a.id] = Object.assign({ art: a.pk ? "pk" : w.art, wache: w.id }, a); }));
MS.ueber.forEach(u => { ANF[u.id] = Object.assign({ art: "ue", tok: u.kurz, typen: [] }, u); });
MS.extern.forEach(e => { ANF[e.id] = Object.assign({ art: "ext", typen: [] }, e); });
Object.entries(MS.manv).forEach(([k, m]) => { ANF[k] = { id: k, name: "Einsatzmittelkette " + m.name, tok: m.name, art: "pk", wache: "FRW2", typen: [], keys: m.keys, info: m.info, manv: true }; });
ANF.CDIENST = { id: "CDIENST", name: "C-Dienst (ELW 1)", tok: "C-Dienst", art: "c", wache: "FRW1", typen: ["ELW 1"], st: "1/1/1/3", fzn: 1 };

const KURZ = { LZ1: "LZ 1", LZ2: "LZ 2", GR3: "Gruppe 3", RW1: "RW", KW1: "KW 30", TLF1: "TLF 4000", TLF2: "TLF 4000", GWA: "GW-A", GWH: "GW-Höhe", GWT: "GW-Tauch", GWOEL: "GW-Öl", ELW2: "ELW 2", DDIENST: "D-Dienst", BZBV: "OrgL RD", LNA: "LNA",
  ABVDEKON: "AB-V-Dekon", ABSTRAHL: "AB-Strahl.", ABRUEST: "AB-Rüst", ABBAU: "AB-Bau", ABMULDE: "AB-Mulde", ABKUECHE: "AB-Küche", ABMANV: "AB-MANV", ABSOLM: "AB-SoLö", ABBOOT: "AB-Boot", ABSAND: "AB-Sand", ABTANK: "AB-Tank",
  RTW1R: "RTW", RTW2R: "RTW", RTW3R: "RTW", NEF1R: "NEF", NEF2R: "NEF", SEGSAN1: "SEG-San 1", SEGSAN2: "SEG-San 2", SEGBT1: "SEG-Bt 1", SEGBT2: "SEG-Bt 2", EE2: "EE 2", EE4: "EE 4", ITW4: "ITW", ELW2RD: "ELW 2 RD",
  ABCZ: "ABC-Zug", MESSZ: "Messzug", PDEKON: "P-Dekon", GDEKON: "G-Dekon", VDEKON: "V-Dekon", WASSER: "EA Wasser", WB1: "WB FRW 1", WB2: "WB FRW 2", CDIENST: "C-Dienst" };
function kurz(def) { return def.tok || KURZ[def.id] || def.name.split(" (")[0]; }
function staerke(def) {
  const s = MS.staerke[def.id];
  if (s) return { st: s[0], fz: s[1], g: s[2] };
  if (def.st) return { st: def.st, fz: def.fzn || def.typen.length };
  return { st: null, fz: def.typen.length || 0 };
}
function parseSt(s) { return s ? s.replace(/[()]/g, "").split("/").map(x => (x === "-" || x === "") ? 0 : +x) : null; }

/* ───────── Zeit ───────── */
function hm(min) { min = ((Math.round(min) % 1440) + 1440) % 1440; return String(Math.floor(min / 60)).padStart(2, "0") + ":" + String(min % 60).padStart(2, "0"); }
function t0min(sz) { const [a, b] = sz.t0.split(":").map(Number); return a * 60 + b; }
function uhr(t) { return hm(t0min(G.sz) + t); }
function dtg(t) {
  const d = new Date(G.sz.datum + "T00:00:00"); const tot = t0min(G.sz) + Math.round(t);
  d.setDate(d.getDate() + Math.floor(tot / 1440));
  return String(d.getDate()).padStart(2, "0") + hm(tot).replace(":", "") + MONATE[d.getMonth()] + String(d.getFullYear()).slice(2);
}

/* ───────── Spielzustand ───────── */
let G = null;
function neuerZustand(sz) {
  return { sz, t: 0, speed: 0, items: [], keys: new Set(), log: [], step: 0, maxStep: 0, ans: {}, krit: {}, mx: new Set(), orga: [0, 1, 2, 3, 4].map(() => ({ ea: "", eal: "", rg: "", frn: "", auftrag: "", uea: [] })), fo: { gel: "", adm: "", el: "", fue: "", lts: "", tel: "" }, uid: 0, cItem: null, eingetroffen: false, orgaZeit: null,
    fragen: [], cd: { start: null, dauer: 240, strikt: true }, abgabe: null, ki: {}, presseStart: null, zufall: false, tf: {} };
}

/* ───────── Entfernung und Anfahrt ───────── */
function km(a, b) { const dx = (a.x - b.x) / 100 * MS.karte.breiteKm, dy = (a.y - b.y) / 100 * MS.karte.hoeheKm; return Math.hypot(dx, dy); }
function quelle(def, ziel) {
  if (def.art === "ue") {
    const p = has3D && K3.uePos(def.id); if (p) return p;
    const z = ziel || { x: 50, y: 50 }; return ({ n: { x: z.x, y: -4 }, s: { x: z.x, y: 104 }, w: { x: -4, y: z.y }, o: { x: 104, y: z.y } })[def.rand || "o"];
  }
  const w = WACHEN[def.wache]; return { x: w.x, y: w.y };
}
function zielVon(def) { if (def.ziel) { const w = WACHEN[def.ziel]; return { x: w.x, y: w.y }; } return G ? { x: G.sz.x, y: G.sz.y } : { x: 50, y: 50 }; }
function eta(def, ziel) {
  if (def.art === "ext") return 0;
  if (def.art === "ue") return def.eta;
  const d = km(quelle(def, ziel), ziel || zielVon(def));
  let m;
  if (def.manv) m = 8 + d * 1.25;
  else if (def.art === "pk") m = 8 + d * 1.4;
  else if (def.ausr != null) m = def.ausr + d * 1.4;
  else if (def.art === "ff") m = 5 + d * 1.4;
  else if (def.art === "rd") m = 3 + d * 1.25;
  else m = 1 + d * 1.25;
  if (def.ruf) m += 10;
  return Math.max(2, Math.round(m));
}

/* ───────── Taktische Zeichen (Jonas Köritz, CC BY 4.0) ───────── */
let tzN = 0;
function tz(key, o) {
  o = o || {}; let s = window.TZ && window.TZ[key]; if (!s) return "";
  const n = ++tzN;
  s = s.replace(/id="([^"]+)"/g, (m, i) => `id="${i}-${n}"`).replace(/url\(#([^)]+)\)/g, (m, i) => `url(#${i}-${n})`).replace(/href="#([^"]+)"/g, (m, i) => `href="#${i}-${n}"`);
  if (o.text) s = s.replace("</svg>", o.mitte ? `<text x="128" y="${o.ty || 150}" text-anchor="middle" style="font-family:'Roboto Slab','Arial Narrow',Arial,sans-serif;font-weight:bold;font-size:${o.fs || 34}px" fill="${o.fill || "#000000"}">${esc(o.text)}</text></svg>` : `<text x="22" y="120" style="font-family:'Roboto Slab','Arial Narrow',Arial,sans-serif;font-weight:bold;font-size:${o.fs || 26}px" fill="${o.fill || "#FFFFFF"}">${esc(o.text)}</text></svg>`);
  s = s.replace(' width="256" height="256"', "");
  const a = (o.w != null ? ` width="${o.w}"` : "") + (o.h != null ? ` height="${o.h}"` : "") + (o.x != null ? ` x="${o.x}"` : "") + (o.y != null ? ` y="${o.y}"` : "") + ` class="tz${o.cls ? " " + o.cls : ""}" aria-hidden="true"`;
  return s.replace("<svg ", "<svg" + a + " ");
}
const TYP_TZ = {
  "ELW 1": "Feuerwehr_Fahrzeuge/ELW_1", "ELW 2": "Feuerwehr_Fahrzeuge/ELW_2", "HLF 20": "Feuerwehr_Fahrzeuge/HLF", "DLA (K) 23/12": "Feuerwehr_Fahrzeuge/Drehleiter_mit_Korb",
  "RW": "Feuerwehr_Fahrzeuge/Rüstwagen", "TLF 4000": "Feuerwehr_Fahrzeuge/TLF_4000", "TLF 2000": "Feuerwehr_Fahrzeuge/TLF_2000", "GW-Atemschutz": "Feuerwehr_Fahrzeuge/Gerätewagen_Atemschutz",
  "GW-G": "Feuerwehr_Fahrzeuge/Gerätewagen_Gefahrgut", "GW-L1": "Feuerwehr_Fahrzeuge/Gerätewagen_Logistik_1", "GW-L2": "Feuerwehr_Fahrzeuge/Gerätewagen_Logistik_2", "GW-Mess": "Feuerwehr_Fahrzeuge/Messfahrzeug",
  "ABC-ErkW": "Katastrophenschutz_Fahrzeuge/ABC_Erkundungskraftwagen", "MTF": "Feuerwehr_Fahrzeuge/MTF", "WLF": "Feuerwehr_Fahrzeuge/Wechselladerfahrzeug", "KdoW": "Feuerwehr_Fahrzeuge/Kommandowagen",
  "LF 20 KatS": "Feuerwehr_Fahrzeuge/LF_KatS", "LF 20": "Feuerwehr_Fahrzeuge/Löschfahrzeug", "LF 10": "Feuerwehr_Fahrzeuge/Löschfahrzeug", "LF 16/12": "Feuerwehr_Fahrzeuge/Löschfahrzeug",
  "GA Boot": "Feuerwehr_Fahrzeuge/Feuerwehrboot", "GA LIMA": "Feuerwehr_Fahrzeuge/Feuerwehranhänger", "Dekon-LKW P": "Katastrophenschutz_Fahrzeuge/Gerätewagen_Dekon_P",
  "RTW": "Rettungswesen_Fahrzeuge/RTW", "KTW": "Rettungswesen_Fahrzeuge/KTW", "KTW-B": "Rettungswesen_Fahrzeuge/KTW", "NEF": "Rettungswesen_Fahrzeuge/Notarzteinsatzfahrzeug",
  "ITW": "Rettungswesen_Fahrzeuge/Notarztwagen", "GW-San": "Rettungswesen_Fahrzeuge/Gerätewagen_Sanität", "Einsatzeinheit": "Rettungswesen_Einheiten/Einsatzeinheit", "Betreuungsgruppe": "Rettungswesen_Einheiten/Betreuungsgruppe"
};
const THW_TZ = {
  "FüKW": "THW_Fahrzeuge/FüKW", "GKW": "THW_Fahrzeuge/GKW_I", "MzGW": "THW_Fahrzeuge/MzGW", "Kipper": "THW_Fahrzeuge/Kipper", "LKW Lbw": "THW_Fahrzeuge/LKW_Lbw",
  "MTW": "THW_Fahrzeuge/MTW", "MLW": "THW_Fahrzeuge/MLW_IV", "PKW": "THW_Fahrzeuge/PKW", "Bagger": "THW_Fahrzeuge/Radbagger", "Anh. Tieflader": "THW_Fahrzeuge/Anhänger_Tieflader_18t",
  "Anh. NEA 650 kVA": "THW_Fahrzeuge/Anhänger_NEA_650kVA", "Anh. NEA 200 kVA": "THW_Fahrzeuge/Anhänger_NEA_200kVA", "Anh. NEA 50 kVA LiMa": "THW_Fahrzeuge/Anhänger_NEA_50kVA_LiMa",
  "Anh. SwPu 15000": "THW_Fahrzeuge/Anhänger_SwPu_15000", "kl. Boot": "THW_Fahrzeuge/Anhänger_kl_Boot"
};
const TYP_TEXT = { "KW 30": "KW", "GW-Öl": "GW-Öl", "GW-Tauchen": "GW-T", "GW-Höhenrettung": "GW-H" };
const DEF_TZ = {
  LZ1: "Feuerwehr_Einheiten/Löschzug_Berufsfeuerwehr", LZ2: "Feuerwehr_Einheiten/Löschzug_Berufsfeuerwehr", GR3: "Feuerwehr_Einheiten/Löschgruppe",
  ABCZ: "Katastrophenschutz_Einheiten/ABC_Zug", ABCZNRW: "Katastrophenschutz_Einheiten/ABC_Zug", MESSZ: "Katastrophenschutz_Einheiten/Messzug", MESSNRW: "Katastrophenschutz_Einheiten/Messzug",
  PDEKON: "Katastrophenschutz_Einheiten/Dekontaminierungsgruppe_Personen", GDEKON: "Katastrophenschutz_Einheiten/Dekontaminierungsgruppe_Gerät", VDEKON: "Katastrophenschutz_Einheiten/Dekontaminierungsbereitschaft_Verletzte_50",
  VDEKNRW: "Katastrophenschutz_Einheiten/Dekontaminierungsbereitschaft_Verletzte_50", ATF: "Katastrophenschutz_Einheiten/ATF", BEZB: "Feuerwehr_Einheiten/Bereitschaft",
  PTZ: "Rettungswesen_Einheiten/Patiententransportzug", BHPB: "Einrichtungen/Behandlungsplatz", BTPB: "Rettungswesen_Einheiten/Betreuungszug", UMANV: "Rettungswesen_Einheiten/Rettungsdienst",
  RTH: "Fahrzeuge/Hubschrauber", SEGSAN1: "Rettungswesen_Einheiten/Sanitätsgruppe", SEGSAN2: "Rettungswesen_Einheiten/Sanitätsgruppe", SEGBT1: "Rettungswesen_Einheiten/Schnelleinsatzgruppe_Betreuung",
  SEGBT2: "Rettungswesen_Einheiten/Schnelleinsatzgruppe_Betreuung", EE2: "Rettungswesen_Einheiten/Einsatzeinheit", EE4: "Rettungswesen_Einheiten/Einsatzeinheit",
  MANV10: "Rettungswesen_Einheiten/Rettungsdienst", MANV20: "Rettungswesen_Einheiten/Rettungsdienst", MANV50: "Rettungswesen_Einheiten/Rettungsdienst",
  WB1: "Feuerwehr_Einheiten/Löschzug_Freiwillige_Feuerwehr", WB2: "Feuerwehr_Einheiten/Löschzug_Freiwillige_Feuerwehr", WASSER: "Feuerwehr_Einheiten/Löschzug_Wasser",
  THWFB: "THW_Personen/Fachberater", THWTZ1: "THW_Einheiten/Technischer_Zug", THWTZ2: "THW_Einheiten/Technischer_Zug_mit_FGr_Räumen_A", THWE: "THW_Einheiten/FGr_Elektroversorgung",
  THWWP: "THW_Einheiten/FGr_Wassserschaden-Pumpen_B", THWUL: "THW_Einheiten/Trupp_UL", THWO: "THW_Einheiten/FGr_Ortung_biologisch_und_technisch", THWSB: "THW_Einheiten/FGr_Schwere_Bergung_B",
  THWFK: "THW_Einheiten/Fachzug_Führung_Kommunikation", THWLOG: "THW_Einheiten/Fachzug_Logistik",
  ABMANV: "Rettungswesen_Fahrzeuge/Abrollbehälter_MANV", ELW2RD: "Feuerwehr_Fahrzeuge/ELW_2", CDIENST: "Feuerwehr_Fahrzeuge/ELW_1"
};
function tzTyp(typ, o) { if (o && o.thw && THW_TZ[typ]) return tz(THW_TZ[typ], o); if (TYP_TZ[typ]) return tz(TYP_TZ[typ], o); if (THW_TZ[typ]) return tz(THW_TZ[typ], o); return tz("Feuerwehr_Fahrzeuge/Kraftfahrzeug", Object.assign({ text: TYP_TEXT[typ] || String(typ).split(" ")[0].slice(0, 6) }, o)); }
function tzDef(def, o) {
  if (!def) return "";
  if (DEF_TZ[def.id]) return tz(DEF_TZ[def.id], o);
  if (/^FF\d+$/.test(def.id)) return tz(def.lz === 1 ? "Feuerwehr_Einheiten/Löschzug_Freiwillige_Feuerwehr" : "Feuerwehr_Einheiten/Löschgruppe", o);
  if (def.art === "ext") return "";
  return def.typen && def.typen[0] ? tzTyp(def.typen[0], o) : tz("Fahrzeuge/Kraftfahrzeug", o);
}
// Abgeleitet aus dem Zeichensatz: Führungseinheit in Gelb (FwDV 100), Leitstelle mit NRW-Kürzel LtS
if (window.TZ) {
  TZ["Abgeleitet/Führungseinheit"] = (TZ["Einheiten/Führungsgruppe"] || "").replace('fill="#FFFFFF"', 'fill="#FFFF00"').replace(/<ellipse[^>]*\/>/g, "");
  TZ["Abgeleitet/Leitstelle_LtS"] = (TZ["Einrichtungen/Leitstelle"] || "").replace(">LSt<", ">LtS<");
}
const TZ_QUELLE = 'Taktische Zeichen: Jonas Köritz, <a href="https://github.com/jonas-koeritz/Taktische-Zeichen" target="_blank" rel="noopener">Taktische-Zeichen</a>, <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>';

/* ───────── Karte ───────── */
const stage = $("#stage");
const TYPEN = { abc: "Gefahrgut / ABC", brand: "Brand", tunnel: "Tunnel / Bahn", th: "Technische Hilfe" };
const ICONS = {
  // Technische Hilfe: angelehnt an das Fachsymbol des taktischen Zeichens Rüstwagen (Hebezeug mit Zugseil)
  th: '<svg viewBox="0 0 34 34" width="28" height="28"><rect x="2" y="2" width="30" height="30" rx="4" fill="#d81b1b"/><g transform="translate(-0.6 .5)"><path d="M16.5 16.5h2c1.9-4.4 9-4.4 7.1 0s4.6 4.4 5.2 0" stroke="#fff" stroke-width="4.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M16.5 16.5h2c1.9-4.4 9-4.4 7.1 0s4.6 4.4 5.2 0" stroke="#d81b1b" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect x="8.6" y="13.2" width="8" height="6.6" fill="#d81b1b" stroke="#fff" stroke-width="1.6"/><path d="M8.6 14.4L3.6 12.2M8.6 18.6L3.6 20.8" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></g></svg>',
  abc: '<svg viewBox="0 0 34 34" width="28" height="28"><rect x="2" y="5" width="30" height="24" rx="2" fill="#ff8a00" stroke="#111" stroke-width="2"/><line x1="2" y1="17" x2="32" y2="17" stroke="#111" stroke-width="2"/><text x="17" y="15" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-weight="700" font-size="9" fill="#111">268</text><text x="17" y="26.5" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-weight="700" font-size="9" fill="#111">1005</text></svg>',
  brand: '<svg viewBox="0 0 34 34" width="28" height="28"><path d="M17 3c2 6 9 9 9 17a9 9 0 0 1-18 0c0-5 3-7 4-11 1 3 2 4 4 5 0-4 0-7 1-11z" fill="#ff4a1f"/><path d="M17 15c1 3 5 5 5 9a5 5 0 0 1-10 0c0-3 2-4 3-6 0 2 1 2 2 3 0-2 0-4 0-6z" fill="#ffd54a"/></svg>',
  tunnel: '<svg viewBox="0 0 34 34" width="28" height="28"><rect x="2" y="2" width="30" height="30" rx="4" fill="#1d4ed8"/><path d="M10 9v10a7 7 0 0 0 14 0V9" fill="none" stroke="#fff" stroke-width="4"/><path d="M25 3c1 3 4 4 4 8a4 4 0 0 1-8 0c0-2 2-3 2-5 1 1 1 1 2 2z" fill="#ff4a1f"/></svg>'
};
const pinInfo = { icon: sz => ICONS[sz.typ] || ICONS.brand, esc, unter: sz => { const b = store.get("pms_best", {}); return b[sz.id] != null ? "Bestwert " + b[sz.id] + " %" : esc(sz.zeit + " " + sz.t0 + " Uhr"); }, done: sz => store.get("pms_best", {})[sz.id] != null };
const K3 = window.Karte3D;
const has3D = !!(window.THREE && K3 && K3.init(stage, {
  textur: $("#maptex").getAttribute("src"),
  onWache: id => oeffneWache(id),
  onSzenario: id => { if (!G) vorschau(id); },
  onLeer: () => schliesseDrawer(),
  onKarte: (x, y, cx, cy, tol) => { if (window.Infrastruktur) window.Infrastruktur.zeige(x, y, cx, cy, tol); },
  onUeber: id => oeffneUeber(id),
  onReset: () => { if (G) K3.fokus(G.sz.x, G.sz.y, { dist: 40, phi: 0.88 }); else K3.uebersicht(); }
}));
if (!has3D) {
  stage.classList.add("flach");
  const box = h("div", "flachkarte"); box.innerHTML = `<img src="${$("#maptex").getAttribute("src")}" alt="Karte Musterstadt">`;
  stage.prepend(box);
}
const flach = {
  marken: [],
  punkt(x, y, html, cls, click) { const e = h(click ? "button" : "span", "fp " + (cls || ""), html); e.style.left = x + "%"; e.style.top = y + "%"; if (click) { e.type = "button"; e.addEventListener("click", click); } $(".flachkarte").appendChild(e); return e; }
};
function karteWachen() {
  const list = Object.values(WACHEN);
  if (has3D) return K3.wachen(list);
  list.forEach(w => flach.punkt(w.x, w.y, esc(w.art === "ff" ? w.nr : w.kurz), "w " + w.art, () => oeffneWache(w.id)));
}
let szAuswahl = null;
function karteSzenarien() {
  const gewaehlt = szAuswahl ? SZ.filter(s => s.id === szAuswahl) : [];
  if (has3D) { if (G) K3.einsatzstelle(G.sz, pinInfo); else K3.szenarien(gewaehlt, pinInfo); return; }
  document.querySelectorAll(".fp.sz").forEach(e => e.remove());
  (G ? [G.sz] : gewaehlt).forEach(sz => flach.punkt(sz.x, sz.y, esc(sz.titel), "sz" + (G ? " est" : ""), () => { if (!G) vorschau(sz.id); }));
}
function fzForm(def) {
  const t = [def.id, def.name, (def.typen || []).join(" ")].join(" ");
  const zug = /LZ|Löschzug|Löschgruppe/.test(t);
  if (def.art === "c" || /ELW 1|ELW1|C-Dienst|B-Dienst/.test(t) && !zug) return "elw";
  if (/NEF|KdoW|A-Dienst|LNA|OrgL|PKW|MTW/i.test(t) && !zug) return "pkw";
  if (/DLK|DLA|Drehleiter|TM \d/.test(t)) return "dlk";
  if (/RTW|KTW|ITW|BHP|BTP|MANV/.test(t) || def.art === "rd") return "rtw";
  if (/AB-|AB |WLF|Abroll/.test(t)) return "wlf";
  if (/ELW 2|ELW2|GW|MTF|LKW|Dekon|Mess|SEG|Betreuung/.test(t)) return "kasten";
  return "lf";
}
function marke(kls, text, x, y, def) {
  if (has3D) return K3.marke(kls, text, x, y, def ? fzForm(def) : null);
  const e = flach.punkt(x, y, text, "tk " + kls);
  return { setze(a, b) { e.style.left = a + "%"; e.style.top = b + "%"; }, parke(a, b) { e.style.left = a + "%"; e.style.top = b + "%"; }, weg() { e.remove(); } };
}
function wegLinie(von, nach, kls) { return has3D ? K3.weg(von, nach, kls) : { weg() {} }; }
function fokus(x, y, o) { if (has3D) K3.fokus(x, y, o); }
document.querySelectorAll("[data-cam]").forEach(b => b.addEventListener("click", () => {
  if (!has3D) return;
  const flat = K3.knopf(b.dataset.cam);
  if (b.dataset.cam === "tilt") b.textContent = flat ? "3D" : "2D";
}));

/* ───────── Toast ───────── */
let toastT = 0;
function toast(t) { const e = $("#toast"); e.textContent = t; e.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => e.classList.remove("show"), 2800); }

/* ───────── Drawer ───────── */
const drawer = $("#drawer");
function schliesseDrawer() { drawer.hidden = true; delete drawer.dataset.ue; if (has3D) { K3.markiereWache(null); K3.ueMarkiere(null); } }
function drawerAuf(html) { drawer.innerHTML = '<button class="x" type="button" aria-label="Schließen">✕</button>' + html; drawer.hidden = false; drawer.querySelector(".x").addEventListener("click", schliesseDrawer); drawer.scrollTop = 0; }
function statusVon(id) { if (!G) return null; const it = G.items.filter(i => i.def.id === id); if (!it.length) return null; return it.every(i => i.da) ? "da" : "an"; }
function anfZeile(def) {
  const st = statusVon(def.id), mehr = def.mehrfach;
  const it0 = G && G.items.find(i => i.def.id === def.id);
  const lbl = st && !mehr ? statusText(it0) : "Alarmieren";
  const dis = !G || (st && !mehr);
  return `<div class="anf"><span class="anf-n">${tzDef(def)}<span>${esc(def.name)}${def.info ? `<br><small class="note">${esc(def.info)}</small>` : ""}</span></span><span class="eta">${G ? "ca. " + eta(def) + " min" : ""}</span><button class="mini" type="button" data-anf="${def.id}" ${dis ? "disabled" : ""}>${lbl}</button></div>`;
}
function bindAnf(root) { root.querySelectorAll("[data-anf]").forEach(b => b.addEventListener("click", () => anfordern(b.dataset.anf))); }
let offeneWache = null;
function oeffneWache(id) {
  const w = WACHEN[id]; if (!w) return; offeneWache = id;
  if (has3D) K3.markiereWache(id);
  const art = { bf: "Berufsfeuerwehr", ff: "Freiwillige Feuerwehr", rd: "Rettungswache", thw: "Technisches Hilfswerk" }[w.art];
  let html = `<div class="eyebrow">${art} · ${w.art === "thw" ? "Ergänzung zur Lernunterlage" : "Wachbereich " + w.wb}</div><h2>${esc(w.name)}</h2><p class="note">${esc(w.rolle)}</p>`;
  if (G) html += `<div class="grp"><div class="grp-h"><b>Alarmieren</b><span class="str">Anfahrt zur Einsatzstelle</span></div>${w.anf.map(a => anfZeile(ANF[a.id])).join("")}</div>`;
  w.gruppen.forEach(g => {
    html += `<div class="grp"><div class="grp-h"><b>${esc(g.t)}</b><span class="str">${esc(g.tot || "")}</span></div>` +
      g.v.map(v => `<div class="veh"><span class="veh-z">${v[0] === "Einsatzeinheit" ? tz("Rettungswesen_Einheiten/Einsatzeinheit") : tzTyp(v[0], w.art === "thw" ? { thw: true } : undefined)}</span><span class="veh-n">${esc(v[0])}${v[2] ? `<small>${esc(v[2])}</small>` : ""}</span><span class="str">${esc(v[1] || "")}</span></div>`).join("") + "</div>";
  });
  if (w.ab.length) html += `<div class="grp"><div class="grp-h"><b>Abrollbehälter</b><span class="str">${w.ab.length}</span></div><div class="ab">${w.ab.map(a => `<span>${esc(a)}</span>`).join("")}</div></div>`;
  if (w.partner) html += `<p style="margin-top:12px"><button class="mini sec" type="button" id="partnerBtn">Partnereinheit ${w.partner} anzeigen</button></p>`;
  if (!G) html += `<p class="note" style="margin-top:12px">Im Einsatz werden hier die anforderbaren Einsatzmittel mit Fahrzeit angezeigt.</p>`;
  drawerAuf(html); bindAnf(drawer);
  const pb = drawer.querySelector("#partnerBtn"); if (pb) pb.addEventListener("click", () => oeffneWache("FF" + w.partner));
}
function oeffneUeber(id) {
  const u = MS.ueber.find(x => x.id === id); if (!u) return; offeneWache = null;
  if (has3D) { K3.markiereWache(null); K3.ueMarkiere(id); }
  const def = ANF[id], n = G ? G.items.filter(i => i.def.id === id).length : 0, st = MS.staerke[id];
  const seite = { n: "Norden", s: "Süden", w: "Westen", o: "Osten" }[u.rand || "o"];
  let html = `<div class="eyebrow">Überörtliche Hilfe · Anfahrt aus dem ${seite}</div><h2>${esc(u.name)}</h2><p class="note">${esc(u.info)}</p>
   <dl class="kv" style="margin-top:10px"><dt>Anfahrt</dt><dd>ca. ${u.eta} min ab Alarmierung</dd>${st ? `<dt>Stärke</dt><dd>${st[0] ? esc(st[0]) : (st[2] ? st[2] + " Funktionen" : "nicht angegeben")}</dd><dt>Fahrzeuge</dt><dd>${st[1] || ""}</dd>` : ""}<dt>Anforderung</dt><dd>${u.mehrfach ? "mehrfach möglich" : "einmalig"} über die Leitstelle</dd></dl>`;
  if (G) html += `<div class="actions"><button class="go" type="button" data-anf="${id}" ${n && !u.mehrfach ? "disabled" : ""}>${n ? (u.mehrfach ? "Weitere alarmieren (" + n + ")" : "alarmiert") : "Alarmieren"}</button></div>`;
  else html += `<p class="note">Im Einsatz kann die Einheit hier alarmiert werden.</p>`;
  drawerAuf(html); bindAnf(drawer); drawer.dataset.ue = id;
}
function vorschau(id, zufall) {
  const sz = SZ.find(s => s.id === id); const best = store.get("pms_best", {});
  szAuswahl = id; karteSzenarien(); if (!G) renderRail();
  drawerAuf(`<div class="eyebrow">${zufall ? "Zufallsszenario" : sz.beispiel ? "Beispielszenario" : sz.eigen ? "Eigene Lage" : sz.ordner ? "Lage aus Ablageordner" : "Szenario"} · ${esc(TYPEN[sz.typ] || "")}</div><h2>${esc(sz.titel)}</h2>
   <dl class="kv" style="margin-top:10px"><dt>Einsatzort</dt><dd>${esc(sz.ort.adresse)}<br><span class="note">${esc(sz.ort.detail)} · ${esc(sz.ort.wb)}</span></dd><dt>Alarmzeit</dt><dd>${esc(sz.zeit)}, ${esc(sz.t0)} Uhr</dd><dt>Stichwort</dt><dd>${esc(sz.stichwort)}</dd><dt>Wetter</dt><dd>${esc(sz.wetter)}</dd>${best[id] != null ? `<dt>Bestwert</dt><dd>${best[id]} %</dd>` : ""}</dl>
   <p class="note">Ablauf: Alarm, Übergabe, Erkundung mit Nachfragen, 4 Minuten Ausarbeitung, Rückfragen der Kommission, O-Ton in der Pressekonferenz.</p>
   <div class="actions"><button class="go" type="button" id="startBtn">Planbesprechung starten</button>${sz.eigen ? '<button class="alt" type="button" id="edBtn">Bearbeiten</button>' : '<button class="alt" type="button" id="edBtn">Als Vorlage kopieren</button>'}</div>`);
  drawer.querySelector("#startBtn").addEventListener("click", () => starte(id));
  drawer.querySelector("#edBtn").addEventListener("click", () => { schliesseDrawer(); sz.eigen ? window.Editor.bearbeiten(id) : window.Editor.vorlage(id); });
  fokus(sz.x, sz.y, { dist: 70, phi: 0.82 });
}

/* ───────── Szenarienliste und Zufall ───────── */
function oeffneListe() {
  const ov = $("#listeOv"); ov.hidden = false; renderListe();
  const q = $("#lq"); q.value = ""; setTimeout(() => q.focus(), 50);
}
let listeFilter = "alle";
function renderListe() {
  const q = ($("#lq").value || "").toLowerCase(); const best = store.get("pms_best", {});
  $("#lfilter").innerHTML = [["alle", "Alle"]].concat(Object.entries(TYPEN)).map(([k, v]) => `<button type="button" data-lf="${k}" aria-pressed="${listeFilter === k}">${esc(v)}</button>`).join("");
  $("#lfilter").querySelectorAll("[data-lf]").forEach(b => b.addEventListener("click", () => { listeFilter = b.dataset.lf; renderListe(); }));
  const list = SZ.filter(s => (listeFilter === "alle" || s.typ === listeFilter) && (!q || (s.titel + " " + s.ort.adresse + " " + s.stichwort + " " + s.ort.wb).toLowerCase().includes(q)));
  $("#lcount").textContent = list.length + " von " + SZ.length + " Szenarien";
  $("#lgrid").innerHTML = list.length ? list.map(s => `<article class="lcard"><div class="lc-top"><span class="ico">${ICONS[s.typ] || ""}</span><div><div class="eyebrow">${esc(TYPEN[s.typ] || "")}${s.beispiel ? " · Beispiel" : ""}${s.eigen ? " · Eigene Lage" : ""}${s.ordner ? " · Ablageordner" : ""}</div><h3>${esc(s.titel)}</h3></div>${best[s.id] != null ? `<span class="best">${best[s.id]} %</span>` : ""}</div>
    <dl class="kv"><dt>Einsatzort</dt><dd>${esc(s.ort.adresse)}</dd><dt>Bereich</dt><dd>${esc(s.ort.wb)}</dd><dt>Alarm</dt><dd>${esc(s.zeit)}, ${esc(s.t0)} Uhr</dd><dt>Stichwort</dt><dd>${esc(s.stichwort)}</dd></dl>
    <div class="actions"><button class="alt" type="button" data-lk="${s.id}">Auf der Karte</button><button class="go" type="button" data-ls="${s.id}">Starten</button></div>
    <div class="actions lc-ed">${s.eigen ? `<button class="mini sec" type="button" data-led="${s.id}">Bearbeiten</button><button class="mini sec" type="button" data-lex="${s.id}">Exportieren</button>` : `<button class="mini sec" type="button" data-lvo="${s.id}">Als Vorlage kopieren</button>`}</div></article>`).join("") : '<p class="note">Kein Szenario passt zur Suche.</p>';
  $("#lgrid").querySelectorAll("[data-ls]").forEach(b => b.addEventListener("click", () => { $("#listeOv").hidden = true; starte(b.dataset.ls); }));
  $("#lgrid").querySelectorAll("[data-lk]").forEach(b => b.addEventListener("click", () => { $("#listeOv").hidden = true; vorschau(b.dataset.lk); }));
  $("#lgrid").querySelectorAll("[data-led]").forEach(b => b.addEventListener("click", () => window.Editor.bearbeiten(b.dataset.led)));
  $("#lgrid").querySelectorAll("[data-lex]").forEach(b => b.addEventListener("click", () => window.Editor.exportiere([b.dataset.lex])));
  $("#lgrid").querySelectorAll("[data-lvo]").forEach(b => b.addEventListener("click", () => window.Editor.vorlage(b.dataset.lvo)));
  if (window.Ordner) window.Ordner.zeigeStatus();
  const eig = SZ.filter(s => s.eigen).length; $("#lExport").disabled = !eig; $("#lExport").textContent = "Eigene exportieren" + (eig ? " (" + eig + ")" : "");
}
$("#lq").addEventListener("input", renderListe);
$("#listeClose").addEventListener("click", () => { $("#listeOv").hidden = true; });
$("#btnListe").addEventListener("click", oeffneListe);
let losLaeuft = false;
function zufall() {
  if (losLaeuft) return;
  if (G) beende();
  const last = store.get("pms_last", null);
  const pool = SZ.length > 1 ? SZ.filter(s => s.id !== last) : SZ;
  const ziel = pool[Math.floor(Math.random() * pool.length)];
  schliesseDrawer(); losLaeuft = true; toast("Szenario wird ausgelost");
  let n = 0; const ids = SZ.map(s => s.id);
  const tick = () => {
    n++;
    const id = n < 12 ? ids[n % ids.length] : ziel.id;
    szAuswahl = id; karteSzenarien(); renderRail();
    if (n < 12) setTimeout(tick, 90 + n * 14);
    else { toast("Ausgelost: " + ziel.titel); setTimeout(() => { losLaeuft = false; starte(ziel.id, true); }, 900); }
  };
  if (has3D) K3.uebersicht(0.8);
  setTimeout(tick, 300);
}
$("#btnZufall").addEventListener("click", zufall);

/* ───────── Leiste rechts: alle alarmierbaren Einheiten ───────── */
const RD_ID = /^(RTW|NEF|LNA|ITW|SEG|EE|ELW2RD)/;
let railSuche = "", railOffen = new Set(["stich"]);
function railGruppen() {
  const bf = [], rd = [], ff = [], pk = [];
  ["FRW1", "FRW2", "FRW3", "RW4", "RW5"].forEach(wid => WACHEN[wid].anf.forEach(a => { const d = ANF[a.id]; (RD_ID.test(a.id) || WACHEN[wid].art === "rd" ? rd : bf).push({ d, ort: WACHEN[wid].kurz }); }));
  MS.ff.forEach(f => { const w = WACHEN["FF" + f[0]]; w.anf.forEach(a => { const d = ANF[a.id]; (d.pk ? pk : ff).push({ d, ort: w.kurz }); }); });
  Object.keys(MS.manv).forEach(k => pk.push({ d: ANF[k], ort: "Stichwort" }));
  const thw = MS.thw ? MS.thw.anf.map(a => ({ d: ANF[a.id], ort: "THW OV" })) : [];
  MS.ueber.filter(u => u.thw).forEach(u => thw.push({ d: ANF[u.id], ort: "überörtlich" }));
  return [
    { id: "bf", titel: "Berufsfeuerwehr", rows: bf },
    { id: "ff", titel: "Freiwillige Feuerwehr", rows: ff },
    { id: "pk", titel: "Sonderkomponenten und MANV", rows: pk },
    { id: "rd", titel: "Rettungsdienst und Hilfsorganisationen", rows: rd },
    { id: "thw", titel: "Technisches Hilfswerk", rows: thw },
    { id: "ue", titel: "Überörtliche Einheiten", rows: MS.ueber.filter(u => !u.thw).map(u => ({ d: ANF[u.id], ort: { san: "Sanitätsdienst", abc: "ABC-Schutz", fw: "Feuerwehr" }[u.kat] || "überörtlich" })) },
    { id: "ext", titel: "Externe Stellen", rows: MS.extern.map(e => ({ d: ANF[e.id], ort: "" })) }
  ];
}
function railZeile(r) {
  const d = r.d, n = G ? G.items.filter(i => i.def.id === d.id).length : 0;
  const da = G && n && G.items.filter(i => i.def.id === d.id).every(i => i.da);
  const ext = d.art === "ext", aktiv = ext ? G && G.keys.has(d.id) : n > 0;
  let rechts;
  const it0 = G && G.items.find(i => i.def.id === d.id);
  if (!G) rechts = `<span class="er-eta">${ext ? "" : esc(r.ort)}</span>`;
  else if (ext) rechts = aktiv ? '<span class="er-st ok">informiert</span>' : `<button class="mini" type="button" data-ext="${d.id}">Informieren</button>`;
  else if (aktiv && !d.mehrfach) rechts = `<span class="er-st ${da ? "ok" : ""}">${statusText(it0)}</span>`;
  else rechts = `<button class="mini" type="button" data-anf="${d.id}">${n ? "+1 (" + n + ")" : "Alarmieren"}</button>`;
  return `<div class="er ${aktiv ? "aktiv" : ""}" title="${esc(d.info || "")}"><span class="er-z">${tzDef(d)}</span><span class="er-n">${esc(d.name.replace(" komplett", ""))}${G && !ext ? `<small>${esc(r.ort)}</small>` : ""}</span>${rechts}</div>`;
}
function renderRail() {
  const R = $("#rail"), scroll = R.scrollTop; let html = "";
  if (!G) html += `<h3>Szenarien <span class="rc">${SZ.length}</span></h3><p class="note" style="margin:-4px 0 8px">Szenario antippen, um den Einsatzort auf der Karte zu sehen.</p><div class="rlagen"><button type="button" class="mini" data-rneu>Neue Lage</button><button type="button" class="mini sec" data-rimp>Importieren</button></div>` + SZ.map(s => `<button class="szitem ${s.id === szAuswahl ? "on" : ""} ${s.eigen ? "eigen" : ""}" type="button" data-sz="${s.id}"><b>${esc(s.titel)}${s.eigen ? ' <small class="eig">eigene Lage</small>' : ""}</b><span>${esc(s.ort.adresse)}</span><em>${esc(s.zeit)} ${esc(s.t0)} · ${esc(s.stichwort)}</em></button>`).join("");
  html += `<h3>Alarmierbare Einheiten</h3><input class="rsuche" id="railSuche" type="search" placeholder="Einheit oder Fahrzeug suchen" value="${esc(railSuche)}" autocomplete="off" aria-label="Einheiten durchsuchen">`;
  if (G) html += `<div class="rstich-h">Stichworte</div>${stichHTML()}`;
  const q = railSuche.toLowerCase();
  railGruppen().forEach(g => {
    const rows = g.rows.filter(r => !q || (r.d.name + " " + r.ort + " " + (r.d.typen || []).join(" ") + " " + (r.d.info || "")).toLowerCase().includes(q));
    if (!rows.length) return;
    const akt = G ? rows.filter(r => r.d.art === "ext" ? G.keys.has(r.d.id) : G.items.some(i => i.def.id === r.d.id)).length : 0;
    html += `<details class="rgrp" data-g="${g.id}" ${q || railOffen.has(g.id) ? "open" : ""}><summary><span>${esc(g.titel)}</span><span class="rc">${akt ? akt + " / " : ""}${rows.length}</span></summary>${rows.map(railZeile).join("")}</details>`;
  });
  html += `<p class="quelle">${TZ_QUELLE}</p>`;
  R.innerHTML = html; R.scrollTop = scroll;
  R.querySelectorAll("details.rgrp").forEach(d => d.addEventListener("toggle", () => { if (!railSuche) d.open ? railOffen.add(d.dataset.g) : railOffen.delete(d.dataset.g); }));
  const rs = R.querySelector("#railSuche"); rs.addEventListener("input", () => { railSuche = rs.value; renderRail(); const n = $("#railSuche"); n.focus(); n.setSelectionRange(n.value.length, n.value.length); });
  R.querySelectorAll("[data-sz]").forEach(b => b.addEventListener("click", () => vorschau(b.dataset.sz)));
  R.querySelectorAll("[data-rneu]").forEach(b => b.addEventListener("click", () => window.Editor.neu()));
  R.querySelectorAll("[data-rimp]").forEach(b => b.addEventListener("click", () => window.Editor.importDialog()));
  R.querySelectorAll("[data-anf]").forEach(b => b.addEventListener("click", () => anfordern(b.dataset.anf)));
  R.querySelectorAll("[data-ext]").forEach(b => b.addEventListener("click", () => anfordern(b.dataset.ext)));
  R.querySelectorAll("[data-lz]").forEach(b => b.addEventListener("click", plusLZ));
}

/* ───────── Anfordern ───────── */
function klasse(def) { return def.art === "thw" || def.thw ? "thw" : def.art === "c" ? "c" : def.art === "ue" ? ({ san: "rd", abc: "abc", fw: "fw", thw: "thw" }[def.kat] || "ue") : def.art === "rd" ? "rd" : def.art === "pk" ? "pk" : "fw"; }
function anfordern(id, initial) {
  if (!G) return;
  const def = ANF[id]; if (!def) return;
  if (!def.mehrfach && G.items.some(i => i.def.id === id)) return;
  const nach = !!G.abgabe && !initial;
  if (def.art === "ext") {
    G.keys.add(id); G.log.push({ t: G.t, txt: (initial ? "Informiert: " : "Benachrichtigung: ") + def.name, done: true, prio: false, nach });
    if (!initial) toast(def.name + " informiert" + (nach ? " (nach Abgabe)" : ""));
    refresh(); return;
  }
  const ziel = zielVon(def), von = quelle(def, ziel), e = eta(def, ziel);
  const it = { uid: ++G.uid, def, von, ziel, start: G.t, eta: e, arr: G.t + e, da: false, initial: !!initial, nach };
  G.items.push(it);
  [def.id].concat(def.keys || []).forEach(k => G.keys.add(k));
  // Keine Dynamik: Fahrzeuge erscheinen nur, wenn sie zur Übergabe bereits vor Ort sind (lageFestlegen).
  if (def.art !== "c") G.log.push({ t: G.t, txt: (initial ? "Alarmierung: " : "Nachforderung: ") + def.name, done: false, prio: !initial, uid: it.uid, nach });
  if (!initial && def.art !== "c") toast(def.name + " alarmiert, Anfahrt ca. " + e + " min" + (nach ? " (nach Abgabe)" : ""));
  refresh();
  return it;
}
function plusLZ() {
  const kand = Object.values(ANF).filter(d => d.lz > 0 && !d.pk && !G.items.some(i => i.def.id === d.id) && d.art !== "ue");
  if (!kand.length) { toast("Kein freier Löschzug verfügbar"); return; }
  const z = { x: G.sz.x, y: G.sz.y };
  kand.sort((a, b) => eta(a, z) - eta(b, z));
  const d = kand[0]; anfordern(d.id);
  const w = WACHEN[d.wache]; if (w && w.partner && !G.items.some(i => i.def.id === "FF" + w.partner)) anfordern("FF" + w.partner);
}

/* ───────── Takt ───────── */
let uiAcc = 0;
function slot(k) { const a = k * 2.39996, r = 1.5 + 0.5 * Math.sqrt(k); return { x: Math.cos(a) * r, y: Math.sin(a) * r * 0.85 }; }
function update(dt) {
  if (!G) return;
  // Keine Spieldynamik: Die Lage wird beim Start festgelegt (lageFestlegen) und ändert sich nicht mehr.
  const changed = false;
  // Countdown der Ausarbeitung (Echtzeit)
  if (G.cd.start && !G.abgabe) {
    const rest = G.cd.dauer - (performance.now() - G.cd.start) / 1000;
    if (rest <= 0 && G.cd.strikt) abgeben(true);
    else cdUI(rest);
  }
  if (G.presseStart) { const r = G.sz.presse.sekunden - (performance.now() - G.presseStart) / 1000; const e = $("#ptimer"); if (e) { e.textContent = r > 0 ? mmss(r) : "Zeit um"; e.classList.toggle("warn", r < 10); } if (r <= -1) G.presseStart = null; }
  uiAcc += dt;
  if (changed || uiAcc > 0.5) { uiAcc = 0; uhrUI(); if (changed) refreshLight(); }
}
// Eigener Takt unabhängig von der 3D-Darstellung, deren Renderschleife bei Arbeitstafel, Stadtkarte und Overlays pausiert
setInterval(() => update(0.25), 250);
// Lage zum Zeitpunkt der Übergabe: Kräfte mit Eintreffzeit bis zur Übergabe stehen vor Ort, alle anderen bleiben auf Anfahrt.
function lageFestlegen(t) {
  G.t = t; let k = 0;
  G.items.forEach(it => {
    if (it.arr > t) return;
    it.da = true;
    const kls = klasse(it.def), mk = marke(kls, tzDef(it.def, { cls: "tzm" }) + "<span>" + esc(kurz(it.def).slice(0, 16)) + "</span>", it.ziel.x, it.ziel.y, it.def);
    const sl = it.def.ziel ? { x: 0.8, y: 0.6 } : slot(k++);
    mk.setze(it.ziel.x + sl.x + 0.01, it.ziel.y + sl.y); mk.parke(it.ziel.x + sl.x, it.ziel.y + sl.y); it.mk = mk;
    const lg = G.log.find(l => l.uid === it.uid); if (lg) { lg.done = true; lg.tan = it.arr; }
  });
}
function mmss(s) { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
function cdUI(rest) {
  const txt = rest > 0 ? mmss(rest) : "+" + mmss(-rest);
  const a = $("#cd"); if (a) { a.textContent = txt; a.classList.toggle("warn", rest < 30); }
  const b = $("#cdBar"); if (b) { b.textContent = txt; b.classList.toggle("warn", rest < 30); }
}

/* ───────── KI-Rollen (optional, nur im Claude-Viewer) ───────── */
let SAMPLE = null;
(async () => { try { if (window.claude && typeof window.claude.use === "function") SAMPLE = await window.claude.use("sample"); } catch (e) { SAMPLE = null; } if (G && G.step >= 2) renderAkte(); })();
async function ki(input, out, tier) {
  if (!SAMPLE) return null;
  out.textContent = "Überlegt …"; out.classList.add("denkt");
  try {
    const r = await SAMPLE(input, { cache: false, modelTier: tier || "default", onText: ({ text }) => { out.classList.remove("denkt"); out.textContent = text; } });
    out.classList.remove("denkt"); return r.text;
  } catch (e) {
    out.classList.remove("denkt");
    if (["not_granted", "sampling_disabled", "not_declared", "capability_disabled", "capability_removed"].includes(e.code)) { SAMPLE = null; out.textContent = "Die KI-Funktion ist in dieser Ansicht nicht verfügbar. Es werden die hinterlegten Inhalte genutzt."; }
    else if (e.code === "rate_limited") out.textContent = "Gerade zu viele Anfragen. Bitte später erneut versuchen.";
    else if (e.code === "cancelled") out.textContent = e.text || "";
    else out.textContent = e.text || "Die Anfrage ist fehlgeschlagen. Bitte erneut versuchen.";
    return null;
  }
}
const STIL = "Schreibe auf Deutsch, sachlich, ohne Semikolons und ohne Gedankenstriche.";
function lageDaten() {
  const sz = G.sz;
  return JSON.stringify({ einsatzort: sz.ort, zeit: sz.zeit + " " + sz.t0, wetter: sz.wetter, stichwort: sz.stichwort, meldung: sz.meldung, uebergabe: sz.uebergabe.text, unterlagen: sz.info, bekannteAntworten: sz.nachfragen.map(n => ({ frage: n.f, antwort: n.a })) });
}
function loesungText() {
  return "Führungsorganisation: " + (antwortVon({ typ: "abschnitte" }).split("\n").join(" | ")) +
    "\nWeitere Maßnahmen: " + (G.ans.massnahmen || "keine Angabe") + "\nLagemeldung: " + (G.ans.lage || "keine Angabe") +
    "\nNachalarmierung: " + (G.items.filter(i => !i.initial && !i.nach && i.def.art !== "c").map(i => i.def.name).concat(G.log.filter(l => /^Benachrichtigung/.test(l.txt) && !l.nach).map(l => l.txt.replace("Benachrichtigung: ", ""))).join(", ") || "keine");
}

/* ───────── Einsatzablauf ───────── */
const STEPS = ["Alarm", "Übergabe", "Erkundung", "Ausarbeitung", "Kommission", "Pressekonferenz", "Auswertung"];
function starte(id, zufallsStart) {
  schliesseDrawer(); $("#listeOv").hidden = true;
  if (G) { G.items.forEach(i => { i.mk && i.mk.weg(); i.ln && i.ln.weg(); }); }
  const sz = SZ.find(s => s.id === id); store.set("pms_last", id);
  G = neuerZustand(sz); G.zufall = !!zufallsStart;
  $("#app").dataset.mode = "einsatz"; $("#akte").hidden = false; $("#akte").classList.remove("zu");
  sz.alarmiert.forEach(a => anfordern(a, true));
  G.log.forEach(l => { l.t = 0; });
  G.t = sz.cAlarm; G.cItem = anfordern("CDIENST", true);
  lageFestlegen(G.cItem.arr); G.eingetroffen = true;
  G.log.push({ t: G.t, txt: "Übernahme der Einsatzleitung durch C-Dienst", done: true, prio: false });
  karteSzenarien(); if (has3D) K3.dimmeWachen(true);
  if (window.Lagezeichnen) window.Lagezeichnen.neu();
  if (window.Ansicht) window.Ansicht.setze("3d");
  renderRail(); renderBar(); renderAkte();
  if (has3D) { K3.uebersicht(0.7); setTimeout(() => { if (G && G.sz === sz) K3.fokus(sz.x, sz.y, { dist: 42, phi: 0.86, dauer: 2.2 }); }, 750); }
  toast("Alarm: " + sz.stichwort);
}
function beende() {
  if (G) G.items.forEach(i => { i.mk && i.mk.weg(); i.ln && i.ln.weg(); });
  G = null; szAuswahl = null;
  $("#app").dataset.mode = "frei"; $("#app").dataset.breit = ""; $("#akte").hidden = true;
  schliesseDrawer(); karteSzenarien(); ueSync(); if (has3D) { K3.dimmeWachen(false); K3.uebersicht(1.2); }
  if (window.Ansicht) window.Ansicht.setze("3d");
  renderRail(); renderBar();
}
$("#btnEnde").addEventListener("click", beende);
function geheZu(n) {
  G.step = n; G.maxStep = Math.max(G.maxStep, n); renderAkte(); $("#akteBody").scrollTop = 0; renderBar();
  // Ab der Übernahme der Einsatzleitung steht die Lagekarte im Mittelpunkt, die 3D-Karte bleibt umschaltbar
  if (n >= 1 && !G.lageAuto && window.Ansicht) { G.lageAuto = true; window.Ansicht.setze("tafel"); }
}

function renderBar() {
  const B = $("#barMid");
  $("#btnTafel").hidden = !G; $("#btnEnde").hidden = !G; $("#btnListe").hidden = !!G; $("#btnZufall").hidden = !!G;
  if (!G) { B.innerHTML = '<span class="note">Szenario wählen oder auslosen, um die Planbesprechung zu starten</span>'; return; }
  const cd = G.cd.start && !G.abgabe ? `<span class="cdchip" id="cdBar">${mmss(G.cd.dauer)}</span>` : G.abgabe ? '<span class="cdchip ab">abgegeben</span>' : "";
  B.innerHTML = `<span class="clock" id="clk">${uhr(G.t)}</span><span class="note" id="clk2">${G.eingetroffen ? "Lage bei Übergabe" : "Alarmierung C-Dienst"}</span>${cd}`;
}
function uhrUI() { const c = $("#clk"); if (c && G) c.textContent = uhr(G.t); }
function ueSync() { if (has3D) MS.ueber.forEach(u => K3.ueStatus(u.id, G ? G.items.filter(i => i.def.id === u.id).length : 0)); }
function refresh() { if (!G) return; renderRail(); ueSync(); if (!drawer.hidden && offeneWache && drawer.querySelector(".anf")) oeffneWache(offeneWache); else if (!drawer.hidden && drawer.dataset.ue) oeffneUeber(drawer.dataset.ue); refreshLight(); }
function refreshLight() {
  if (!G) return;
  const k = $("#kraefte"); if (k) k.innerHTML = kraefteListe();
  const n = $("#nachfListe"); if (n) n.innerHTML = nachfListe();
  if (tafelOffen()) renderTafel();
}
function statusText(i) { return i.da ? "vor Ort" : i.initial ? "auf Anfahrt" : "alarmiert"; }
function kraefteListe() {
  const its = G.items.filter(i => i.def.art !== "c" && i.initial);
  if (!its.length) return '<p class="note">Keine Kräfte</p>';
  return its.map(i => `<div class="krow ${i.da ? "an" : ""}"><span>${esc(i.def.name)}${i.def.ziel ? " (Wache)" : ""}</span><span class="s">${statusText(i)}</span></div>`).join("");
}
function nachfListe() {
  const its = G.items.filter(i => !i.initial);
  const ext = G.log.filter(l => /^Benachrichtigung/.test(l.txt));
  if (!its.length && !ext.length) return '<p class="note">Noch keine Nachalarmierung</p>';
  return its.map(i => `<div class="krow ${i.da ? "an" : ""}"><span>${esc(i.def.name)}${i.nach ? ' <small class="note">nach Abgabe</small>' : ""}</span><span class="s">alarmiert</span></div>`).join("") +
    ext.map(l => `<div class="krow an"><span>${esc(l.txt.replace("Benachrichtigung: ", ""))}${l.nach ? ' <small class="note">nach Abgabe</small>' : ""}</span><span class="s">informiert</span></div>`).join("");
}

/* ───────── Einsatzakte ───────── */
function renderAkte() {
  if (G) { const l = orgaGesperrt(); if (G._orgaLock !== l) { G._orgaLock = l; if (tafelOffen()) setTimeout(() => { if (G && tafelOffen()) renderTafel(); }, 0); } }
  const sz = G.sz;
  $("#akteHead").innerHTML = `<div class="eyebrow">${G.zufall ? "Zufallsszenario" : sz.beispiel ? "Beispielszenario" : "Szenario"} · ${esc(sz.zeit)} ${esc(sz.t0)} Uhr</div><h2>${esc(sz.titel)}</h2><div class="meta">${esc(sz.ort.adresse)} · ${esc(sz.stichwort)}</div>`;
  $("#steps").innerHTML = STEPS.map((s, i) => `<button type="button" data-st="${i}" ${i === G.step ? 'aria-current="step"' : ""} class="${i < G.maxStep ? "ok" : ""}" ${i > G.maxStep ? "disabled" : ""}>${i + 1} ${esc(s)}</button>`).join("");
  $("#steps").querySelectorAll("[data-st]").forEach(b => b.addEventListener("click", () => geheZu(+b.dataset.st)));
  const cur = $("#steps [aria-current]"); if (cur) cur.scrollIntoView({ block: "nearest", inline: "center" });
  const B = $("#akteBody");
  B.innerHTML = [stepAlarm, stepUebergabe, stepErkundung, stepAusarbeitung, stepKommission, stepPresse, stepAuswertung][G.step]();
  $("#app").dataset.breit = "";
  bindAkte();
}
/* Einsatzdepesche der Leitstelle für den C-Dienst (Alarmausdruck) */
function planquadrat(x, y) { return "ABCDEFGHIJKL"[Math.max(0, Math.min(11, Math.floor(x / 100 * 12)))] + " " + (Math.max(0, Math.min(13, Math.floor(y / 100 * 14))) + 1); }
function depKarte(x, y) {
  if (!window.KARTE_SVG) return "";
  const w = 388 * 0.125, h = w * 0.62, cx = 54 + x / 100 * 388, cy = 156 + y / 100 * 462;
  const kopf = window.KARTE_SVG.match(/^<svg[^>]*>/)[0].replace(/width="[^"]*"/, 'width="620"').replace(/height="[^"]*"/, 'height="384"').replace(/viewBox="[^"]*"/, `viewBox="${(cx - w / 2).toFixed(2)} ${(cy - h / 2).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)}"`);
  const src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(kopf + window.KARTE_SVG.slice(window.KARTE_SVG.indexOf(">") + 1));
  return `<div class="dep-karte"><img src="${src}" alt="Kartenausschnitt Einsatzort"><span class="dep-ziel"></span><span class="dep-nord">N</span><span class="dep-mass"><i></i><em>500 m</em></span></div>`;
}
function depescheHTML(sz) {
  const d = new Date(sz.datum + "T12:00:00"), dat = d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  const nr = sz.datum.replace(/-/g, "").slice(2) + "-" + sz.t0.replace(":", "") + "-" + String((sz.id.length * 37 + sz.titel.length * 11) % 900 + 100);
  const zeile = (k, v, cls) => `<tr class="${cls || ""}"><th>${k}</th><td>${v}</td></tr>`;
  const einheiten = G.items.filter(i => i.initial || i.def.art === "c").map(i => {
    const d0 = i.def, w = WACHEN[d0.wache];
    const ort = d0.art === "ext" ? "Information" : d0.art === "ue" ? "überörtlich" : w ? w.kurz : "";
    const t = d0.art === "c" ? sz.cAlarm : 0;
    return `<tr${d0.art === "c" ? ' class="dep-c"' : ""}><td>${esc(d0.name)}</td><td>${esc(ort)}</td><td>${uhr(t)}</td></tr>`;
  }).join("");
  return `<article class="depesche" aria-label="Einsatzdepesche">
    <header><div><b>Leitstelle Musterstadt</b><small>Feuerwehr und Rettungsdienst</small></div><div class="dep-titel">Einsatzdepesche<small>Nr. ${esc(nr)}</small></div></header>
    <div class="dep-alarm"><span>Alarmierung C-Dienst</span><span>${esc(sz.zeit)}, ${dat} · ${uhr(sz.cAlarm)} Uhr</span><span>DTG ${dtg(sz.cAlarm)}</span></div>
    <div class="dep-stich">${esc(sz.stichwort)}</div>
    <table class="dep-tab">
      ${zeile("Einsatzort", `<b>${esc(sz.ort.adresse)}</b>`)}
      ${zeile("Lage", esc(sz.ort.detail))}
      ${zeile("Wachbezirk", esc(sz.ort.wb))}
      ${zeile("Planquadrat", esc(planquadrat(sz.x, sz.y)) + " · Karte Musterstadt")}
      ${zeile("Meldender", esc(sz.meldender))}
      ${zeile("Eingang", esc(sz.t0) + " Uhr")}
      ${zeile("Wetter", esc(sz.wetter))}
    </table>
    <div class="dep-h">Sachverhalt</div><p class="dep-text">${esc(sz.meldung)}</p>
    <div class="dep-h">Alarmierte Einsatzmittel</div>
    <table class="dep-em"><thead><tr><th>Einsatzmittel</th><th>Standort</th><th>Alarm</th></tr></thead><tbody>${einheiten}</tbody></table>
    <div class="dep-h">Lageplan</div>${depKarte(sz.x, sz.y)}
    <footer><span>Ausdruck ${uhr(sz.cAlarm)} Uhr</span><span>Rückmeldung über Leitstelle Musterstadt</span><span>Seite 1/1</span></footer>
  </article>`;
}
function stepAlarm() {
  const sz = G.sz;
  let x = depescheHTML(sz);
  x += `<div class="actions"><button class="go" type="button" data-go="1">Zur Übergabe</button><button class="alt" type="button" data-fokus>Einsatzstelle zeigen</button></div>`;
  return x;
}
function infoBlocks() { return G.sz.info.map(b => `<div class="block"><h4>${esc(b.titel)}</h4>${b.titel === "Gefahrstoff" ? warnTafelHTML() : ""}<dl class="kv">${b.zeilen.map(z => `<dt>${esc(z[0])}</dt><dd>${esc(z[1])}</dd>`).join("")}</dl></div>`).join(""); }
function warnTafelHTML() { const w = G.sz.lagekarte.find(i => i.t === "warn"); return w ? `<div style="margin-bottom:8px"><span class="warntafel"><span>${esc(w.oben)}</span><span>${esc(w.unten)}</span></span></div>` : ""; }
function unterlagen(offen) {
  return `<details class="block" ${offen ? "open" : ""}><summary>Unterlagen: Lagekarte, ${esc(G.sz.info.map(b => b.titel).join(", "))}</summary><div style="background:#fff;border-radius:6px;overflow:hidden;margin-top:8px">${svgLage(G.sz, true)}</div><div class="actions"><button class="go" type="button" data-lzopen>Lagekarte ergänzen</button><button class="alt" type="button" data-tafel>Taktische Arbeitstafel öffnen</button></div>${infoBlocks()}<div class="block"><h4>Originalunterlagen (PDF)</h4><div class="dok-links"><button class="alt" type="button" data-doc="lernunterlage" data-seite="25">Karte Musterstadt</button><button class="alt" type="button" data-doc="lernunterlage" data-seite="26">Fahrzeugübersicht</button><button class="alt" type="button" data-doc="lernunterlage" data-seite="14">AAO</button><button class="alt" type="button" data-doc="lernunterlage" data-seite="3">Lernunterlage gesamt</button><button class="alt" type="button" data-doc="tafel">Arbeitstafel (Vorlage)</button></div></div></details>`;
}
function stepUebergabe() {
  const u = G.sz.uebergabe;
  return `<div class="funk quote"><span class="von">Übergabe · ${esc(u.von)} · ${dtg(G.cItem ? G.cItem.arr : G.t)}</span>${u.text.map(p => `<p>${esc(p)}</p>`).join("")}</div>
  <p class="hint">Die Lagekarte wird unvollständig übergeben. Offene Punkte sind mit Fragezeichen markiert.</p>
  ${unterlagen(true)}
  <div class="block"><h4>Kräfte</h4><div id="kraefte">${kraefteListe()}</div></div>
  <div class="actions"><button class="go" type="button" data-go="2">Zur Erkundung</button></div>`;
}
function passend(text) {
  const w = s => s.toLowerCase().replace(/[^a-zäöüß0-9 ]/g, " ").split(/\s+/).filter(x => x.length > 3);
  const q = new Set(w(text)); let best = -1, bs = 0;
  G.sz.nachfragen.forEach((n, i) => { const s = w(n.f).filter(x => q.has(x)).length * 2 + w(n.a).filter(x => q.has(x)).length; if (s > bs) { bs = s; best = i; } });
  return bs >= 3 ? best : -1;
}
function stepErkundung() {
  const sz = G.sz, gefragt = new Set(G.fragen.filter(f => f.i != null).map(f => f.i));
  return `<p class="hint" style="margin-top:0">Erkunden Sie die Einsatzstelle und stellen Sie dem Zugführer Ihre Nachfragen. Jede Nachfrage wird auf der Arbeitstafel protokolliert. Die Ausarbeitung beginnt erst, wenn Sie sie starten.</p>
  <div class="dialog" id="dialog">${G.fragen.length ? G.fragen.map((f, k) => `<div class="q"><span>Verbandsführer</span>${esc(f.f)}</div><div class="a" ${f.ki && !f.a ? `id="kiA${k}"` : ""}><span>${esc(sz.uebergabe.von.split(",")[0])}</span>${esc(f.a || "")}</div>`).join("") : '<p class="note">Noch keine Nachfragen gestellt.</p>'}</div>
  <div class="block"><h4>Nachfrage stellen</h4>
   <div class="fragen">${sz.nachfragen.map((n, i) => gefragt.has(i) ? "" : `<button type="button" data-fr="${i}">${esc(n.f)}</button>`).join("")}</div>
   <div class="eigen"><input id="eigeneFrage" type="text" placeholder="Eigene Nachfrage formulieren" autocomplete="off" aria-label="Eigene Nachfrage"><button class="alt" type="button" id="frageBtn">Fragen</button></div>
   <p class="hint">${SAMPLE ? "Eigene Nachfragen beantwortet der Zugführer auf Basis der Lage." : "Eigene Nachfragen werden den hinterlegten Erkenntnissen zugeordnet."}</p></div>
  <div class="actions"><button class="alt" type="button" data-fokus>Einsatzstelle auf der Karte</button></div>
  ${unterlagen(false)}
  <div class="actions"><button class="go" type="button" data-go="3">Zur Ausarbeitung</button></div>`;
}
async function frage(text, idx) {
  const sz = G.sz;
  if (idx == null) idx = passend(text);
  if (idx >= 0 && !SAMPLE) { G.fragen.push({ f: text, a: sz.nachfragen[idx].a, i: idx, t: G.t }); }
  else if (idx >= 0 && text === sz.nachfragen[idx].f) { G.fragen.push({ f: text, a: sz.nachfragen[idx].a, i: idx, t: G.t }); }
  else if (SAMPLE) {
    const f = { f: text, a: "", ki: true, i: idx >= 0 ? idx : null, t: G.t }; G.fragen.push(f); renderAkte();
    const el = $("#kiA" + (G.fragen.length - 1)); const span = el.querySelector("span"); const body = document.createElement("i"); body.className = "kitext"; el.appendChild(body);
    const prompt = `Du spielst im Planspiel einer Feuerwehr-Planbesprechung den ${sz.uebergabe.von} an der Einsatzstelle. Der Verbandsführer (C-Dienst) hat gerade übernommen und stellt dir eine Nachfrage. Antworte in direkter Rede als Zugführer, knapp in höchstens drei Sätzen, wie bei einer Übergabe an der Einsatzstelle. Nutze ausschließlich die Lagedaten unten. Ist eine Information dort nicht enthalten, sage, dass sie noch nicht bekannt ist oder erkundet werden muss. Erfinde keine neuen Verletzten, Gefahrstoffe, Brandstellen oder Lageänderungen. Gib keine taktischen Empfehlungen, die Entscheidung trifft der Verbandsführer. ${STIL}\n\nLagedaten:\n${lageDaten()}\n\nNachfrage des Verbandsführers: ${text}`;
    const a = await ki(prompt, body, "quick");
    f.a = a || body.textContent;
  } else {
    G.fragen.push({ f: text, a: "Dazu liegen mir noch keine Erkenntnisse vor. Das müsste erkundet werden.", i: null, t: G.t });
  }
  G.log.push({ t: G.t, txt: "Nachfrage: " + text, done: true, prio: false });
  renderAkte();
  const d = $("#dialog"); if (d) d.lastElementChild && d.lastElementChild.scrollIntoView({ block: "nearest" });
}
function stepAusarbeitung() {
  const sz = G.sz; const lock = !!G.abgabe;
  let x = "";
  if (!G.cd.start) {
    x += `<div class="block cdintro"><h4>Ausarbeitung</h4><p style="margin:0 0 8px">Sie haben <b>4 Minuten</b> Zeit für:</p><ol class="olist">${sz.ausarbeitung.map(a => `<li>${esc(a.titel)}</li>`).join("")}</ol>
      <label class="krit" style="border:0"><input type="checkbox" id="strikt" ${G.cd.strikt ? "checked" : ""}><span>Zeitlimit wie in der Prüfung (nach Ablauf wird gesperrt)</span></label></div>
      <div class="actions"><button class="go" type="button" id="cdStart">4 Minuten starten</button><button class="alt" type="button" data-go="2">Zurück zur Erkundung</button></div>`;
    return x;
  }
  x += `<div class="cdbox ${lock ? "ab" : ""}"><span>Ausarbeitungszeit</span><b id="cd">${lock ? "abgegeben" : mmss(G.cd.dauer)}</b>${lock ? `<small>nach ${mmss(G.abgabe.dauer)} Minuten</small>` : `<button class="alt" type="button" id="abgabeBtn">Abgeben</button>`}</div>`;
  sz.ausarbeitung.forEach((a, i) => {
    x += `<section class="block ab-${a.typ}"><h4>${i + 1}. ${esc(a.titel)}</h4><p class="task-q">${esc(a.frage)}</p>`;
    if (a.typ === "abschnitte") x += `<p class="hint">Die Führungsorganisation wird direkt in der Taktischen Arbeitstafel eingetragen.</p><div id="orgaKurz">${orgaKurz()}</div><div class="actions"><button class="go" type="button" data-zurtafel>Zur Arbeitstafel</button></div>`;
    if (a.typ === "text") x += `<textarea id="ta-${a.id}" ${lock ? "readonly" : ""} placeholder="Stichpunkte">${esc(G.ans[a.id] || "")}</textarea>`;
    if (a.typ === "nachforderung") x += nachfHTML(lock);
    x += "</section>";
  });
  if (lock) x += `<div class="block"><h4>Vortrag</h4><p style="margin:0">Tragen Sie Ihre Lösung jetzt der Kommission vor: Führungsorganisation, weitere Maßnahmen, Lagemeldung und Nachalarmierung.</p></div><div class="actions"><button class="go" type="button" data-go="4">Zu den Rückfragen der Kommission</button></div>`;
  return x;
}
function abgeben(auto) {
  if (G.abgabe) return;
  const dauer = Math.min(G.cd.dauer, (performance.now() - G.cd.start) / 1000);
  G.abgabe = { t: G.t, dauer, keys: new Set(G.keys), defs: G.items.map(i => i.def) }; G.orgaZeit = G.t;
  G.log.push({ t: G.t, txt: "Ausarbeitung abgegeben", done: true, prio: false });
  toast(auto ? "Zeit abgelaufen. Die Ausarbeitung ist gesperrt." : "Ausarbeitung abgegeben");
  if (G.step === 3) renderAkte(); renderBar();
}
function orgaKurz() {
  const z = G.orga.filter(r => r.ea || r.eal);
  return z.length ? `<ol class="orga-kurz">${z.map(r => `<li><b>${esc(r.ea || "ohne Bezeichnung")}</b>${r.eal ? " · " + esc(r.eal) : ""}${r.rg ? " · " + esc(r.rg) : ""}</li>`).join("")}</ol>` : '<p class="note">Noch keine Einsatzabschnitte eingetragen.</p>';
}
const orgaGesperrt = () => !G || !!G.abgabe || !G.cd.start;
function orgaHTML(lock) {
  const ro = lock ? "readonly" : "";
  const fld = (attr, wert, lbl, cls) => `<label class="${cls || ""}"><span>${lbl}</span><input ${attr} ${ro} value="${esc(wert || "")}" autocomplete="off" aria-label="${lbl}"></label>`;
  const fo = G.fo;
  const ea = G.orga.map((r, i) => `<div class="fo-ea"><span class="fo-nr">${i + 1}</span>
    <div class="fo-box"><span class="fo-ea-k">EA</span><input class="fo-name" data-or="${i}" data-f="ea" ${ro} value="${esc(r.ea)}" autocomplete="off" aria-label="Bezeichnung Einsatzabschnitt ${i + 1}">${!lock && i >= 5 ? `<button type="button" class="fo-x" data-ordel="${i}" aria-label="Abschnitt entfernen">✕</button>` : ""}</div>
    <div class="fo-felder">${fld(`data-or="${i}" data-f="eal"`, r.eal, "Führer")}${fld(`data-or="${i}" data-f="frn"`, r.frn, "Funkrufname")}${fld(`data-or="${i}" data-f="rg"`, r.rg, "K:")}${fld(`data-or="${i}" data-f="auftrag"`, r.auftrag, "Auftrag")}</div>
    ${r.uea.length ? `<div class="fo-uea">${r.uea.map((u, j) => `<div class="fo-ueabox"><span>UEA</span><input data-uea="${i}:${j}" ${ro} value="${esc(u)}" autocomplete="off" aria-label="Unterabschnitt ${j + 1} von Abschnitt ${i + 1}">${!lock ? `<button type="button" class="fo-x" data-ueadel="${i}:${j}" aria-label="Unterabschnitt entfernen">✕</button>` : ""}</div>`).join("")}</div>` : ""}
    ${!lock ? `<button type="button" class="fo-plus" data-ueaadd="${i}">+ UEA</button>` : ""}</div>`).join("");
  return `<div class="fo">
   <div class="fo-titel"><b>Führungsorganisation</b><span>Operativ-taktische Komponente</span></div>
   <div class="fo-gel"><div class="fo-boxtop"><span>Gesamteinsatzleitung</span><input data-fo="gel" ${ro} value="${esc(fo.gel)}" autocomplete="off" aria-label="Gesamteinsatzleitung"></div></div>
   <div class="fo-mitte">
    <div class="fo-adm"><div class="fo-boxtop"><span>Administrativ-organisatorische Komponente</span><input data-fo="adm" ${ro} value="${esc(fo.adm)}" autocomplete="off" aria-label="Administrativ-organisatorische Komponente"></div></div>
    <div class="fo-op">
     <div class="fo-el">${tz("Personen/Einsatzleiter", { w: 92, h: 92 })}<input data-fo="el" ${ro} value="${esc(fo.el)}" autocomplete="off" aria-label="Einsatzleiter" placeholder=""></div>
     <div class="fo-op-unten">
      <div class="fo-sym">${tz("Abgeleitet/Führungseinheit", { w: 84, h: 84, text: "FüEinheit", mitte: true, fs: 30, ty: 152 })}<input data-fo="fue" ${ro} value="${esc(fo.fue)}" autocomplete="off" aria-label="Führungseinheit"></div>
      <span class="fo-quer"></span>
      <div class="fo-sym"><small>Leitstelle</small>${tz("Abgeleitet/Leitstelle_LtS", { w: 84, h: 84 })}<input data-fo="lts" ${ro} value="${esc(fo.lts)}" autocomplete="off" aria-label="Leitstelle"></div>
     </div>
    </div>
    <div class="fo-tel"><span class="fo-gleich">≙</span><div class="fo-sym">${tz("Abgeleitet/Führungseinheit", { w: 110, h: 110, text: "TEL", mitte: true, fs: 40, ty: 156 })}<input data-fo="tel" ${ro} value="${esc(fo.tel)}" autocomplete="off" aria-label="Technische Einsatzleitung"></div></div>
   </div>
   <div class="fo-stiel"></div>
   <div class="fo-harke" style="--n:${G.orga.length}">${ea}</div>
  </div>${G.orga.length > 5 ? '<p class="hint warnhint">Mehr als fünf Abschnitte überschreiten die Führungsspanne.</p>' : ""}${!lock ? `<div class="actions" style="margin-top:8px"><button class="mini sec" type="button" id="orAdd">Weiteren Einsatzabschnitt anlegen</button></div>` : ""}`;
}
function stichHTML() {
  return `<div class="stich"><button type="button" data-lz="1">+1 Löschzug</button>${Object.keys(MS.manv).map(k => `<button type="button" data-anf="${k}" ${G.keys.has(k) ? "disabled" : ""}>${MS.manv[k].name}</button>`).join("")}</div>`;
}
function chipsHTML() {
  return railGruppen().map(g => `<div class="nch-g"><h5>${esc(g.titel)}</h5><div class="nch">${g.rows.map(r => {
    const d = r.d, ext = d.art === "ext", n = G.items.filter(i => i.def.id === d.id).length, aktiv = ext ? G.keys.has(d.id) : n > 0, it0 = G.items.find(i => i.def.id === d.id);
    const st = aktiv ? (ext ? "informiert" : statusText(it0)) : "";
    const dis = aktiv && !d.mehrfach;
    return `<button type="button" class="nchip ${aktiv ? "on" : ""} ${it0 && it0.initial ? "ini" : ""}" data-anf="${d.id}" ${dis ? "disabled" : ""} title="${esc(d.name + (ext ? "" : ", Anfahrt ca. " + eta(d) + " min") + (d.info ? ": " + d.info : ""))}"><span class="nchip-z">${tzDef(d)}</span><span class="nchip-n">${esc(kurz(d).replace(" komplett", ""))}${st ? `<em>${st}${d.mehrfach && n > 1 ? " ×" + n : ""}</em>` : r.ort && d.art !== "ext" && r.ort !== kurz(d) ? `<small>${esc(r.ort)}</small>` : ""}</span></button>`;
  }).join("")}</div></div>`).join("");
}
function nachfHTML(lock) {
  return `${!lock ? `<p class="hint" style="margin-top:0">Stichworte und Einheiten per Klick alarmieren. Alarmierte Kräfte treffen während der Planbesprechung nicht ein.</p><h5 class="nch-t">Stichworte</h5>${stichHTML()}<div class="nchips">${chipsHTML()}</div>` : ""}
  <h5 class="nch-t">Nachalarmiert</h5><div id="nachfListe">${nachfListe()}</div>`;
}
function stepKommission() {
  const sz = G.sz;
  let x = `<p class="hint" style="margin-top:0">Die Kommission stellt Rückfragen zu Ihrer Lösung. Antworten Sie in Stichpunkten so, wie Sie es mündlich vortragen würden.</p>`;
  sz.kommission.forEach((a, i) => {
    x += `<section class="block"><div class="eyebrow">Rückfrage ${i + 1} von ${sz.kommission.length}</div><h4 style="margin-top:4px">${esc(a.titel)}</h4><p class="task-q">${esc(a.frage)}</p>`;
    if (a.typ === "matrix") x += matrixHTML(a, false);
    else x += `<textarea id="ta-${a.id}" placeholder="Ihre Antwort">${esc(G.ans[a.id] || "")}</textarea>`;
    x += "</section>";
  });
  x += `<div class="actions"><button class="go" type="button" data-go="5">Zur Pressekonferenz</button></div>`;
  return x;
}
function stepPresse() {
  const p = G.sz.presse, t = G.ans.presse || "", w = t.trim() ? t.trim().split(/\s+/).length : 0;
  return `<div class="funk"><span class="von">Pressesprecher · B-Dienst z.b.V.</span>${esc(p.anlass)} Bitte geben Sie als Einsatzleiter einen O-Ton ab.</div>
  <section class="block"><h4>${esc(p.titel)}</h4><p class="task-q">${esc(p.frage)}</p>
   <div class="ptimer"><span>Sprechzeit</span><b id="ptimer">${mmss(p.sekunden)}</b><button class="alt" type="button" id="pStart">Sprechzeit starten</button></div>
   <textarea id="ta-presse" placeholder="Ihr O-Ton, so wie Sie ihn sprechen würden">${esc(t)}</textarea>
   <p class="hint" id="pwc">${w} Wörter, gesprochen etwa ${Math.round(w / 2.2)} Sekunden</p>
   ${SAMPLE ? `<div class="actions"><button class="alt" type="button" id="pFb">Rückmeldung der Pressestelle</button></div><div class="kifb" id="pFbOut">${esc(G.ki.presse || "")}</div>` : ""}</section>
  <div class="actions"><button class="go" type="button" data-go="6">Zur Auswertung</button></div>`;
}
function matrixHTML(a, rev) {
  const soll = new Set(a.soll);
  return `<div class="matrix"><table><thead><tr><th></th>${MATRIX_S.map(s => `<th>${s}</th>`).join("")}</tr></thead><tbody>${MATRIX_Z.map(z => `<tr><th class="r">${z}</th>${MATRIX_S.map(s => {
    const k = z + ":" + s, on = G.mx.has(k);
    const cls = rev ? (on && soll.has(k) ? "ok" : (!on && soll.has(k) ? "miss" : (on ? "extra" : ""))) : "";
    return `<td><label class="${cls}" title="${z} für ${s}"><input type="checkbox" data-mx="${esc(k)}" ${on ? "checked" : ""} ${rev ? "disabled" : ""} aria-label="${z} für ${s}"></label></td>`;
  }).join("")}</tr>`).join("")}</tbody></table></div><p class="hint">Gefahrenmatrix nach FwDV 500 (AAAA C EEEE).</p>`;
}

/* ───────── Führungsharke ───────── */
const KANON = [
  ["Dekontamination", /dekon/], ["Messen und Warnen", /mess|warn/], ["Gefahrenabwehr ABC", /abc|cbrn|gefahrstoff|gefahrgut|gefahrenabw|leck/],
  ["Medizinische Rettung", /med|rettungsdienst|sanit|patient|verletzt|\brd\b|behandl/], ["Betreuung", /betreu|unverletzt/],
  ["Bereitstellungsraum", /bereitst|^br\b/], ["Wasserversorgung", /wasserv|löschwasserv|wasserförder/], ["Logistik und Atemschutz", /logist|atemschutz|versorg|nachschub/],
  ["Umwelt- und Gewässerschutz", /umwelt|gewässer|graben/], ["Absperrung und Verkehr", /absperr|verkehr|ordnung des raum/],
  ["Brandbekämpfung", /brand|lösch|angriff/], ["Technische Rettung", /techn|\bth\b|befrei|eingeklemmt/], ["Menschenrettung und Evakuierung", /mensch|evak|räum|rettung|tunnel|bus/]
];
function kanon(t) { const x = String(t || "").toLowerCase().trim(); if (!x) return ""; const k = KANON.find(([, re]) => re.test(x)); return k ? k[0] : x; }
function orgaZeilen() { return G.orga.filter(r => r.ea.trim()); }
function orgaNamen() { return new Set(orgaZeilen().map(r => kanon(r.ea))); }

/* ───────── Bewertung ───────── */
function erfuellt(r) {
  const keys = G.abgabe ? G.abgabe.keys : G.keys;
  const defs = (G.abgabe ? G.abgabe.defs : G.items.map(i => i.def)).filter(d => !d.ziel);
  if (r.t === "key") return r.any.some(k => keys.has(k));
  if (r.t === "lz") return defs.reduce((s, d) => s + (d.lz || 0), 0) >= r.min;
  if (r.t === "typ") return defs.reduce((s, d) => s + d.typen.filter(t => t === r.typ).length, 0) >= r.min;
  return false;
}
function punkte(a) {
  if (a.typ === "erkundung") { const w = G.sz.nachfragen.map((n, i) => n.wichtig ? i : -1).filter(i => i >= 0); const g = new Set(G.fragen.map(f => f.i)); return { p: w.filter(i => g.has(i)).length, m: w.length }; }
  if (a.typ === "text") { const k = G.krit[a.id] || []; return { p: a.kriterien.reduce((s, c, i) => s + (k[i] ? c[1] : 0), 0), m: a.kriterien.reduce((s, c) => s + c[1], 0) }; }
  if (a.typ === "matrix") {
    const soll = new Set(a.soll); let hit = 0, extra = 0; G.mx.forEach(k => soll.has(k) ? hit++ : extra++);
    if (!soll.size) return { p: 0, m: 0, hit, extra };
    const p = Math.max(0, hit / soll.size * 8 - 0.5 * Math.max(0, extra - 2)); return { p: Math.round(p * 2) / 2, m: 8, hit, extra };
  }
  if (a.typ === "abschnitte") {
    const rows = orgaZeilen(), names = orgaNamen();
    const p = a.soll.filter(s => names.has(s)).length;
    const ealOk = rows.length > 0 && rows.every(r => r.eal.trim()); const rgs = rows.map(r => r.rg.trim().toUpperCase());
    const rgOk = rows.length > 0 && rows.every(r => r.rg.trim()) && new Set(rgs).size === rgs.length && !rgs.includes("MUS_90");
    const spanne = rows.length > 0 && rows.length <= 5;
    return { p: p + (ealOk ? 1 : 0) + (rgOk ? 1 : 0) + (spanne ? 1 : 0), m: a.soll.length + 3, ealOk, rgOk, spanne };
  }
  if (a.typ === "nachforderung") return { p: a.soll.reduce((s, r) => s + (erfuellt(r) ? r.pts : 0), 0), m: a.soll.reduce((s, r) => s + r.pts, 0) };
  return { p: 0, m: 0 };
}
function teile() {
  const sz = G.sz;
  return [
    { titel: "Erkundung", aufgaben: [{ id: "erkundung", typ: "erkundung", titel: "Nachfragen an der Einsatzstelle" }] },
    { titel: "Ausarbeitung", aufgaben: sz.ausarbeitung },
    { titel: "Rückfragen der Kommission", aufgaben: sz.kommission },
    { titel: "Pressekonferenz", aufgaben: [sz.presse] }
  ];
}
function summe() {
  let p = 0, m = 0; const rows = teile().map(t => { let tp = 0, tm = 0; t.aufgaben.forEach(a => { const k = punkte(a); tp += k.p; tm += k.m; }); p += tp; m += tm; return { titel: t.titel, p: tp, m: tm }; });
  const pr = m ? Math.round(p / m * 100) : 0;
  const note = pr >= 92 ? "sehr gut" : pr >= 81 ? "gut" : pr >= 67 ? "befriedigend" : pr >= 50 ? "ausreichend" : pr >= 30 ? "mangelhaft" : "ungenügend";
  return { p, m, pr, note, rows };
}
function summeHTML() {
  const s = summe();
  return `<div class="score" style="margin:8px 0 10px"><span class="tot">${s.pr} %</span><span class="str" style="align-self:end">${s.p} von ${s.m} Punkten<br>${s.note}</span></div>
  <div class="block"><div class="score">${s.rows.map(r => `<span>${esc(r.titel)}</span><span class="str">${r.p} / ${r.m}</span><div class="bar-p" style="grid-column:1/-1"><i style="width:${r.m ? Math.round(r.p / r.m * 100) : 0}%"></i></div>`).join("")}</div></div>`;
}
function antwortVon(a) {
  if (a.typ === "erkundung") return G.fragen.length ? G.fragen.map(f => "• " + f.f).join("\n") : "Keine Nachfragen gestellt.";
  if (a.typ === "text") return G.ans[a.id] || "Keine Antwort.";
  if (a.typ === "abschnitte") { const fo = G.fo, kopf = [["Gesamteinsatzleitung", fo.gel], ["Adm.-org. Komponente", fo.adm], ["Einsatzleiter", fo.el], ["Führungseinheit", fo.fue], ["Leitstelle", fo.lts], ["TEL", fo.tel]].filter(x => x[1]).map(x => x[0] + ": " + x[1]);
    const eas = orgaZeilen().map(r => `EA ${G.orga.indexOf(r) + 1}: ${r.ea}, ${r.eal || "ohne Führer"}, ${r.rg || "ohne Rufgruppe"}${r.frn ? ", " + r.frn : ""}${r.auftrag ? ", Auftrag: " + r.auftrag : ""}${r.uea.filter(Boolean).length ? ", UEA: " + r.uea.filter(Boolean).join(", ") : ""}`);
    return kopf.concat(eas).join("\n") || "Keine Führungsorganisation erstellt."; }
  if (a.typ === "nachforderung") return G.items.filter(i => !i.initial && !i.nach && i.def.art !== "c").map(i => "• " + i.def.name).concat(G.log.filter(l => /^Benachrichtigung/.test(l.txt) && !l.nach).map(l => "• " + l.txt.replace("Benachrichtigung: ", ""))).join("\n") || "Keine Nachalarmierung.";
  return "";
}
function evalHTML(a) {
  const pk = punkte(a);
  let x = `<div class="ev-h"><b>${esc(a.titel)}</b><span class="pts" id="pts-${a.id}">${pk.p} / ${pk.m}</span></div>`;
  if (a.typ !== "matrix") x += `<div class="ihre"><span>Ihre Lösung</span>${esc(antwortVon(a))}</div>`;
  if (a.typ === "erkundung") {
    const g = new Set(G.fragen.map(f => f.i));
    x += G.sz.nachfragen.filter(n => n.wichtig).map(n => { const i = G.sz.nachfragen.indexOf(n), ok = g.has(i); return `<div class="evl"><span class="m ${ok ? "y" : "n"}">${ok ? "✓" : "✕"}</span><span>${esc(n.f)}<small>${esc(n.a)}</small></span><span class="p">1 P.</span></div>`; }).join("");
  }
  if (a.typ === "text") {
    const k = G.krit[a.id] || [];
    x += `<p class="hint">Haken Sie ab, was Ihre Antwort enthält.</p>` + a.kriterien.map((c, i) => `<label class="krit"><input type="checkbox" data-kr="${a.id}:${i}" ${k[i] ? "checked" : ""}><span>${esc(c[0])}</span><span class="p">${c[1]} P.</span></label>`).join("");
  }
  if (a.typ === "matrix") x += matrixHTML(a, true) + `<p class="hint">Grün: erkannt. Gelb: übersehen. Grau: nicht erwartet. ${pk.hit} von ${a.soll.length} Feldern erkannt${pk.extra ? `, ${pk.extra} zusätzlich` : ""}.</p><p>${esc(a.hinweis || "")}</p>`;
  if (a.typ === "abschnitte") {
    const names = orgaNamen();
    x += a.soll.map(s => `<div class="evl"><span class="m ${names.has(s) ? "y" : "n"}">${names.has(s) ? "✓" : "✕"}</span><span>${esc(s)}</span><span class="p">1 P.</span></div>`).join("") +
      [[pk.ealOk, "Jeder Abschnitt hat einen Abschnittsleiter"], [pk.rgOk, "Eigene Rufgruppe je Abschnitt"], [pk.spanne, "Führungsspanne von höchstens fünf Abschnitten"]].map(([ok, t]) => `<div class="evl"><span class="m ${ok ? "y" : "n"}">${ok ? "✓" : "✕"}</span><span>${t}</span><span class="p">1 P.</span></div>`).join("") +
      (a.kann ? `<p class="hint">Ebenfalls sinnvoll: ${esc(a.kann.join(", "))}.</p>` : "") + `<p>${esc(a.hinweis || "")}</p>`;
  }
  if (a.typ === "nachforderung") {
    x += a.soll.map(r => { const ok = erfuellt(r); return `<div class="evl"><span class="m ${ok ? "y" : "n"}">${ok ? "✓" : "✕"}</span><span>${esc(r.label)}<small>${esc(r.warum)}</small></span><span class="p">${r.pts} P.</span></div>`; }).join("") +
      (a.kann ? `<p class="hint">Zusätzlich vertretbar: ${esc(a.kann.join(", "))}.</p>` : "") + (G.items.some(i => i.nach) ? `<p class="hint">Nach der Abgabe angeforderte Kräfte werden nicht gewertet.</p>` : "");
  }
  return x;
}
function stepAuswertung() {
  const best = store.get("pms_best", {}), s = summe();
  if (best[G.sz.id] == null || s.pr > best[G.sz.id]) { best[G.sz.id] = s.pr; store.set("pms_best", best); }
  return `<div class="eyebrow">Auswertung</div><div id="sum">${summeHTML()}</div>
  <p class="hint">Freitexte werden anhand des Erwartungshorizonts selbst bewertet. Die Summe aktualisiert sich beim Abhaken. Orientierung nach dem üblichen Notenschlüssel.</p>
  ${teile().map(t => `<h3 class="teil">${esc(t.titel)}</h3>` + t.aufgaben.map(a => `<section class="block">${evalHTML(a)}</section>`).join("")).join("")}
  <div class="actions"><button class="alt" type="button" data-tafel>Arbeitstafel ansehen</button><button class="alt" type="button" id="copyBtn">Antworten kopieren</button><button class="alt" type="button" id="againBtn">Erneut spielen</button><button class="alt" type="button" id="zufallBtn">Nächstes Zufallsszenario</button><button class="go" type="button" id="endBtn">Zur Karte</button></div><textarea id="copyArea" hidden readonly></textarea>`;
}
function antwortText() {
  const sz = G.sz; let t = `Planbesprechung Musterstadt · ${sz.titel}\n${sz.ort.adresse}, ${sz.zeit} ${sz.t0} Uhr\n\n`;
  teile().forEach(tl => { t += tl.titel.toUpperCase() + "\n"; tl.aufgaben.forEach(a => { t += a.titel + "\n" + (a.typ === "matrix" ? [...G.mx].join(", ") : antwortVon(a)) + "\n\n"; }); });
  return t;
}
function bindAkte() {
  const B = $("#akteBody");
  B.querySelectorAll("[data-go]").forEach(b => b.addEventListener("click", () => geheZu(+b.dataset.go)));
  B.querySelectorAll("[data-tafel]").forEach(b => b.addEventListener("click", oeffneTafel));
  B.querySelectorAll("[data-fokus]").forEach(b => b.addEventListener("click", () => { if (window.Ansicht) window.Ansicht.setze("3d"); fokus(G.sz.x, G.sz.y, { dist: 26, phi: 0.95 }); }));
  B.querySelectorAll("textarea[id^=ta-]").forEach(ta => ta.addEventListener("input", () => {
    G.ans[ta.id.slice(3)] = ta.value;
    if (ta.id === "ta-presse") { const w = ta.value.trim() ? ta.value.trim().split(/\s+/).length : 0; $("#pwc").textContent = `${w} Wörter, gesprochen etwa ${Math.round(w / 2.2)} Sekunden`; }
  }));
  B.querySelectorAll("[data-fr]").forEach(b => b.addEventListener("click", () => frage(G.sz.nachfragen[+b.dataset.fr].f, +b.dataset.fr)));
  const fi = B.querySelector("#eigeneFrage"), fb = B.querySelector("#frageBtn");
  if (fb) { const go = () => { const v = fi.value.trim(); if (v) frage(v); }; fb.addEventListener("click", go); fi.addEventListener("keydown", e => { if (e.key === "Enter") go(); }); }
  const st = B.querySelector("#cdStart"); if (st) st.addEventListener("click", () => { G.cd.strikt = B.querySelector("#strikt").checked; G.cd.start = performance.now(); G.log.push({ t: G.t, txt: "Beginn der Ausarbeitung", done: true }); renderAkte(); renderBar(); });
  const ab = B.querySelector("#abgabeBtn"); if (ab) ab.addEventListener("click", () => abgeben(false));
  B.querySelectorAll("[data-kr]").forEach(c => c.addEventListener("change", () => {
    const [id, i] = c.dataset.kr.split(":"); (G.krit[id] = G.krit[id] || [])[+i] = c.checked;
    const a = teile().flatMap(t => t.aufgaben).find(x => x.id === id); const k = punkte(a);
    $("#pts-" + id).textContent = k.p + " / " + k.m; $("#sum").innerHTML = summeHTML();
    const best = store.get("pms_best", {}), s = summe(); if (best[G.sz.id] == null || s.pr > best[G.sz.id]) { best[G.sz.id] = s.pr; store.set("pms_best", best); }
  }));
  B.querySelectorAll("[data-mx]").forEach(c => c.addEventListener("change", () => { c.checked ? G.mx.add(c.dataset.mx) : G.mx.delete(c.dataset.mx); }));
  B.querySelectorAll("[data-zurtafel]").forEach(b => b.addEventListener("click", () => window.Ansicht && window.Ansicht.setze("tafel")));
  B.querySelectorAll("[data-anf]").forEach(b => b.addEventListener("click", () => { anfordern(b.dataset.anf); renderAkte(); }));
  B.querySelectorAll("[data-lz]").forEach(b => b.addEventListener("click", plusLZ));
  const ps = B.querySelector("#pStart"); if (ps) ps.addEventListener("click", () => { G.presseStart = performance.now(); });
  const pf = B.querySelector("#pFb"); if (pf) pf.addEventListener("click", async () => {
    pf.disabled = true; const out = $("#pFbOut");
    const fbt = await ki(`Du bist Pressesprecher einer Berufsfeuerwehr und gibst dem Einsatzleiter Rückmeldung zu seinem O-Ton für eine Pressekonferenz. Bewerte knapp: was gelungen ist, was fehlt oder riskant ist (Spekulation, Namen, unbestätigte Zahlen), und einen Formulierungsvorschlag für einen Satz. Höchstens 100 Wörter. ${STIL}\n\nAnlass: ${G.sz.presse.anlass}\nGesicherte Lage: ${G.sz.meldung}\n\nO-Ton: ${G.ans.presse || "kein O-Ton"}`, out, "default");
    if (fbt) G.ki.presse = fbt; pf.disabled = false;
  });
  const cp = B.querySelector("#copyBtn"); if (cp) cp.addEventListener("click", () => { const t = antwortText(); const fall = () => { const ta = $("#copyArea"); ta.hidden = false; ta.value = t; ta.select(); toast("Text markiert, bitte kopieren"); }; try { navigator.clipboard.writeText(t).then(() => toast("Antworten kopiert"), fall); } catch (e) { fall(); } });
  const ag = B.querySelector("#againBtn"); if (ag) ag.addEventListener("click", () => starte(G.sz.id));
  const zb = B.querySelector("#zufallBtn"); if (zb) zb.addEventListener("click", zufall);
  const en = B.querySelector("#endBtn"); if (en) en.addEventListener("click", beende);
}
$("#akteGrip").addEventListener("click", () => { const a = $("#akte"); a.classList.toggle("zu"); $("#akteGrip").setAttribute("aria-expanded", !a.classList.contains("zu")); });

/* ───────── Lagekarte (taktische Zeichen, vereinfacht) ───────── */
function fzZeichen(x, y, txt, org, w, hh, vert) {
  w = w || 46; hh = hh || 20;
  const c = { fw: ["#e3061b", "#e3061b", "#fff"], rd: ["#fff", "#e3061b", "#e3061b"], pol: ["#1f8a4c", "#1f8a4c", "#fff"], zivil: ["#fff", "#333", "#222"], ue: ["#fff", "#6b3fb5", "#6b3fb5"] }[org || "fw"];
  const g = `<g transform="translate(${x},${y})${vert ? " rotate(90)" : ""}"><rect x="${-w / 2}" y="${-hh / 2}" width="${w}" height="${hh}" fill="${c[0]}" stroke="${c[1]}" stroke-width="1.6"/><circle cx="${-w / 2 + 7}" cy="${hh / 2 + 3}" r="2.6" fill="none" stroke="${c[1]}" stroke-width="1.4"/><circle cx="${w / 2 - 7}" cy="${hh / 2 + 3}" r="2.6" fill="none" stroke="${c[1]}" stroke-width="1.4"/><text x="0" y="3.6" text-anchor="middle" font-size="10" font-weight="700" fill="${c[2]}">${esc(txt)}</text></g>`;
  return g;
}
function lageTZ(i) {
  const t = String(i.txt || "");
  if (i.org === "zivil") return null;
  if (i.org === "pol") return "Polizei_Fahrzeuge/PKW_Polizei";
  if (i.org === "rd") return /NEF/.test(t) ? "Rettungswesen_Fahrzeuge/Notarzteinsatzfahrzeug" : /KTW/.test(t) ? "Rettungswesen_Fahrzeuge/KTW" : "Rettungswesen_Fahrzeuge/RTW";
  if (/HLF/.test(t)) return "Feuerwehr_Fahrzeuge/HLF";
  if (/DLK|DLA/.test(t)) return "Feuerwehr_Fahrzeuge/Drehleiter_mit_Korb";
  if (/^RW/.test(t)) return "Feuerwehr_Fahrzeuge/Rüstwagen";
  if (/ABC/.test(t)) return "Katastrophenschutz_Einheiten/ABC_Zug";
  if (/^LZ 1$|^LZ 2$/.test(t)) return "Feuerwehr_Einheiten/Löschzug_Berufsfeuerwehr";
  if (/^LZ/.test(t)) return "Feuerwehr_Einheiten/Löschzug_Freiwillige_Feuerwehr";
  if (/ELW/.test(t)) return "Feuerwehr_Fahrzeuge/ELW_1";
  if (/TLF/.test(t)) return "Feuerwehr_Fahrzeuge/TLF_4000";
  return "Feuerwehr_Fahrzeuge/Löschfahrzeug";
}
function svgLage(sz, grid, ohneErgaenzung) {
  let s = `<svg viewBox="0 0 640 400" xmlns="http://www.w3.org/2000/svg" font-family="Arial,Helvetica,sans-serif" role="img" aria-label="Lagekarte ${esc(sz.titel)}"><defs><pattern id="gr" width="29.1" height="29.1" patternUnits="userSpaceOnUse"><path d="M29.1 0H0V29.1" fill="none" stroke="#9a9a9a" stroke-width=".6"/></pattern><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#222"/></marker><marker id="ahb" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="#1565c0"/></marker></defs><rect width="640" height="400" fill="#fff"/>${grid ? '<rect width="640" height="400" fill="url(#gr)"/>' : ""}`;
  sz.lagekarte.forEach(i => {
    if (i.t === "flaeche") { s += `<polygon points="${i.pts.map(p => p.join(",")).join(" ")}" fill="${i.f === "strasse" ? "#c9c9c9" : "#ebe6d6"}" stroke="#888" stroke-width="1"/>`; if (i.txt) { const cx = i.pts.reduce((a, p) => a + p[0], 0) / i.pts.length, cy = i.pts.reduce((a, p) => a + p[1], 0) / i.pts.length; s += `<text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="11" fill="#555" font-style="italic">${esc(i.txt)}</text>`; } }
    if (i.t === "linie") {
      const pts = i.pts.map(p => p.join(",")).join(" ");
      const st = { mittel: 'stroke="#fff" stroke-width="2" stroke-dasharray="14 10"', wasser: 'stroke="#1e88e5" stroke-width="3"', brandwand: 'stroke="#111" stroke-width="5"', gleis: 'stroke="#555" stroke-width="2"' }[i.s];
      s += `<polyline points="${pts}" fill="none" ${st}/>`;
      if (i.s === "gleis") s += `<polyline points="${i.pts.map(p => (p[0] + 10) + "," + p[1]).join(" ")}" fill="none" stroke="#555" stroke-width="2"/><polyline points="${i.pts.map(p => (p[0] + 5) + "," + p[1]).join(" ")}" fill="none" stroke="#999" stroke-width="10" stroke-dasharray="1.5 8" opacity=".8"/>`;
      if (i.txt) s += `<text x="${i.pts[0][0] + 6}" y="${i.pts[0][1] - 6}" font-size="10" fill="#1e5aa8">${esc(i.txt)}</text>`;
    }
    if (i.t === "zone") s += i.kind === "gefahr" ? `<circle cx="${i.cx}" cy="${i.cy}" r="${i.r}" fill="rgba(227,6,27,.07)" stroke="#e3061b" stroke-width="2" stroke-dasharray="8 5"/><text x="${i.cx}" y="${i.cy - i.r - 4}" text-anchor="middle" font-size="10" fill="#e3061b" font-weight="700">${esc(i.txt)}</text>` : `<circle cx="${i.cx}" cy="${i.cy}" r="${i.r}" fill="none" stroke="#222" stroke-width="1.6" stroke-dasharray="12 4 2 4"/><text x="${i.cx}" y="${i.cy - i.r - 4}" text-anchor="middle" font-size="10" fill="#222">${esc(i.txt)}</text>`;
    if (i.t === "fz") { const k = lageTZ(i); s += k ? `<g>${tz(k, { x: i.x - 22, y: i.y - 25, w: 44, h: 44 })}<text x="${i.x}" y="${i.y + 24}" text-anchor="middle" font-size="8" font-weight="700" fill="#222">${esc(i.txt)}</text></g>` : fzZeichen(i.x, i.y, i.txt, i.org, i.w, i.h, i.vertikal); }
    if (i.t === "tz") s += `<g>${tz(i.z, { x: i.x - (i.s || 36) / 2, y: i.y - (i.s || 36) / 2, w: i.s || 36, h: i.s || 36 })}${i.txt ? `<text x="${i.x}" y="${i.y + (i.s || 36) / 2 + 4}" text-anchor="middle" font-size="9" font-weight="700" fill="#b00010">${esc(i.txt)}</text>` : ""}</g>`;
    if (i.t === "warn") s += `<g transform="translate(${i.x},${i.y})"><rect x="-17" y="-13" width="34" height="26" fill="#ff8a00" stroke="#111" stroke-width="1.6"/><line x1="-17" y1="0" x2="17" y2="0" stroke="#111" stroke-width="1.4"/><text y="-3" text-anchor="middle" font-size="9" font-weight="700">${esc(i.oben)}</text><text y="10" text-anchor="middle" font-size="9" font-weight="700">${esc(i.unten)}</text></g>`;
    if (i.t === "wind") s += `<g transform="translate(${i.x},${i.y})"><g transform="rotate(${i.dir})"><line x1="0" y1="22" x2="0" y2="-20" stroke="#222" stroke-width="2.4" marker-end="url(#ah)"/><line x1="0" y1="22" x2="-8" y2="14" stroke="#222" stroke-width="2"/><line x1="0" y1="16" x2="-8" y2="8" stroke="#222" stroke-width="2"/></g><text y="40" text-anchor="middle" font-size="10" font-weight="700">${esc(i.txt)}</text></g>`;
    if (i.t === "wolke") s += `<g transform="translate(${i.x},${i.y})" opacity=".55"><ellipse rx="70" ry="26" fill="#cfd8dc"/><ellipse cx="40" cy="-14" rx="40" ry="18" fill="#cfd8dc"/><ellipse cx="-30" cy="-10" rx="30" ry="16" fill="#cfd8dc"/><text y="4" text-anchor="middle" font-size="10" fill="#37474f" font-style="italic">Gaswolke</text></g>`;
    if (i.t === "rauch") s += `<g transform="translate(${i.x},${i.y})" opacity=".5"><ellipse rx="60" ry="30" fill="#90a4ae"/><ellipse cx="30" cy="-16" rx="34" ry="18" fill="#90a4ae"/><text y="4" text-anchor="middle" font-size="10" fill="#263238" font-style="italic">Rauch</text></g>`;
    if (i.t === "wasserschleier") s += `<line x1="${i.x1}" y1="${i.y1}" x2="${i.x2}" y2="${i.y2}" stroke="#1e88e5" stroke-width="5" stroke-dasharray="2 4" stroke-linecap="round"/><text x="${i.x1 + 6}" y="${i.y1 - 4}" font-size="9" fill="#1565c0">Wasserschleier</text>`;
    if (i.t === "el") s += `<g>${tz("Führungsstellen/Führungsstelle", { x: i.x - 6, y: i.y - 36, w: 46, h: 46 })}<text x="${i.x + 17}" y="${i.y - 8}" text-anchor="middle" font-size="9" font-weight="700">${esc(i.txt)}</text></g>`;
    if (i.t === "personen") s += `<g>${tz("Rettungswesen_Einrichtungen/Sammelplatz_für_Betroffene", { x: i.x - 18, y: i.y - 20, w: 36, h: 36 })}<text x="${i.x}" y="${i.y + 22}" text-anchor="middle" font-size="9.5">${esc(i.txt)}</text></g>`;
    if (i.t === "offen") s += `<g transform="translate(${i.x},${i.y})"><rect x="-56" y="-14" width="112" height="28" rx="4" fill="#fffbe6" stroke="#b58500" stroke-width="1.4" stroke-dasharray="4 3"/><text x="-48" y="5.5" font-size="15" font-weight="700" fill="#b58500">?</text><text x="-34" y="4" font-size="9.5" fill="#6b5200">${esc(i.txt)}</text></g>`;
    if (i.t === "pfeil") s += `<line x1="${i.x1}" y1="${i.y1}" x2="${i.x2}" y2="${i.y2}" stroke="#1565c0" stroke-width="2" marker-end="url(#ahb)"/><text x="${(i.x1 + i.x2) / 2 + 6}" y="${(i.y1 + i.y2) / 2 - 5}" font-size="9.5" fill="#1565c0">${esc(i.txt)}</text>`;
    if (i.t === "gebaeude") s += `<rect x="${i.x}" y="${i.y}" width="${i.w}" height="${i.h}" fill="#d9d9d9" stroke="#333" stroke-width="1.6"/><text x="${i.x + i.w / 2}" y="${i.y + 15}" text-anchor="middle" font-size="10.5" font-weight="700" fill="#333">${esc(i.txt)}</text>`;
    if (i.t === "brand") s += `<g>${tz("Gefahren/Vollbrand", { x: i.x - 17, y: i.y - 20, w: 34, h: 34 })}<text x="${i.x}" y="${i.y + 22}" text-anchor="middle" font-size="9.5" font-weight="700" fill="#b00010">${esc(i.txt)}</text></g>`;
    if (i.t === "text") s += `<text x="${i.x}" y="${i.y}" font-size="11" fill="#444" font-style="italic">${esc(i.txt)}</text>`;
    if (i.t === "ablage") s += `<g>${tz("Rettungswesen_Einrichtungen/Patientenablage", { x: i.x - 20, y: i.y - 20, w: 40, h: 40 })}<text x="${i.x}" y="${i.y + 24}" text-anchor="middle" font-size="9.5" fill="#b00010">${esc(i.txt)}</text></g>`;
    if (i.t === "hydrant") s += `<g transform="translate(${i.x},${i.y})"><circle r="8" fill="#fff" stroke="#1565c0" stroke-width="2"/><text y="3.5" text-anchor="middle" font-size="9" font-weight="700" fill="#1565c0">H</text></g>`;
    if (i.t === "schlauch") s += `<polyline points="${i.pts.map(p => p.join(",")).join(" ")}" fill="none" stroke="#1565c0" stroke-width="2.2"/>`;
    if (i.t === "ausgang") s += `<g transform="translate(${i.x},${i.y})"><rect x="-10" y="-8" width="20" height="16" fill="#1f8a4c"/><path d="M-4 0h8M1 -4l4 4-4 4" stroke="#fff" stroke-width="1.8" fill="none"/><text y="20" text-anchor="middle" font-size="9.5" fill="#1f6b3a">${esc(i.txt)}</text></g>`;
  });
  if (!ohneErgaenzung && G && sz === G.sz && G.lk && G.lk.length && window.Lagezeichnen) s += window.Lagezeichnen.svg(G.lk);
  return s + "</svg>";
}

/* ───────── Taktische Arbeitstafel ───────── */
function kkZeichen(def) { return tzDef(def, { cls: "kkz" }) || `<span class="kk-leer">${esc(kurz(def))}</span>`; }
function kraefteSumme() {
  let f = 0, u = 0, m = 0, g = 0, fz = 0, offen = 0;
  const its = G.items.filter(i => !i.def.ziel && i.da);
  const manvMax = its.filter(i => i.def.manv).sort((a, b) => (MS.staerke[b.def.id][2] || 0) - (MS.staerke[a.def.id][2] || 0))[0];
  its.forEach(i => {
    if (i.def.manv && i !== manvMax) return;
    const s = staerke(i.def); const p = parseSt(s.st);
    if (p) { f += p[0]; u += p[1]; m += p[2]; g += p[3]; } else if (s.g) { offen += s.g; }
    fz += s.fz || 0;
  });
  return { f, u, m, g, fz, offen };
}
function tafelOrgaDaten() {
  const brRows = orgaZeilen().filter(r => kanon(r.ea) === "Bereitstellungsraum");
  const br = [0, 1].map(k => brRows[k] ? { eal: brRows[k].eal, rg: brRows[k].rg } : null);
  const ea = orgaZeilen().filter(r => kanon(r.ea) !== "Bereitstellungsraum").slice(0, 5); while (ea.length < 5) ea.push(null);
  return { br, ea };
}
function tafelBaum() {
  const { br, ea } = tafelOrgaDaten();
  const W = 300, colX = i => 30 + i * 60;
  let tree = `<svg viewBox="0 0 ${W} 210" font-family="Arial"><line x1="150" y1="40" x2="150" y2="95" stroke="#000" stroke-width="2"/><line x1="30" y1="95" x2="270" y2="95" stroke="#000" stroke-width="1.5"/>`;
  tree += `<circle cx="40" cy="32" r="18" fill="#fff" stroke="#000" stroke-width="1.5"/><path d="M22 26a18 18 0 0 1 36 0" fill="#000"/><text x="40" y="37" text-anchor="middle" font-size="12" font-weight="700">LtS</text><line x1="58" y1="32" x2="118" y2="32" stroke="#000" stroke-width="1.5" stroke-dasharray="4 2"/>`;
  tree += `<rect x="118" y="18" width="64" height="26" fill="#fff" stroke="#e3061b" stroke-width="3"/><text x="124" y="35" font-size="13" font-weight="700">E</text><text x="150" y="54" text-anchor="middle" font-size="8">C-Dienst · MUS_90</text>`;
  [0, 1].forEach(k => { const x = 222 + k * 50; const b = br[k]; tree += `<line x1="182" y1="32" x2="${x - 16}" y2="32" stroke="#000" stroke-width="1.2" stroke-dasharray="4 2"/><circle cx="${x}" cy="32" r="16" fill="#fff" stroke="#000" stroke-width="1.5"/><text x="${x}" y="30" text-anchor="middle" font-size="9">BR-</text><text x="${x}" y="40" text-anchor="middle" font-size="9">${k + 1}</text>${b ? `<text x="${x}" y="60" text-anchor="middle" font-size="7.5">${esc(b.rg || "")}</text>` : ""}`; });
  for (let k = 0; k < 5; k++) { const x = colX(k), r = ea[k]; tree += `<line x1="${x}" y1="95" x2="${x}" y2="108" stroke="#000" stroke-width="1.5"/><rect x="${x - 26}" y="108" width="52" height="22" fill="#fff" stroke="#000" stroke-width="1.5"/><text x="${x}" y="124" text-anchor="middle" font-size="12">A ${RUFRANG[k]}</text>`;
    if (r) tree += `<text x="${x}" y="143" text-anchor="middle" font-size="7.2" font-weight="700">${esc(r.ea.split(" ")[0].slice(0, 15))}</text><text x="${x}" y="154" text-anchor="middle" font-size="7">${esc((r.eal || "").slice(0, 16))}</text><text x="${x}" y="165" text-anchor="middle" font-size="7">K: ${esc(r.rg || "")}</text>`; }
  tree += "</svg>";
  return tree;
}
function tafelAbs() {
  const { ea } = tafelOrgaDaten();
  return [0, 1, 2, 3, 4].map(k => { const r = ea[k]; const a = "ab-" + k + "-";
    return `<div class="tf-abs"><div class="h"><div class="rom"><span>A ${RUFRANG[k]}</span></div><dl><dt>Befehlsstelle</dt><dd>${fe(a + "bst", "")}</dd><dt>Leiter/Führer</dt><dd>${fe(a + "eal", r ? r.eal : "")}</dd><dt>Kommunikation</dt><dd>${fe(a + "rg", r ? r.rg : "")}</dd><dt>Auftrag</dt><dd>${fe(a + "ea", r ? r.ea : "")}</dd><dt>Einsatzbeginn</dt><dd>${fe(a + "beginn", r && G.orgaZeit != null ? dtg(G.orgaZeit) : "")}</dd></dl></div><div class="k">${fe(a + "k", r ? "Kräfteübersicht: __/__/__/__" : "", "block")}</div></div>`; }).join("");
}
/* Frei beschreibbare Felder der Arbeitstafel: Ein Eintrag überschreibt den vorbelegten Text und wird blau dargestellt.
   Rechtsklick auf ein beschriebenes Feld setzt es auf die Vorbelegung zurück. */
function fe(k, std, cls) {
  const eig = G.tf && Object.prototype.hasOwnProperty.call(G.tf, k), v = eig ? G.tf[k] : (std == null ? "" : String(std));
  return `<span class="tfe${eig ? " ed" : ""}${cls ? " " + cls : ""}" data-tf="${esc(k)}" data-std="${esc(std == null ? "" : String(std))}" contenteditable="true" spellcheck="false" title="Feld beschreiben">${esc(v)}</span>`;
}
function renderTafel() {
  const sz = G.sz, T = $("#tafel");
  const fa = document.activeElement, fokus = fa && T.contains(fa) && fa.dataset ? fa.dataset.tf : null;
  const units = G.items.filter(i => !i.def.ziel);
  const cards = units.slice(0, 34);
  const order = []; for (let c = 1; c <= 11; c++) order.push([1, c]); for (let r = 2; r <= 7; r++) order.push([r, 11]); for (let c = 11; c >= 1; c--) order.push([8, c]); for (let r = 7; r >= 2; r--) order.push([r, 1]);
  const kk = order.map((pos, idx) => {
    const it = cards[idx]; const style = `grid-row:${pos[0]};grid-column:${pos[1]}`;
    const kk = "kk-" + idx + "-";
    if (!it) return `<div class="kk frei" style="${style}"><div class="n">${fe(kk + "n", "")}</div><div>${fe(kk + "z", "", "gross")}</div><div class="z">${fe(kk + "s", "")}</div><div class="z">${fe(kk + "st", "")}</div></div>`;
    const s = staerke(it.def);
    return `<div class="kk ${it.da ? "" : "anf"}" style="${style}"><div class="n" title="${esc(it.def.name)}">${fe(kk + "n", it.def.name.split(" (")[0].replace(" komplett", ""))}</div><div>${kkZeichen(it.def)}</div><div class="z">${fe(kk + "s", s.st || (s.g ? s.g + " Funktionen" : s.fz + " Fz"))}</div><div class="z">${fe(kk + "st", statusText(it))}</div></div>`;
  }).join("");
  const ks = kraefteSumme();
  const nachf = G.log.filter(l => /^Nachforderung/.test(l.txt));
  const stellen = [["ORDN", "Ordnungsamt"], ["UWB", "Untere Wasserbehörde"], ["STADTW", "Stadtwerke"], ["ENERG", "Energieversorger"], ["POL", "Polizei"]].concat(MS.extern.filter(e => !["ORDN", "UWB", "STADTW", "ENERG", "POL"].includes(e.id) && G.keys.has(e.id)).map(e => [e.id, e.name])).slice(0, 9);
  const rm = G.log.slice().reverse().slice(0, 10);
  T.innerHTML = `<div class="tf-head"><div class="t"><span>Taktische Arbeitstafel für die Führungsstufen B + C</span><small>nach Vorlage IdF NRW · Planbesprechung Musterstadt · ${TZ_QUELLE}</small></div>
   <div class="tf-fields"><label>Einsatzstichwort:${fe("kopf-stichwort", sz.stichwort)}</label><label>Einsatzort:${fe("kopf-ort", sz.ort.adresse)}</label><label>Meldender:${fe("kopf-meldender", sz.meldender || "")}</label><label>Objektnr.:${fe("kopf-objekt", "")}</label><label>Datum-Uhrzeitgruppe:${fe("kopf-dtg", dtg(G.t))}</label></div></div>
   <div class="tf-main"><section class="tf-sec tf-lage"><h5>Lagebild (Ordnung des Raumes / Einsatzkräfte)</h5><div class="tf-ring">${kk}<div class="tf-sketch" id="tfSketch"></div></div>${units.length > 34 ? `<p style="padding:0 40px 10px;font-size:11px">+ ${units.length - 34} weitere Einsatzmittel</p>` : ""}</section>
   <div class="tf-right">
    <section class="tf-sec tf-own"><h5>Eigene Lage/Nachforderung</h5><div class="row"><div class="zz">${tz("Führungsstellen/EL", { w: 62, h: 62 })}</div>
     <dl><dt>Befehlsstelle:</dt><dd>${fe("el-bst", "ELW 1 C-Dienst")}</dd><dt>Kommunikation:</dt><dd>${fe("el-kom", "MUS_90")}</dd><dt>Auftrag:</dt><dd>${fe("el-auftrag", "Einsatzleitung")}</dd></dl>
     <dl><dt>Einsatzbeginn:</dt><dd>${fe("el-beginn", dtg(0))}</dd><dt>Kräfteübersicht:</dt><dd>${fe("el-kraefte", `${ks.f}/${ks.u}/${ks.m}/${ks.g}${ks.offen ? " + " + ks.offen : ""}`)}</dd><dt>Fahrzeuge:</dt><dd>${fe("el-fz", ks.fz)}</dd></dl></div>
     <div class="tf-nachf">${nachf.map(l => `<div><span>${esc(l.txt.replace("Nachforderung: ", ""))}</span><span>${dtg(l.t)}${l.done ? " ✓" : ""}</span></div>`).join("")}${[0, 1, 2, 3, 4, 5].map(k => `<div class="frei">${fe("nf-" + k, "")}${fe("nf-" + k + "-z", "", "zeit")}</div>`).join("")}</div></section>
    <section class="tf-sec tf-org"><h5>Organisation / Kommunikation</h5><div class="tf-orggrid"><div class="tf-stellen">${stellen.map((s, k) => `<div>${fe("st-" + k, s[1])}${fe("st-" + k + "-v", G.keys.has(s[0]) ? "✓" : "", "hak")}</div>`).join("")}${Array.from({ length: Math.max(2, 9 - stellen.length) }, (_, k) => `<div>${fe("st-frei-" + k, "")}${fe("st-frei-" + k + "-v", "", "hak")}</div>`).join("")}</div><div class="tf-tree">${tafelBaum()}</div></div></section>
    <section class="tf-sec tf-rm"><h5>Rückmeldung / Benachrichtigungen / Notizen</h5>${rm.map(l => `<div class="r"><span class="c ${l.prio ? "h" : ""}"></span><span class="b">${l.done ? "✓" : ""}</span><span>${esc(l.txt)}</span><span class="d">${dtg(l.t)}</span></div>`).join("")}${[0, 1, 2, 3, 4, 5].map(k => `<div class="r frei"><span class="c"></span>${fe("rm-" + k + "-b", "", "b")}${fe("rm-" + k, "")}${fe("rm-" + k + "-d", "", "d")}</div>`).join("")}</section>
   </div></div>
   <section class="tf-sec tf-fo"><h5>Führungsorganisation nach FwDV 100${orgaGesperrt() ? (G.abgabe ? " · abgegeben" : " · Eingabe ab Start der Ausarbeitung") : ""}</h5>${orgaHTML(orgaGesperrt())}</section>
   <div class="tf-ab">${tafelAbs()}</div>`;
  if (!orgaGesperrt()) bindOrga(T);
  if (window.Lagezeichnen) window.Lagezeichnen.montiere($("#tfSketch"), { kompakt: true, leiste: $("#lsWerkzeugeInhalt"), panel: $("#lsWkSeite") });
  if (fokus) { const el = T.querySelector(`[data-tf="${CSS.escape(fokus)}"]`); if (el) { el.focus(); const r = document.createRange(); r.selectNodeContents(el); r.collapse(false); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); } }
}
(function tafelFelder() {
  const T = $("#tafel");
  const feld = e => e.target.closest && e.target.closest("[data-tf]");
  T.addEventListener("input", e => {
    const el = feld(e); if (!el || !G) return;
    const v = el.innerText.replace(/\n/g, " ");
    if (v === el.dataset.std) { delete G.tf[el.dataset.tf]; el.classList.remove("ed"); } else { G.tf[el.dataset.tf] = v; el.classList.add("ed"); }
  });
  T.addEventListener("keydown", e => {
    const el = feld(e); if (!el) return;
    e.stopPropagation();
    if (e.key === "Enter" || e.key === "Escape") { e.preventDefault(); el.blur(); }
  });
  T.addEventListener("paste", e => {
    if (!feld(e)) return; e.preventDefault();
    const t = (e.clipboardData || window.clipboardData).getData("text").replace(/\s+/g, " ").slice(0, 300);
    document.execCommand("insertText", false, t);
  });
  T.addEventListener("drop", e => { if (feld(e)) e.preventDefault(); });
  T.addEventListener("contextmenu", e => {
    const el = feld(e); if (!el || !G || !Object.prototype.hasOwnProperty.call(G.tf, el.dataset.tf)) return;
    e.preventDefault(); delete G.tf[el.dataset.tf]; el.textContent = el.dataset.std; el.classList.remove("ed"); toast("Feld auf Vorbelegung zurückgesetzt");
  });
})();
function tafelOffen() { return !!G && !!window.Ansicht && window.Ansicht.modus() === "tafel"; }
/* Zoom der Arbeitstafel: automatisch auf Breite eingepasst, bis der Nutzer selbst zoomt
   (Knöpfe, Strg + Mausrad, zwei Finger, Tasten + − 0) */
let tafelZ = null;
const ZMIN = 0.25, ZMAX = 3;
function zAktuell() { return parseFloat($("#tafel").style.zoom) || 1; }
function zSetzen(z) { $("#tafel").style.zoom = z.toFixed(3); $("#lsZoomTxt").textContent = Math.round(z * 100) + " %"; }
function tafelZoom() { const h = $("#lsHost"); if (!h.clientWidth) return; zSetzen(tafelZ != null ? tafelZ : Math.max(ZMIN, Math.min(1.4, (h.clientWidth - 24) / 1480))); }
function tafelZoomUm(f, cx, cy) {
  const h = $("#lsHost"), alt = zAktuell(), neu = Math.max(ZMIN, Math.min(ZMAX, alt * f));
  if (cx == null) { cx = h.clientWidth / 2; cy = h.clientHeight / 2; }
  const ix = (h.scrollLeft + cx) / alt, iy = (h.scrollTop + cy) / alt;
  tafelZ = neu; zSetzen(neu);
  h.scrollLeft = ix * neu - cx; h.scrollTop = iy * neu - cy;
}
function tafelGanz() {
  const h = $("#lsHost"), T = $("#tafel"), hoehe = T.getBoundingClientRect().height / zAktuell();
  tafelZ = Math.max(ZMIN, Math.min((h.clientWidth - 24) / 1480, (h.clientHeight - 24) / hoehe)); zSetzen(tafelZ); h.scrollTop = 0; h.scrollLeft = 0;
}
$("#lsPlus").addEventListener("click", () => tafelZoomUm(1.25));
$("#lsMinus").addEventListener("click", () => tafelZoomUm(1 / 1.25));
$("#lsZoomTxt").addEventListener("click", () => { tafelZ = null; tafelZoom(); });
$("#lsGanz").addEventListener("click", tafelGanz);
$("#lsHost").addEventListener("wheel", e => {
  if (!e.ctrlKey && !e.metaKey) return;
  e.preventDefault(); const r = $("#lsHost").getBoundingClientRect();
  tafelZoomUm(Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.002)), e.clientX - r.left, e.clientY - r.top);
}, { passive: false });
let pinch = null;
$("#lsHost").addEventListener("touchstart", e => { if (e.touches.length === 2) { const [a, b] = e.touches; pinch = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) }; } }, { passive: true });
$("#lsHost").addEventListener("touchmove", e => {
  if (!pinch || e.touches.length !== 2) return; e.preventDefault();
  const [a, b] = e.touches, d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), r = $("#lsHost").getBoundingClientRect();
  tafelZoomUm(d / pinch.d, (a.clientX + b.clientX) / 2 - r.left, (a.clientY + b.clientY) / 2 - r.top); pinch.d = d;
}, { passive: false });
$("#lsHost").addEventListener("touchend", e => { if (e.touches.length < 2) pinch = null; });
document.addEventListener("keydown", e => {
  if (!tafelOffen() || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || document.activeElement.isContentEditable || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === "+" || e.key === "=") { e.preventDefault(); tafelZoomUm(1.25); }
  else if (e.key === "-") { e.preventDefault(); tafelZoomUm(1 / 1.25); }
  else if (e.key === "0") { e.preventDefault(); tafelZ = null; tafelZoom(); }
});
if (window.ResizeObserver) new ResizeObserver(() => { if (tafelOffen()) tafelZoom(); }).observe($("#lsHost"));
function oeffneTafel() { if (!G || !window.Ansicht) return; window.Ansicht.setze("tafel"); }
// Eingaben der Führungsorganisation in der Tafel: Werte sofort übernehmen, nur die abhängigen Teile neu zeichnen
function bindOrga(T) {
  const teile = () => { const a = T.querySelector(".tf-ab"), t = T.querySelector(".tf-tree"); if (a) a.innerHTML = tafelAbs(); if (t) t.innerHTML = tafelBaum(); const k = $("#orgaKurz"); if (k) k.innerHTML = orgaKurz(); };
  const neu = () => { const h = $("#lsHost"), st = h.scrollTop; renderTafel(); h.scrollTop = st; refreshLight(); };
  T.querySelectorAll("[data-or]").forEach(el => el.addEventListener("input", () => { G.orga[+el.dataset.or][el.dataset.f] = el.value; teile(); }));
  T.querySelectorAll("[data-fo]").forEach(el => el.addEventListener("input", () => { G.fo[el.dataset.fo] = el.value; }));
  T.querySelectorAll("[data-uea]").forEach(el => el.addEventListener("input", () => { const [i, j] = el.dataset.uea.split(":").map(Number); G.orga[i].uea[j] = el.value; }));
  T.querySelectorAll("[data-ueaadd]").forEach(b => b.addEventListener("click", () => { G.orga[+b.dataset.ueaadd].uea.push(""); neu(); }));
  T.querySelectorAll("[data-ueadel]").forEach(b => b.addEventListener("click", () => { const [i, j] = b.dataset.ueadel.split(":").map(Number); G.orga[i].uea.splice(j, 1); neu(); }));
  T.querySelectorAll("[data-ordel]").forEach(b => b.addEventListener("click", () => { G.orga.splice(+b.dataset.ordel, 1); neu(); }));
  const oa = T.querySelector("#orAdd"); if (oa) oa.addEventListener("click", () => { G.orga.push({ ea: "", eal: "", rg: "", frn: "", auftrag: "", uea: [] }); neu(); });
}
$("#btnTafel").addEventListener("click", oeffneTafel);
document.addEventListener("keydown", e => { if (e.key === "Escape") { if (window.Ansicht && window.Ansicht.voll()) $("#lsVoll").click(); else schliesseDrawer(); } });

/* ───────── Start ───────── */
document.addEventListener("keydown", e => { if (e.key === "Escape" && !$("#listeOv").hidden) $("#listeOv").hidden = true; });
karteWachen(); if (has3D) K3.ueberoertlich(MS.ueber, { esc }); karteSzenarien(); renderRail(); renderBar();
function stadtMarken() {
  if (!G) { const sz = szAuswahl && SZ.find(s => s.id === szAuswahl); return { est: sz ? { x: sz.x, y: sz.y, titel: sz.titel, art: "Szenario" } : null, fz: [] }; }
  const fz = []; let vorOrt = 0;
  G.items.forEach(it => {
    if (it.da && !it.def.ziel) vorOrt++;
  });
  return { est: { x: G.sz.x, y: G.sz.y, titel: G.sz.titel, art: "Einsatzstelle", vorOrt }, fz };
}
function szAktualisieren() { if (!G) { karteSzenarien(); renderRail(); } if (!$("#listeOv").hidden) renderListe(); }
const wachenPunkte = () => Object.values(WACHEN).map(w => ({ x: w.x, y: w.y, art: w.art, k: w.art === "ff" ? String(w.nr) : w.kurz, name: w.name }));
function lageGeaendert(ausEditor) { if (!G) return; if (tafelOffen() && !ausEditor) renderTafel(); const b = $("#akteBody"), st = b.scrollTop; renderAkte(); b.scrollTop = st; }
window.__pms = { tz, lageGeaendert, renderTafel: () => { if (G) { renderTafel(); tafelZoom(); } }, tafelZoom, get G() { return G; }, starte, anfordern, ANF, svgLage, zufall, abgeben, stadtMarken, TYPEN, railGruppen, tzDef, kurz, toast, szAktualisieren, wachenPunkte };
})();
