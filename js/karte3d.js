/* Planbesprechung Musterstadt · 3D-Karte (WebGL über Three.js, lokal in vendor/)
   Koordinaten der Spiellogik: x, y in Prozent der Kartentextur. Welt: X nach Osten, Z nach Süden, Y nach oben. */
(function () {
"use strict";
const T = window.THREE;
const BW = 90, BD = BW * 3048 / 2560; // Seitenverhältnis der Kartentextur
const RAND = 5.5; // Breite des Holzrands, auf welchem die überörtlichen Einheiten stehen
const K = {};
let scene, camera, renderer, labels, controls, stage, hemi, sun, clock;
let stationen = {}, szObjekte = [], einsatzObj = null, sel = null, hoverObj = null;
const pickables = [], tweens = [], pulses = [];
let cb = {};

const welt = (x, y, h) => new T.Vector3((x / 100 - 0.5) * BW, h || 0, (y / 100 - 0.5) * BD);
K.welt = welt;

function label(html, cls, onClick) {
  const outer = document.createElement("div"); outer.className = "l3";
  const inner = document.createElement(onClick ? "button" : "div"); inner.className = "l3i " + (cls || ""); inner.innerHTML = html;
  if (onClick) { inner.type = "button"; inner.addEventListener("click", e => { e.stopPropagation(); onClick(); }); inner.addEventListener("pointerdown", e => e.stopPropagation()); }
  outer.appendChild(inner);
  const o = new T.CSS2DObject(outer); o.inner = inner; return o;
}
const mat = (c, o) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.75, metalness: 0.05 }, o || {}));
function box(w, h, d, m, x, y, z) { const me = new T.Mesh(new T.BoxGeometry(w, h, d), m); me.position.set(x || 0, (y || 0) + h / 2, z || 0); me.castShadow = true; me.receiveShadow = true; return me; }

/* ───────── Aufbau ───────── */
K.init = function (el, opts) {
  stage = el; cb = opts || {};
  try {
    renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (e) { return false; }
  if (!renderer.getContext()) return false;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.domElement.className = "gl";
  stage.prepend(renderer.domElement);
  labels = new T.CSS2DRenderer(); labels.domElement.className = "labels"; stage.prepend(labels.domElement);
  stage.insertBefore(renderer.domElement, labels.domElement);

  scene = new T.Scene();
  camera = new T.PerspectiveCamera(38, 1, 0.5, 900);
  camera.position.set(-18, 120, 98);

  hemi = new T.HemisphereLight(0xe8f0ff, 0x2a2418, 0.6); scene.add(hemi);
  sun = new T.DirectionalLight(0xfff4e0, 0.85); sun.position.set(-55, 95, 40); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); const sc = sun.shadow.camera; sc.left = -70; sc.right = 70; sc.top = 75; sc.bottom = -75; sc.near = 10; sc.far = 260;
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; scene.add(sun);

  // Unterlage und Platte
  const ground = new T.Mesh(new T.PlaneGeometry(900, 900), new T.MeshStandardMaterial({ color: 0x06090b, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -4.2; ground.receiveShadow = true; scene.add(ground);
  const holz = mat(0x5a3f26, { roughness: 0.85 });
  const rahmen = new T.Mesh(new T.BoxGeometry(BW + 2 * RAND, 4, BD + 2 * RAND), holz); rahmen.position.y = -2.05; rahmen.castShadow = true; rahmen.receiveShadow = true; scene.add(rahmen);
  const kante = new T.Mesh(new T.BoxGeometry(BW + 2 * RAND + 0.4, 0.5, BD + 2 * RAND + 0.4), mat(0x3a2a1c)); kante.position.y = -3.9; scene.add(kante);

  // Grundtextur aus der Vektorkarte, Auflösung nach Grafikkarte (Desktop 4096, Mobil 3072 Pixel Breite)
  const maxT = renderer.capabilities.maxTextureSize || 4096, klein = Math.min(window.innerWidth, window.innerHeight) < 700;
  const TW = Math.min(maxT, klein ? 3072 : 4096), skal = TW / 2560;
  const cv = document.createElement("canvas"); cv.width = TW; cv.height = Math.round(TW * 3048 / 2560);
  const tex = new T.CanvasTexture(cv); tex.encoding = T.sRGBEncoding; tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const top = new T.Mesh(new T.PlaneGeometry(BW, BD), new T.MeshStandardMaterial({ map: tex, color: 0xd2d6c8, roughness: 0.95, metalness: 0 }));
  top.rotation.x = -Math.PI / 2; top.position.y = 0.01; top.receiveShadow = true; top.name = "platte"; scene.add(top);
  const g = cv.getContext("2d");
  const grd = g.createLinearGradient(0, 0, cv.width, cv.height); grd.addColorStop(0, "#768f63"); grd.addColorStop(1, "#4d6845");
  g.fillStyle = grd; g.fillRect(0, 0, cv.width, cv.height);
  for (let i = 0; i < 9000; i++) { g.fillStyle = Math.random() < 0.5 ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.06)"; const r = (2 + Math.random() * 7) * skal; g.beginPath(); g.arc(Math.random() * cv.width, Math.random() * cv.height, r, 0, 7); g.fill(); }
  const img = new Image(); img.onload = () => { g.shadowColor = "rgba(0,0,0,.45)"; g.shadowBlur = 18 * skal; g.shadowOffsetY = 6 * skal; g.drawImage(img, 0, 0, cv.width, cv.height); tex.needsUpdate = true; if (cb.onReady) cb.onReady(); };
  img.src = opts.textur;
  detailInit();

  controls = new T.MapControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.09; controls.screenSpacePanning = false;
  controls.minDistance = 10; controls.maxDistance = 280; controls.maxPolarAngle = 1.3; controls.zoomSpeed = 1.1; controls.rotateSpeed = 0.6;
  controls.target.set(0, 0, 4);
  controls.addEventListener("change", () => {
    controls.target.x = Math.max(-BW / 2, Math.min(BW / 2, controls.target.x));
    controls.target.z = Math.max(-BD / 2, Math.min(BD / 2, controls.target.z));
    controls.target.y = 0;
  });
  controls.addEventListener("change", detailPlanen);
  controls.addEventListener("start", () => { tweens.length = 0; stage.classList.add("drag"); });
  controls.addEventListener("end", () => stage.classList.remove("drag"));

  // Auswahl per Klick und Hover
  const ray = new T.Raycaster(), ptr = new T.Vector2(); let down = null;
  const pick = e => { const r = renderer.domElement.getBoundingClientRect(); ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ptr, camera); const hit = ray.intersectObjects(pickables, true)[0]; if (!hit) return null; let o = hit.object; while (o && !o.userData.pick) o = o.parent; return o; };
  renderer.domElement.addEventListener("pointerdown", e => { down = { x: e.clientX, y: e.clientY }; });
  renderer.domElement.addEventListener("pointerup", e => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) { down = null; return; }
    down = null; const o = pick(e);
    if (o && o.userData.pick.wache && cb.onWache) cb.onWache(o.userData.pick.wache);
    else if (o && o.userData.pick.sz && cb.onSzenario) cb.onSzenario(o.userData.pick.sz);
    else if (o && o.userData.pick.ue && cb.onUeber) cb.onUeber(o.userData.pick.ue);
    else if (cb.onLeer) cb.onLeer();
  });
  let hv = 0;
  renderer.domElement.addEventListener("pointermove", e => { if (e.buttons || performance.now() - hv < 60) return; hv = performance.now(); const o = pick(e); if (o !== hoverObj) { setGlow(hoverObj, false); hoverObj = o; setGlow(o, true); renderer.domElement.style.cursor = o ? "pointer" : ""; } });

  new ResizeObserver(resize).observe(stage); resize();
  clock = new T.Clock(); requestAnimationFrame(loop);
  return true;
};
function setGlow(o, on) {
  if (!o) return; o.traverse(m => { if (m.isMesh && m.material && m.material.emissive && !m.userData.noGlow) m.material.emissive.setHex(on || o === sel ? 0x7a4a00 : 0x000000); });
}
function resize() {
  const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return;
  renderer.setSize(w, h); labels.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
}

/* ───────── Gebäude ───────── */
function feuerwache(farbe) {
  const gr = new T.Group(), rot = mat(farbe), weiss = mat(0xf4f4f4), tor = mat(0xd9dde2, { roughness: 0.4, metalness: 0.3 });
  gr.add(box(4.2, 1.7, 2.6, rot, 0, 0, 0));
  gr.add(box(4.35, 0.18, 2.75, weiss, 0, 1.7, 0));
  for (let i = -1; i <= 1; i++) { const t = box(1.05, 1.15, 0.06, tor, i * 1.3, 0.02, 1.31); t.castShadow = false; t.userData.noGlow = true; gr.add(t); }
  gr.add(box(0.9, 3.6, 0.9, rot, -1.6, 0, -0.85));
  gr.add(box(1.0, 0.16, 1.0, weiss, -1.6, 3.6, -0.85));
  return gr;
}
function geraetehaus() {
  const gr = new T.Group(), rot = mat(0xd93a2e), ziegel = mat(0x3e2622, { roughness: 0.85 }), weiss = mat(0xeeeeee), tor = mat(0xd9dde2, { roughness: 0.4, metalness: 0.3 });
  const B = 2.1, H = 1.0, D = 1.5, ueber = 0.14, first = 0.62;
  gr.add(box(B, H, D, rot, 0, 0, 0));
  // Satteldach: Giebel in Wandfarbe, Dachflächen in Ziegelrot, First entlang der Längsseite
  const form = new T.Shape(); form.moveTo(-D / 2 - ueber, 0); form.lineTo(D / 2 + ueber, 0); form.lineTo(0, first); form.closePath();
  const dachGeo = new T.ExtrudeGeometry(form, { depth: B + 2 * ueber, bevelEnabled: false });
  const dach = new T.Mesh(dachGeo, [rot, ziegel]); dach.rotation.y = Math.PI / 2; dach.position.set(-B / 2 - ueber, H, 0); dach.castShadow = true; dach.receiveShadow = true; gr.add(dach);
  const firstLeiste = box(B + 2 * ueber + 0.04, 0.06, 0.1, mat(0x4a140d), 0, H + first - 0.03, 0); firstLeiste.userData.noGlow = true; gr.add(firstLeiste);
  const t1 = box(0.62, 0.72, 0.05, tor, -0.42, 0.02, D / 2 + 0.01), t2 = box(0.62, 0.72, 0.05, tor, 0.42, 0.02, D / 2 + 0.01);
  t1.castShadow = t2.castShadow = false; t1.userData.noGlow = t2.userData.noGlow = true; gr.add(t1, t2);
  const tuer = box(0.22, 0.5, 0.05, weiss, B / 2 - 0.12, 0.02, D / 2 + 0.01); tuer.castShadow = false; tuer.userData.noGlow = true;
  return gr;
}
function thwUnterkunft() {
  // THW-Unterkunft: Fahrzeughalle in THW-Blau mit hellem Pultdach, Toren und Bürotrakt
  const gr = new T.Group(), blau = mat(0x163084), dach = mat(0xb9c0c8, { roughness: 0.6 }), weiss = mat(0xf2f2f2), tor = mat(0xd9dde2, { roughness: 0.4, metalness: 0.3 });
  gr.add(box(2.8, 1.15, 1.7, blau, 0, 0, 0));
  const d = box(2.95, 0.1, 1.85, dach, 0, 1.15, 0); d.rotation.x = 0.06; gr.add(d);
  [-0.9, 0, 0.9].forEach(x => { const t = box(0.72, 0.8, 0.04, tor, x, 0, 0.86); t.userData.noGlow = true; gr.add(t); });
  const band = box(2.82, 0.12, 0.02, weiss, 0, 0.9, 0.86); band.userData.noGlow = true; gr.add(band);
  gr.add(box(1.0, 0.8, 0.9, mat(0xe9ecef), -1.95, 0, -0.35));
  const z = box(0.06, 0.18, 0.3, blau, -1.95, 0.82, -0.35); gr.add(z);
  return gr;
}
function rettungswache() {
  // Rettungswache: weißer Baukörper mit roter Bauchbinde, rotes Dach mit weißem Kreuz, Fahrzeughalle mit zwei Toren
  const gr = new T.Group(), weiss = mat(0xf4f4f4), rot = mat(0xd2102e), tor = mat(0xd9dde2, { roughness: 0.4, metalness: 0.3 });
  gr.add(box(2.2, 1.1, 1.8, weiss, 0, 0, 0));
  const band = box(2.22, 0.16, 1.82, rot, 0, 0.82, 0); band.userData.noGlow = true; gr.add(band);
  gr.add(box(2.3, 0.12, 1.9, rot, 0, 1.1, 0));
  const c1 = box(1.1, 0.05, 0.32, weiss, 0, 1.22, 0), c2 = box(0.32, 0.05, 1.1, weiss, 0, 1.22, 0); c1.userData.noGlow = c2.userData.noGlow = true; gr.add(c1, c2);
  [-0.5, 0.5].forEach(x => { const t = box(0.78, 0.66, 0.04, tor, x, 0, 0.9); t.userData.noGlow = true; gr.add(t); });
  return gr;
}
K.wachen = function (list) {
  list.forEach(w => {
    const g = w.art === "bf" ? feuerwache(0xc8102e) : w.art === "rd" ? rettungswache() : w.art === "thw" ? thwUnterkunft() : geraetehaus();
    const p = welt(w.x, w.y); g.position.copy(p); g.rotation.y = ((w.nr || w.x * 7) % 5 - 2) * 0.12;
    g.userData.basis = w.art === "bf" ? 1.3 : 1.35; g.scale.setScalar(g.userData.basis);
    g.userData.pick = { wache: w.id }; scene.add(g); pickables.push(g);
    const l = label(w.art === "ff" ? String(w.nr) : w.kurz, "tag3 " + w.art, () => cb.onWache && cb.onWache(w.id));
    l.position.set(0, w.art === "bf" ? 4.4 : w.art === "rd" ? 2.0 : w.art === "thw" ? 1.9 : 2.05, 0); g.add(l);
    stationen[w.id] = { g, l };
  });
};
K.markiereWache = function (id) {
  const prev = sel; sel = id ? stationen[id] && stationen[id].g : null;
  setGlow(prev, false); setGlow(sel, true);
  Object.entries(stationen).forEach(([k, s]) => s.l.inner.classList.toggle("on", k === id));
};
K.dimmeWachen = function (an) { Object.values(stationen).forEach(s => s.l.inner.classList.toggle("dim", !!an)); };

/* ───────── Szenarien und Einsatzstelle ───────── */
function leer(arr) { arr.forEach(o => { scene.remove(o); const i = pickables.indexOf(o); if (i >= 0) pickables.splice(i, 1); o.traverse(m => { if (m.isCSS2DObject && m.element.parentNode) m.element.remove(); }); }); arr.length = 0; }
function ring(r, farbe, op) {
  const m = new T.Mesh(new T.RingGeometry(r * 0.86, r, 64), new T.MeshBasicMaterial({ color: farbe, transparent: true, opacity: op || 0.9, depthWrite: false, side: T.DoubleSide }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.06; m.userData.noGlow = true; return m;
}
K.szenarien = function (list, info) {
  leer(szObjekte); if (einsatzObj) { leer([einsatzObj]); einsatzObj = null; }
  pulses.length = 0;
  list.forEach((sz, i) => {
    const g = new T.Group(); g.position.copy(welt(sz.x, sz.y));
    const mast = new T.Mesh(new T.CylinderGeometry(0.12, 0.12, 7, 10), mat(0xf1a62b, { emissive: 0x5a3a00 })); mast.position.y = 3.5; mast.castShadow = true; g.add(mast);
    const kugel = new T.Mesh(new T.SphereGeometry(0.55, 20, 14), new T.MeshBasicMaterial({ color: 0xffc04d })); kugel.position.y = 7.2; g.add(kugel);
    const r1 = ring(2.2, 0xf1a62b), r2 = ring(2.2, 0xf1a62b); g.add(r1, r2); pulses.push({ m: r1, ph: 0 }, { m: r2, ph: 0.5 });
    const l = label(`<span class="ico">${info.icon(sz)}</span><span><b>${info.esc(sz.titel)}</b><em>${info.unter(sz)}</em></span>`, "pin3" + (list.length > 1 ? " kurz " + (i % 2 ? "rechts" : "links") : " nadel") + (info.done(sz) ? " done" : ""), () => cb.onSzenario && cb.onSzenario(sz.id));
    l.position.y = list.length > 1 ? 8.2 + (i % 3) * 3.4 : 8.2; g.add(l); g.userData.pick = { sz: sz.id }; g.userData.id = sz.id; g.userData.label = l;
    scene.add(g); pickables.push(g); szObjekte.push(g);
  });
  hemi.intensity = 0.6; sun.intensity = 0.85;
};
K.los = function (id) { szObjekte.forEach(g => g.userData.label.inner.classList.toggle("los", g.userData.id === id)); };
K.einsatzstelle = function (sz, info) {
  leer(szObjekte); pulses.length = 0; if (einsatzObj) leer([einsatzObj]);
  const g = new T.Group(); g.position.copy(welt(sz.x, sz.y));
  const disc = new T.Mesh(new T.CircleGeometry(3.4, 64), new T.MeshBasicMaterial({ color: 0xe5223a, transparent: true, opacity: 0.28, depthWrite: false }));
  disc.rotation.x = -Math.PI / 2; disc.position.y = 0.05; g.add(disc);
  const rand = ring(3.4, 0xe5223a, 1); g.add(rand);
  const r1 = ring(3.4, 0xffb020), r2 = ring(3.4, 0xffb020), r3 = ring(3.4, 0xffb020); g.add(r1, r2, r3);
  pulses.push({ m: r1, ph: 0, gross: true }, { m: r2, ph: 0.33, gross: true }, { m: r3, ph: 0.66, gross: true });
  const strahl = new T.Mesh(new T.CylinderGeometry(0.55, 1.1, 46, 24, 1, true), new T.MeshBasicMaterial({ color: 0xff8a1f, transparent: true, opacity: 0.16, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide }));
  strahl.position.y = 23; g.add(strahl);
  const kern = new T.Mesh(new T.CylinderGeometry(0.16, 0.16, 46, 10), new T.MeshBasicMaterial({ color: 0xffe0a0, transparent: true, opacity: 0.45, blending: T.AdditiveBlending, depthWrite: false }));
  kern.position.y = 23; g.add(kern);
  const licht = new T.PointLight(0xff9a3c, 2.4, 30, 1.6); licht.position.y = 4; g.add(licht);
  const l = label(`<span class="ico">${info.icon(sz)}</span><span><small>Einsatzstelle</small><b>${info.esc(sz.titel)}</b><em>${info.esc(sz.ort.adresse)}</em></span>`, "pin3 est");
  l.position.y = 12; g.add(l);
  scene.add(g); einsatzObj = g;
  hemi.intensity = 0.48; sun.intensity = 0.7;
};

/* ───────── Fahrzeuge und Wege ───────── */
const FARBE = { fw: 0xd2102e, rd: 0xf6f6f6, ue: 0x6b3fb5, pk: 0xf1a62b, c: 0xd2102e, thw: 0x163084, abc: 0xd64800 };

/* Fahrzeugmodelle: Vorderseite zeigt nach +X. Geometrien und Materialien werden zwischengespeichert. */
const geoC = {}, matC = {};
const bg = (w, h, d) => geoC[w + "|" + h + "|" + d] || (geoC[w + "|" + h + "|" + d] = new T.BoxGeometry(w, h, d));
const RAD = new T.CylinderGeometry(0.13, 0.13, 0.09, 14); RAD.rotateX(Math.PI / 2);
const FELGE = new T.CylinderGeometry(0.065, 0.065, 0.095, 10); FELGE.rotateX(Math.PI / 2);
function m2(c, o) { const k = c + JSON.stringify(o || {}); return matC[k] || (matC[k] = mat(c, o)); }
const GLAS = () => m2(0x16222b, { roughness: 0.15, metalness: 0.6 });
const BLAU = () => matC.blau || (matC.blau = new T.MeshStandardMaterial({ color: 0x3d6bff, emissive: 0x2347ff, emissiveIntensity: 0.9, roughness: 0.3 }));
function teil(g, w, h, d, m, x, y, z, schatten) {
  const me = new T.Mesh(bg(w, h, d), m); me.position.set(x, y + h / 2, z);
  if (schatten) { me.castShadow = true; me.receiveShadow = true; }
  g.add(me); return me;
}
function raeder(g, xs, b) {
  const reifen = m2(0x161616, { roughness: 0.9 }), felge = m2(0xb9bec4, { metalness: 0.5, roughness: 0.4 });
  xs.forEach(x => [-1, 1].forEach(sz => {
    const r = new T.Mesh(RAD, reifen); r.position.set(x, 0.13, sz * b); g.add(r);
    const f = new T.Mesh(FELGE, felge); f.position.set(x, 0.13, sz * (b + 0.005)); g.add(f);
  }));
}
function blaulicht(g, x, y, breite) {
  teil(g, 0.09, 0.05, breite, m2(0x22262b), x, y, 0);
  teil(g, 0.1, 0.06, 0.11, BLAU(), x, y + 0.01, -breite / 2 + 0.06);
  teil(g, 0.1, 0.06, 0.11, BLAU(), x, y + 0.01, breite / 2 - 0.06);
}
function kabine(g, x0, laenge, hoehe, breite, farbe, unten) {
  // Fahrerhaus mit Frontscheibe, Seitenfenstern und Blaulichtbalken
  const y0 = unten || 0.12;
  teil(g, laenge, hoehe, breite, farbe, x0 + laenge / 2, y0, 0, true);
  teil(g, 0.012, hoehe * 0.42, breite * 0.86, GLAS(), x0 + laenge + 0.006, y0 + hoehe * 0.46, 0);
  [-1, 1].forEach(sz => teil(g, laenge * 0.62, hoehe * 0.36, 0.012, GLAS(), x0 + laenge * 0.6, y0 + hoehe * 0.5, sz * (breite / 2 + 0.006)));
  teil(g, 0.02, 0.07, breite * 0.7, m2(0x2a2e33), x0 + laenge + 0.012, y0 + 0.04, 0);
  [-1, 1].forEach(sz => teil(g, 0.015, 0.05, 0.08, m2(0xfff6d8, { emissive: 0x8a7a40 }), x0 + laenge + 0.01, y0 + 0.12, sz * (breite / 2 - 0.07)));
  blaulicht(g, x0 + laenge * 0.55, y0 + hoehe, breite * 0.82);
}
function streifen(g, x, laenge, y, breite, farbe, h) {
  [-1, 1].forEach(sz => teil(g, laenge, h || 0.045, 0.01, farbe, x, y, sz * (breite / 2 + 0.006)));
}
const ALU = () => m2(0xc5cbd1, { metalness: 0.55, roughness: 0.35 });
function fahrzeug(form, kls) {
  const g = new T.Group(), farbe = m2(FARBE[kls] || FARBE.fw), dunkel = m2(0x2b2f34), weiss = m2(0xf3f3f3), rot = m2(0xd2102e);
  const tagesleucht = m2(0xe3f218, { emissive: 0x3a4000 });
  if (form === "pkw") {
    // Kommandowagen, NEF, Einsatzleitwagen 1
    const b = 0.5; raeder(g, [-0.3, 0.3], b / 2);
    teil(g, 0.95, 0.24, b, farbe, 0, 0.1, 0, true);
    teil(g, 0.5, 0.2, b * 0.92, farbe, -0.06, 0.34, 0, true);
    teil(g, 0.012, 0.15, b * 0.84, GLAS(), 0.2, 0.36, 0); teil(g, 0.012, 0.15, b * 0.84, GLAS(), -0.31, 0.36, 0);
    [-1, 1].forEach(sz => teil(g, 0.44, 0.13, 0.012, GLAS(), -0.06, 0.37, sz * (b * 0.46 + 0.006)));
    streifen(g, 0, 0.95, 0.2, b, kls === "rd" ? rot : kls === "c" ? dunkel : weiss, 0.05);
    blaulicht(g, -0.04, 0.54, b * 0.8);
    return g;
  }
  if (form === "rtw" || form === "elw") {
    // Kastenwagen: Rettungswagen oder Einsatzleitwagen 1 mit Antennen
    const b = 0.56, elw = form === "elw"; raeder(g, [-0.38, 0.42], b / 2);
    teil(g, 1.3, 0.08, b * 0.9, dunkel, 0, 0.06, 0);
    kabine(g, 0.3, 0.34, 0.4, b * 0.94, farbe);
    teil(g, 0.92, elw ? 0.5 : 0.58, b, farbe, -0.16, 0.12, 0, true);
    streifen(g, -0.06, 1.12, 0.28, b, kls === "rd" ? rot : weiss, 0.06);
    if (!elw) streifen(g, -0.06, 1.12, 0.2, b, tagesleucht, 0.05);
    if (elw) {
      [-0.3, -0.5].forEach((x, i) => teil(g, 0.02, 0.32 + i * 0.1, 0.02, m2(0x22262b), x, 0.62, i ? -0.15 : 0.15));
      teil(g, 0.3, 0.1, 0.012, GLAS(), -0.15, 0.46, b / 2 + 0.006);
      teil(g, 0.3, 0.1, 0.012, GLAS(), -0.15, 0.46, -b / 2 - 0.006);
      return g;
    }
    [-1, 1].forEach(sz => teil(g, 0.08, 0.05, 0.08, BLAU(), 0.26, 0.7, sz * (b / 2 - 0.05)));
    [-1, 1].forEach(sz => teil(g, 0.08, 0.05, 0.08, BLAU(), -0.58, 0.7, sz * (b / 2 - 0.05)));
    teil(g, 0.3, 0.1, 0.012, GLAS(), -0.15, 0.55, b / 2 + 0.006);
    return g;
  }
  const b = 0.56;
  if (form === "dlk") {
    // Drehleiter: Fahrgestell, Drehkranz, Leiterpark über dem Fahrerhaus, Korb vorn
    raeder(g, [-0.5, -0.3, 0.46], b / 2);
    teil(g, 1.5, 0.12, b * 0.9, dunkel, -0.05, 0.08, 0);
    kabine(g, 0.36, 0.36, 0.4, b, farbe);
    teil(g, 0.95, 0.24, b, farbe, -0.15, 0.12, 0, true);
    streifen(g, -0.15, 0.95, 0.2, b, weiss);
    const kranz = new T.Mesh(new T.CylinderGeometry(0.2, 0.22, 0.1, 16), dunkel); kranz.position.set(-0.45, 0.41, 0); g.add(kranz);
    const leiter = new T.Group(); leiter.position.set(-0.45, 0.52, 0); leiter.rotation.z = -0.05; g.add(leiter);
    [-1, 1].forEach(sz => teil(leiter, 1.45, 0.07, 0.04, ALU(), 0.6, 0, sz * 0.13, true));
    for (let i = 0; i < 9; i++) teil(leiter, 0.025, 0.03, 0.24, ALU(), 0.0 + i * 0.16, 0.02, 0);
    teil(leiter, 0.16, 0.12, 0.34, m2(0xe8e8e8), 1.38, -0.02, 0);
    return g;
  }
  if (form === "wlf") {
    // Wechsellader mit Abrollbehälter
    raeder(g, [-0.48, -0.28, 0.44], b / 2);
    teil(g, 1.45, 0.1, b * 0.8, dunkel, -0.05, 0.08, 0);
    kabine(g, 0.32, 0.38, 0.42, b, farbe);
    teil(g, 0.08, 0.36, 0.14, dunkel, 0.24, 0.18, 0);
    teil(g, 0.98, 0.44, b * 0.98, m2(kls === "rd" ? 0xf2f2f2 : 0xb40d26), -0.27, 0.2, 0, true);
    streifen(g, -0.27, 0.98, 0.3, b * 0.98, weiss, 0.04);
    [0, 1, 2].forEach(i => [-1, 1].forEach(sz => teil(g, 0.02, 0.4, 0.008, m2(0x8c0a1d), -0.64 + i * 0.33, 0.22, sz * (b * 0.49 + 0.008))));
    return g;
  }
  // Löschfahrzeug (Standard) oder Gerätewagen (Kastenaufbau ohne Rollläden)
  const kasten = form === "kasten";
  raeder(g, [-0.42, 0.4], b / 2);
  teil(g, 1.34, 0.1, b * 0.86, dunkel, -0.02, 0.07, 0);
  kabine(g, 0.3, 0.36, 0.42, b, farbe);
  teil(g, 0.92, 0.54, b, farbe, -0.17, 0.12, 0, true);
  streifen(g, -0.02, 1.26, 0.2, b, weiss, 0.05);
  if (!kasten) {
    // Rollläden: drei Geräteräume je Seite und einer hinten
    [-1, 1].forEach(sz => [0, 1, 2].forEach(i => teil(g, 0.26, 0.3, 0.01, ALU(), -0.52 + i * 0.29, 0.27, sz * (b / 2 + 0.007))));
    teil(g, 0.01, 0.3, b * 0.8, ALU(), -0.635, 0.27, 0);
    // Dachbeladung: Steckleiter und Saugschläuche
    [-1, 1].forEach(sz => teil(g, 0.8, 0.03, 0.03, ALU(), -0.2, 0.67, sz * 0.12));
    for (let i = 0; i < 6; i++) teil(g, 0.02, 0.03, 0.24, ALU(), -0.55 + i * 0.14, 0.67, 0);
    const schl = new T.CylinderGeometry(0.035, 0.035, 0.7, 8); schl.rotateZ(Math.PI / 2);
    [-1, 1].forEach(sz => { const sm = new T.Mesh(schl, dunkel); sm.position.set(-0.2, 0.7, sz * 0.21); g.add(sm); });
  } else {
    teil(g, 0.4, 0.12, 0.012, GLAS(), -0.25, 0.5, b / 2 + 0.006);
    teil(g, 0.4, 0.12, 0.012, GLAS(), -0.25, 0.5, -b / 2 - 0.006);
    teil(g, 0.14, 0.1, 0.18, m2(0x9aa1a8), -0.35, 0.66, 0);
  }
  [-1, 1].forEach(sz => teil(g, 0.06, 0.05, 0.07, BLAU(), -0.6, 0.66, sz * (b / 2 - 0.05)));
  return g;
}
K.fahrzeug = fahrzeug;

K.marke = function (kls, text, x, y, form) {
  const g = new T.Group();
  const f = fahrzeug(form || (kls === "rd" ? "rtw" : kls === "c" ? "elw" : "lf"), kls); f.scale.setScalar(0.95); g.add(f);
  const l = label(text, "tok3 " + kls); l.position.y = 1.45; g.add(l);
  g.position.copy(welt(x, y)); scene.add(g);
  return {
    setze(x2, y2) { const p = welt(x2, y2); const d = p.clone().sub(g.position); if (d.lengthSq() > 1e-6) g.rotation.y = Math.atan2(-d.z, d.x); g.position.copy(p); },
    parke(x2, y2) { g.position.copy(welt(x2, y2)); l.inner.classList.add("da"); },
    weg() { scene.remove(g); if (l.element.parentNode) l.element.remove(); }
  };
};
const info3 = { esc: t => String(t == null ? "" : t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])) };
K.weg = function (von, nach, kls) {
  const a = welt(von.x, von.y, 0.2), b = welt(nach.x, nach.y, 0.2);
  const geo = new T.BufferGeometry().setFromPoints([a, b]);
  const ln = new T.Line(geo, new T.LineDashedMaterial({ color: kls === "rd" ? 0xffffff : 0xf1a62b, dashSize: 1.1, gapSize: 0.8, transparent: true, opacity: 0.9 }));
  ln.computeLineDistances(); scene.add(ln);
  return { weg() { scene.remove(ln); geo.dispose(); } };
};
K.leereMarken = function () { const rm = []; scene.traverse(o => { if (o.userData && o.userData.marke) rm.push(o); }); };


/* ───────── Überörtliche Einheiten auf dem Holzrand ───────── */
const ueberF = {};
// Farbe nach Kategorie: Sanität weiß, ABC orange, Feuerwehr rot, THW blau
const UE_ART = { san: "rd", abc: "abc", fw: "fw", thw: "thw" };
function miniFz(art) { const f = fahrzeug(art === "rd" ? "rtw" : art === "thw" || art === "abc" ? "kasten" : "lf", FARBE[art] ? art : "fw"); f.scale.setScalar(0.85); return f; }
function miniHeli() {
  const g = new T.Group(), weiss = mat(0xf2f2f2), rot = mat(0xd2102e), grau = mat(0x2b3238);
  const rumpf = new T.Mesh(new T.SphereGeometry(0.55, 16, 10), weiss); rumpf.scale.set(1.5, 0.85, 0.9); rumpf.position.y = 0.6; rumpf.castShadow = true; g.add(rumpf);
  g.add(box(1.5, 0.14, 0.14, rot, -1.15, 0.6, 0), box(0.08, 0.45, 0.32, rot, -1.85, 0.6, 0));
  const r1 = box(3.2, 0.04, 0.14, grau, 0, 1.15, 0), r2 = box(0.14, 0.04, 3.2, grau, 0, 1.15, 0); g.add(r1, r2); g.userData.rotor = [r1, r2];
  return g;
}
K.ueberoertlich = function (list, info) {
  const seiten = {};
  list.forEach(u => (seiten[u.rand || "o"] = seiten[u.rand || "o"] || []).push(u));
  Object.entries(seiten).forEach(([seite, us]) => {
    const quer = seite === "n" || seite === "s", laenge = (quer ? BW : BD) - 10;
    us.forEach((u, i) => {
      const art = u.id === "RTH" ? "heli" : UE_ART[u.kat] || "fw", pos = (i + 1) / (us.length + 1) * laenge - laenge / 2, mitte = RAND / 2;
      const g = new T.Group();
      if (seite === "n") g.position.set(pos, 0, -BD / 2 - mitte);
      if (seite === "s") g.position.set(pos, 0, BD / 2 + mitte);
      if (seite === "w") { g.position.set(-BW / 2 - mitte, 0, pos); g.rotation.y = Math.PI / 2; }
      if (seite === "o") { g.position.set(BW / 2 + mitte, 0, pos); g.rotation.y = Math.PI / 2; }
      const fz = new T.Group(); g.add(fz); let heli = null;
      if (art === "heli") { heli = miniHeli(); heli.rotation.y = 0.5; fz.add(heli); }
      else for (let k = 0; k < 3; k++) { const f = miniFz(art); f.position.set((k - 1) * 1.3, 0, 0); f.rotation.y = -Math.PI / 2; fz.add(f); }
      const l = label(`<b>${info.esc(u.kurz)}</b><em hidden></em>`, "ue3 " + (u.kat || "fw"), () => cb.onUeber && cb.onUeber(u.id));
      l.position.set(0, art === "heli" ? 1.9 : 1.3, 0); g.add(l);
      g.userData.pick = { ue: u.id }; scene.add(g); pickables.push(g);
      ueberF[u.id] = { g, fz, l, heli, mehrfach: !!u.mehrfach, eta: u.eta };
    });
  });
  nachSchrift().then(() => randBeschriftung(seiten));
};
/* Beschriftung des Holzrands: je Seite »Überörtliche Einheiten« mit der Organisation, eingebrannt am äußeren Rand */
const ORG_NAME = { san: "Sanitätsdienst", abc: "ABC-Schutz", thw: "THW", fw: "Feuerwehr" };
function randSchrift(text, laenge) {
  const cv = document.createElement("canvas"), W = 4096, H = Math.round(W * 1.7 / laenge);
  cv.width = W; cv.height = H;
  const g = cv.getContext("2d");
  g.font = "700 " + Math.round(H * 0.72) + "px 'Barlow Condensed', 'Arial Narrow', Arial, sans-serif"; g.textBaseline = "middle"; g.textAlign = "center";
  g.fillStyle = "#fbefd9"; g.shadowColor = "rgba(30,18,8,.8)"; g.shadowBlur = 4; g.shadowOffsetY = 2;
  const t = text.toUpperCase().split("").join(String.fromCharCode(8202));
  g.fillText(t, cv.width / 2, H / 2 + 2);
  g.strokeStyle = "rgba(251,239,217,.55)"; g.lineWidth = Math.max(2, H * 0.05); g.shadowBlur = 0;
  const tw = Math.min(cv.width * 0.9, g.measureText(t).width + 60);
  [[cv.width / 2 - tw / 2 - 260, cv.width / 2 - tw / 2 - 20], [cv.width / 2 + tw / 2 + 20, cv.width / 2 + tw / 2 + 260]].forEach(([a, b]) => { g.beginPath(); g.moveTo(Math.max(10, a), H / 2); g.lineTo(b, H / 2); g.stroke(); });
  const tex = new T.CanvasTexture(cv); tex.encoding = T.sRGBEncoding; tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const m = new T.Mesh(new T.PlaneGeometry(laenge, 1.7), new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.renderOrder = 2; return m;
}
function randBeschriftung(seiten) {
  const aussen = RAND * 0.78, y = 0.0;
  Object.entries(seiten).forEach(([seite, us]) => {
    const kats = [...new Set(us.map(u => u.kat).filter(Boolean))];
    const text = "Überörtliche Einheiten" + (kats.length === 1 && ORG_NAME[kats[0]] ? " · " + ORG_NAME[kats[0]] : "");
    const quer = seite === "n" || seite === "s", L = (quer ? BW : BD) - 6;
    const m = randSchrift(text, L), grp = new T.Group(); grp.add(m);
    if (seite === "n") { grp.position.set(0, y, -BD / 2 - aussen); }
    if (seite === "s") { grp.position.set(0, y, BD / 2 + aussen); }
    if (seite === "w") { grp.position.set(-BW / 2 - aussen, y, 0); grp.rotation.y = Math.PI / 2; }
    if (seite === "o") { grp.position.set(BW / 2 + aussen, y, 0); grp.rotation.y = -Math.PI / 2; }
    scene.add(grp);
  });
}
const nachSchrift = () => document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
K.uePos = function (id) { const f = ueberF[id]; if (!f) return null; const p = f.g.position; return { x: (p.x / BW + 0.5) * 100, y: (p.z / BD + 0.5) * 100 }; };
K.ueStatus = function (id, n) {
  const f = ueberF[id]; if (!f) return;
  f.l.inner.classList.toggle("an", n > 0);
  const em = f.l.inner.querySelector("em"); em.textContent = n ? (f.mehrfach && n > 1 ? n + "× alarmiert" : "alarmiert") : ""; em.hidden = !n;
};
K.ueMarkiere = function (id) { Object.entries(ueberF).forEach(([k, f]) => f.l.inner.classList.toggle("on", k === id)); };

/* ───────── Kamera ───────── */
const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
function sph() { const off = camera.position.clone().sub(controls.target); const s = new T.Spherical().setFromVector3(off); return s; }
function fahre(ziel, s2, dauer) {
  const t0 = controls.target.clone(), s1 = sph();
  let dth = s2.theta - s1.theta; while (dth > Math.PI) dth -= 2 * Math.PI; while (dth < -Math.PI) dth += 2 * Math.PI;
  tweens.length = 0;
  tweens.push({ t: 0, d: dauer || 1.2, f: k => {
    const e = ease(k); controls.target.lerpVectors(t0, ziel, e);
    const s = new T.Spherical(s1.radius + (s2.radius - s1.radius) * e, s1.phi + (s2.phi - s1.phi) * e, s1.theta + dth * e);
    camera.position.copy(controls.target).add(new T.Vector3().setFromSpherical(s)); camera.lookAt(controls.target);
  } });
}
function uebersichtRadius() { const a = camera.aspect || 1.4; return a >= 1.15 ? 160 : 160 * 1.15 / a; }
K.fokus = function (x, y, o) {
  o = o || {}; const s = sph();
  fahre(welt(x, y), new T.Spherical(o.dist || 48, o.phi != null ? o.phi : 0.92, o.theta != null ? o.theta : s.theta), o.dauer);
};
K.uebersicht = function (dauer) { fahre(new T.Vector3(0, 0, 4), new T.Spherical(uebersichtRadius(), 0.78, -0.28), dauer); };
K.knopf = function (a) {
  const s = sph();
  if (a === "rotL") s.theta += 0.5; if (a === "rotR") s.theta -= 0.5;
  if (a === "tilt") s.phi = s.phi > 0.3 ? 0.02 : 0.92;
  if (a === "in") s.radius = Math.max(controls.minDistance, s.radius * 0.72);
  if (a === "out") s.radius = Math.min(controls.maxDistance, s.radius / 0.72);
  if (a === "reset") { if (cb.onReset) return cb.onReset(); return K.uebersicht(); }
  fahre(controls.target.clone(), s, 0.6);
  return s.phi < 0.3;
};

/* ───────── Vektordetail: beim Hineinzoomen wird der sichtbare Ausschnitt scharf aus dem SVG gezeichnet ───────── */
const VB = [54, 156, 388, 462]; // Ausschnitt der Kartenseite in pt, entspricht der Plattenfläche
let det = null, detT = 0, detLauf = 0, detLetzt = "";
function detailInit() {
  if (!window.KARTE_SVG) return;
  const n = Math.min(renderer.capabilities.maxTextureSize || 2048, Math.min(window.innerWidth, window.innerHeight) < 700 ? 1536 : 2048);
  const cv = document.createElement("canvas"); cv.width = cv.height = n;
  const tex = new T.CanvasTexture(cv); tex.encoding = T.sRGBEncoding; tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const m = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshStandardMaterial({ map: tex, color: 0xd2d6c8, roughness: 0.95, metalness: 0, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.02; m.receiveShadow = true; m.visible = false; m.renderOrder = 1; m.userData.noGlow = true; scene.add(m);
  const kopf = window.KARTE_SVG.match(/^<svg[^>]*>/)[0], rest = window.KARTE_SVG.slice(kopf.length);
  det = { cv, g: cv.getContext("2d"), tex, m, n, kopf, rest: encodeURIComponent(rest) };
}
function detailPlanen() { if (!det) return; clearTimeout(detT); detT = setTimeout(detailZeichnen, 220); }
function detailZeichnen() {
  const d = camera.position.distanceTo(controls.target);
  if (d > 80) { det.m.visible = false; detLetzt = ""; return; }
  const groesse = Math.max(10, Math.min(70, d * 1.5));
  // Ausschnitt um den Blickpunkt, leicht in Blickrichtung verschoben, auf ein Raster gerundet
  const dir = controls.target.clone().sub(camera.position); dir.y = 0; if (dir.lengthSq() > 0) dir.normalize();
  const raster = groesse / 8;
  const cx = Math.round((controls.target.x + dir.x * groesse * 0.15) / raster) * raster, cz = Math.round((controls.target.z + dir.z * groesse * 0.15) / raster) * raster;
  const key = [cx, cz, groesse].map(v => v.toFixed(2)).join("|"); if (key === detLetzt) return; detLetzt = key;
  const u0 = (cx - groesse / 2) / BW + 0.5, v0 = (cz - groesse / 2) / BD + 0.5, du = groesse / BW, dv = groesse / BD;
  const vb = [VB[0] + u0 * VB[2], VB[1] + v0 * VB[3], du * VB[2], dv * VB[3]].map(v => v.toFixed(3)).join(" ");
  const kopf = det.kopf.replace(/width="[^"]*"/, `width="${det.n}"`).replace(/height="[^"]*"/, `height="${det.n}"`).replace(/viewBox="[^"]*"/, `viewBox="${vb}"`);
  const nr = ++detLauf, img = new Image();
  img.onload = () => {
    if (nr !== detLauf) return;
    det.g.clearRect(0, 0, det.n, det.n); det.g.drawImage(img, 0, 0, det.n, det.n); det.tex.needsUpdate = true;
    det.m.position.set(cx, 0.02, cz); det.m.scale.set(groesse, groesse, 1); det.m.visible = true;
  };
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(kopf) + det.rest;
}

/* ───────── Schleife ───────── */
// Wachen und Gerätehäuser werden beim Hineinzoomen verkleinert, damit Straßen und Umgebung lesbar bleiben.
let letzteF = -1;
function gebaeudeMassstab() {
  const d = camera.position.distanceTo(controls.target);
  const f = Math.min(1, Math.max(0.36, Math.pow(d / 130, 0.8)));
  if (Math.abs(f - letzteF) < 0.004) return; letzteF = f;
  Object.values(stationen).forEach(st => st.g.scale.setScalar(st.g.userData.basis * f));
}
// Kein Rendern, solange eine Vollbildansicht die Karte verdeckt oder die Anmeldung offen ist
const verdeckt = () => document.hidden || document.body.classList.contains("gesperrt") || !!document.querySelector(".overlay:not([hidden]), #stage.lage-an, #stage.stadt-an");
function loop() {
  if (verdeckt()) { clock.getDelta(); requestAnimationFrame(loop); return; }
  const dt = Math.min(0.05, clock.getDelta()), t = clock.elapsedTime;
  if (tweens.length) { const tw = tweens[0]; tw.t += dt / tw.d; tw.f(Math.min(1, tw.t)); if (tw.t >= 1) { tweens.shift(); detailPlanen(); } }
  else controls.update();
  pulses.forEach(p => { const k = ((t * (p.gross ? 0.55 : 0.7)) + p.ph) % 1; const s = p.gross ? 1 + k * 3.2 : 0.4 + k * 1.6; p.m.scale.set(s, s, s); p.m.material.opacity = (1 - k) * 0.85; });
  Object.values(ueberF).forEach(f => { if (f.heli) f.heli.userData.rotor.forEach(r => { r.rotation.y += dt * 1.4; }); });
  gebaeudeMassstab();
  if (cb.onFrame) cb.onFrame(dt);
  renderer.render(scene, camera); labels.render(scene, camera);
  requestAnimationFrame(loop);
}
window.Karte3D = K;
})();
