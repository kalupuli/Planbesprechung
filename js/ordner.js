/* Planbesprechung Musterstadt · Ablageordner für Lagen
   Alle JSON-Dateien im Ordner lagen/ (Austauschformat des Lagen-Editors) werden beim Start automatisch geladen.
   Quellen in dieser Reihenfolge:
   1. im Build eingebettete Lagen (window.ORDNER_LAGEN, erzeugt durch tools/build.py)
   2. GitHub Pages: Dateiliste des Ordners über die GitHub-API
   3. lagen/index.json (Inhaltsverzeichnis, erzeugt durch tools/lagen_index.py oder tools/build.py)
   4. Verzeichnisliste eines lokalen Webservers (z. B. python3 -m http.server)
   Lagen aus dem Ordner sind schreibgeschützt und können über »Als Vorlage kopieren« bearbeitet werden. */
(function () {
"use strict";
const P = window.__pms, SZ = window.SZENARIEN, E = window.Editor;
const ORDNER = "lagen/";
const Status = { geladen: 0, dateien: 0, fehler: [], quelle: "", fertig: false };

const slug = t => String(t || "").toLowerCase().replace(/[äöüß]/g, c => ({ ä: "ae", ö: "oe", ü: "ue", ß: "ss" }[c])).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
const istLage = n => /\.json$/i.test(n) && !/^index\.json$/i.test(n.split("/").pop());

function aufnehmen(datei, text) {
  let d; try { d = typeof text === "string" ? JSON.parse(text) : text; } catch (e) { Status.fehler.push(datei + ": kein gültiges JSON"); return 0; }
  const roh = Array.isArray(d) ? d : d && Array.isArray(d.lagen) ? d.lagen : d && d.titel ? [d] : [];
  if (!roh.length) { Status.fehler.push(datei + ": keine Lage gefunden"); return 0; }
  let n = 0;
  roh.slice(0, 100).forEach((l, i) => {
    const basis = slug(String(l && l.id || "").replace(/^(eigen|ordner)-/, "")) || slug(datei.replace(/\.json$/i, "") + (roh.length > 1 ? "-" + (i + 1) : ""));
    const id = "ordner-" + basis;
    if (SZ.some(s => s.id === id)) return;
    const s = E.norm(l, id);
    s.eigen = false; s.ordner = true; s.datei = datei;
    SZ.push(s); n++;
  });
  return n;
}

async function holen(url, art) {
  const r = await fetch(url, { cache: "no-cache" });
  if (!r.ok) throw new Error(r.status);
  return art === "json" ? r.json() : r.text();
}
async function dateiliste() {
  const namen = new Set();
  const loc = window.location, gh = /^([a-z0-9-]+)\.github\.io$/i.exec(loc.hostname);
  if (gh) {
    try {
      const teile = loc.pathname.split("/").filter(Boolean), repo = teile.length && !/\.html?$/i.test(teile[0]) ? teile[0] : gh[1] + ".github.io";
      const liste = await holen(`https://api.github.com/repos/${gh[1]}/${repo}/contents/lagen`, "json");
      if (Array.isArray(liste)) { liste.filter(f => f.type === "file" && istLage(f.name)).forEach(f => namen.add(f.name)); Status.quelle = "GitHub"; }
    } catch (e) {}
  }
  try {
    const idx = await holen(ORDNER + "index.json", "json");
    const arr = Array.isArray(idx) ? idx : idx && Array.isArray(idx.dateien) ? idx.dateien : [];
    arr.filter(n => typeof n === "string" && istLage(n) && !/(^|\/)\.\.(\/|$)/.test(n)).forEach(n => namen.add(n));
    if (arr.length && !Status.quelle) Status.quelle = "index.json";
  } catch (e) {}
  if (!namen.size) {
    try {
      const html = await holen(ORDNER, "text");
      [...html.matchAll(/href="([^"?#]+\.json)"/gi)].map(m => decodeURIComponent(m[1]).split("/").pop()).filter(istLage).forEach(n => namen.add(n));
      if (namen.size) Status.quelle = "Verzeichnisliste";
    } catch (e) {}
  }
  return [...namen].sort((a, b) => a.localeCompare(b, "de"));
}

async function laden() {
  let n = 0;
  if (Array.isArray(window.ORDNER_LAGEN)) {
    Status.quelle = "eingebettet";
    window.ORDNER_LAGEN.forEach(f => { Status.dateien++; n += aufnehmen(f.datei, f.inhalt); });
  } else if (/^https?:$/.test(window.location.protocol)) {
    const namen = await dateiliste();
    Status.dateien = namen.length;
    const texte = await Promise.all(namen.map(name => holen(ORDNER + encodeURI(name), "text").then(t => [name, t]).catch(e => { Status.fehler.push(name + ": nicht ladbar (" + e.message + ")"); return null; })));
    texte.filter(Boolean).forEach(([name, t]) => { n += aufnehmen(name, t); });
  } else {
    Status.quelle = "lokal";
  }
  Status.geladen = n; Status.fertig = true;
  if (n) P.szAktualisieren();
  zeigeStatus();
}

function zeigeStatus() {
  const el = document.querySelector("#lOrdner"); if (!el) return;
  if (!Status.fertig) { el.textContent = "Ablageordner wird gelesen …"; return; }
  let t;
  if (Status.quelle === "lokal") t = "Ablageordner lagen/: Die Datei wurde direkt geöffnet. Lagen aus dem Ordner werden nur über einen Webserver, GitHub Pages oder den Build geladen.";
  else if (!Status.dateien) t = "Ablageordner lagen/: keine Lagen gefunden.";
  else t = `Ablageordner lagen/: ${Status.geladen} ${Status.geladen === 1 ? "Lage" : "Lagen"} aus ${Status.dateien} ${Status.dateien === 1 ? "Datei" : "Dateien"} geladen.`;
  if (Status.fehler.length) t += " Nicht geladen: " + Status.fehler.join(", ") + ".";
  el.textContent = t;
  el.classList.toggle("warn", !!Status.fehler.length);
}

window.Ordner = { status: () => Object.assign({}, Status), zeigeStatus, laden };
laden().catch(e => { Status.fertig = true; Status.fehler.push(String(e && e.message || e)); zeigeStatus(); });
})();
