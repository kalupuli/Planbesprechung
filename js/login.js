/* Planbesprechung Musterstadt · Anmeldeschwelle
   Das Passwort wird nur als gesalzener SHA-256-Hash geprüft. Es handelt sich um eine Zugangsschwelle im Browser,
   nicht um einen Schutz der Dateien selbst. Neues Passwort: Hash von "pms-musterstadt:" + Passwort in HASH eintragen. */
(function () {
"use strict";
const HASH = "e09373429b0d0e35e26cbfaf4d2ff8d6e3be96c17578e665759e8286e646b452";
const SALZ = "pms-musterstadt:", KEY = "pms_login";
const $ = s => document.querySelector(s);
const box = $("#login"), app = $("#app"), form = $("#loginForm"), pw = $("#loginPw"), fehler = $("#loginFehler"), merken = $("#loginMerken");
const sperrbar = () => [app].concat([...document.querySelectorAll(".overlay")]);

// SHA-256 ohne Abhängigkeit, falls crypto.subtle fehlt (z. B. ohne sichere Verbindung)
function sha256js(text) {
  const K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
  const b = new TextEncoder().encode(text), l = b.length, n = ((l + 9 + 63) >> 6) << 6, m = new Uint8Array(n);
  m.set(b); m[l] = 0x80; const dv = new DataView(m.buffer); dv.setUint32(n - 4, l * 8); dv.setUint32(n - 8, Math.floor(l / 0x20000000));
  let h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const r = (x, k) => (x >>> k) | (x << (32 - k)), w = new Uint32Array(64);
  for (let o = 0; o < n; o += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(o + i * 4);
    for (let i = 16; i < 64; i++) { const s0 = r(w[i - 15], 7) ^ r(w[i - 15], 18) ^ (w[i - 15] >>> 3), s1 = r(w[i - 2], 17) ^ r(w[i - 2], 19) ^ (w[i - 2] >>> 10); w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0; }
    let [a, bb, c, d, e, f, g, hh] = h;
    for (let i = 0; i < 64; i++) {
      const t1 = (hh + (r(e, 6) ^ r(e, 11) ^ r(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0, t2 = ((r(a, 2) ^ r(a, 13) ^ r(a, 22)) + ((a & bb) ^ (a & c) ^ (bb & c))) | 0;
      hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = bb; bb = a; a = (t1 + t2) | 0;
    }
    h = h.map((v, i) => (v + [a, bb, c, d, e, f, g, hh][i]) | 0);
  }
  return h.map(v => (v >>> 0).toString(16).padStart(8, "0")).join("");
}
async function sha256(text) {
  try {
    if (window.crypto && crypto.subtle) { const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)); return [...new Uint8Array(d)].map(x => x.toString(16).padStart(2, "0")).join(""); }
  } catch (e) {}
  return sha256js(text);
}
const lies = st => { try { return st.getItem(KEY); } catch (e) { return null; } };
const schreib = (st, v) => { try { v ? st.setItem(KEY, v) : st.removeItem(KEY); } catch (e) {} };

function sperren(an) {
  box.hidden = !an; document.body.classList.toggle("gesperrt", an);
  sperrbar().forEach(el => { if (an) el.setAttribute("inert", ""); else el.removeAttribute("inert"); });
  $("#btnLogout").hidden = an;
  if (an) setTimeout(() => pw.focus(), 50);
}
let versuche = 0, warten = false;
form.addEventListener("submit", async e => {
  e.preventDefault(); if (warten) return;
  const h = await sha256(SALZ + pw.value);
  if (h === HASH) {
    schreib(sessionStorage, h); if (merken.checked) schreib(localStorage, h);
    fehler.textContent = ""; pw.value = ""; versuche = 0; sperren(false);
  } else {
    versuche++; warten = true; fehler.textContent = "Das Passwort ist nicht korrekt.";
    pw.select(); box.querySelector(".login-karte").classList.remove("wackeln"); void box.offsetWidth; box.querySelector(".login-karte").classList.add("wackeln");
    setTimeout(() => { warten = false; }, Math.min(4000, 500 * versuche));
  }
});
$("#btnLogout").addEventListener("click", () => { schreib(sessionStorage, null); schreib(localStorage, null); sperren(true); });
sperren(!(lies(sessionStorage) === HASH || lies(localStorage) === HASH));
})();
