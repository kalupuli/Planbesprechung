# Planbesprechung Musterstadt

Browserbasiertes Planspiel für Planbesprechungen im Sinne der Abschlussprüfung nach VAP 2.2. Der Prüfling übernimmt als C-Dienst (Verbandsführer) die Einsatzleitung und durchläuft den Ablauf der Prüfung: Alarm, Übergabe mit Unterlagen, Erkundung mit Nachfragen, 4 Minuten Ausarbeitung (Führungsorganisation mit Abschnittsbildung, weitere Maßnahmen, Lagemeldung, Nachalarmierung), Rückfragen der Kommission und O-Ton in der Pressekonferenz. Grundlage ist die IdF-NRW-Lernunterlage B2-211 »Musterstadt«, die Lagedarstellung folgt der Taktischen Arbeitstafel für die Führungsstufen B + C.

## Aufbau

| Datei | Inhalt |
|---|---|
| `index.html` | Gerüst der Oberfläche |
| `css/spiel.css` | Gestaltung, Beschriftungen der Karte, Arbeitstafel |
| `js/daten.js` | Stammdaten: Wachen, Fahrzeuge, anforderbare Einsatzmittel, überörtliche Einheiten, externe Stellen, MANV-Stufen, Stärken |
| `js/szenarien.js` | Szenarien (eine Planbesprechung je Objekt) |
| `js/karte3d.js` | 3D-Karte mit WebGL: Platte, Gebäude, Einsatzstelle, Fahrzeuge, Kamera |
| `js/spiel.js` | Spiellogik: Lage zur Übergabe, Ablauf, Countdown, Bewertung, Lagekarte, Arbeitstafel, Szenarienliste, Zufallsauswahl |
| `vendor/` | Three.js 0.147 mit MapControls und CSS2DRenderer (MIT-Lizenz), lokal eingebunden |
| `js/zeichen.js` | Taktische Zeichen als SVG (Jonas Köritz, CC BY 4.0), erzeugt mit `tools/zeichen.py` |
| `assets/karte.svg`, `js/kartesvg.js` | Vektorisierte, textfreie Karte aus Anhang I der Lernunterlage, Grundlage der 3D-Platte |
| `assets/karte.webp` | Bisherige Rastertextur, dient nur noch als Maske der Stadtgrenze für `tools/karte_vektor.py` |
| `assets/*.pdf` | Originalunterlagen: Lernunterlage B2-211 »Musterstadt« und Taktische Arbeitstafel B + C |
| `assets/stadtkarte.svg` | Originalkarte aus Anhang I der Lernunterlage (Seite 25) mit Beschriftung als Vektor für die 2D-Stadtkarte |
| `js/stadtkarte.js` | Umschaltbare Stadtkarte mit Einsatzstelle |
| `js/login.js` | Anmeldeschwelle mit Passwortprüfung |
| `js/lagezeichnen.js` | Ergänzen der Lagekarte durch den Prüfling: Freihand, Linien, Pfeile, Kreise, Text und taktische Zeichen |
| `js/editor.js` | Lagen-Editor: eigene Lagen anlegen, bearbeiten, speichern, exportieren und importieren |
| `js/unterlagen.js` | Anzeige der Originalunterlagen mit Kapitelsprung, Seitenwechsel, Zoom und Speichern |
| `vendor/pdf*.js` | pdf.js 3.11.174 (Mozilla, Apache 2.0) für die PDF-Anzeige |
| `tools/karte_vektor.py` | Erzeugt `assets/karte.svg`, `js/kartesvg.js` und `assets/stadtkarte.svg` aus der PDF-Seite |
| `tools/build.py` | Erzeugt `dist/planspiel-musterstadt.html` als eine eigenständige Datei |

Starten: `index.html` direkt im Browser öffnen oder über einen lokalen Server (`python3 -m http.server`). Für die Weitergabe `python3 tools/build.py` ausführen und die Datei aus `dist/` verwenden.

## Bedienung

- **Karte:** WebGL-Szene mit Licht und Schatten. Ziehen verschiebt, rechte Maustaste oder zwei Finger drehen und neigen, Mausrad oder Spreizen zoomt. Knöpfe unten rechts für Drehen, 2D/3D, Zoom und Zurücksetzen. Ohne WebGL wird eine flache Karte angezeigt.
- **Stadtkarte:** Der Knopf »Stadtkarte« oben rechts auf der Karte blendet die Originalkarte aus Anhang I ein. Hierbei wird die Einsatzstelle mit der Zahl der Einheiten vor Ort lagerichtig eingetragen. Verschieben, Zoomen und der Sprung zur Einsatzstelle sind möglich, »3D-Karte« führt zurück.
- **Vektorkarte:** Die Platte wird aus der Vektorkarte gezeichnet. Beim Hineinzoomen wird der sichtbare Ausschnitt nach jeder Kamerabewegung neu und verlustfrei aus dem SVG gerendert, Straßen und Grenzen bleiben somit in jeder Zoomstufe scharf. Die Stadtkarte mit Beschriftung ist ebenfalls vektorbasiert.
- **Fahrzeuge und Gebäude:** Fahrzeuge werden als Modelle nach Fahrzeugart dargestellt (Löschfahrzeug, Drehleiter, Wechsellader, Gerätewagen, Rettungswagen, Kommandowagen). Wachen und Gerätehäuser werden beim Hineinzoomen verkleinert, damit Straßen und Umgebung lesbar bleiben.
- **Szenarien:** Auswahl über die Karte, die Liste »Alle Szenarien« mit Suche und Filter oder per Zufallsszenario.
- **Alarm:** Nach der Alarmmeldung führt »Zur Übergabe« direkt an die Einsatzstelle. Der ELW 1 des C-Dienstes steht als roter Einsatzleitwagen bereits vor Ort.
- **Ablauf:** Die Ausarbeitung läuft mit einem 4-Minuten-Countdown und wird danach gesperrt. Nach der Abgabe angeforderte Kräfte werden nicht gewertet.
- **KI-Rollen (optional):** Im Claude-Viewer beantwortet der Zugführer freie Nachfragen, die Kommission stellt eine individuelle Rückfrage und die Pressestelle gibt Rückmeldung zum O-Ton. Ohne diese Funktion werden die hinterlegten Nachfragen genutzt.
- **Wachen:** Antippen zeigt Fahrzeuge, Stärken und Abrollbehälter. Im Einsatz werden hier Einsatzmittel mit Anfahrtszeit in Minuten alarmiert.
- **Technisches Hilfswerk:** Der THW-Ortsverband Musterstadt steht als blaue Unterkunft auf der Karte. Anforderbar sind Fachberater THW, zwei Technische Züge (mit FGr N und FGr Räumen), FGr Elektroversorgung, FGr Wasserschaden/Pumpen und Trupp UL. Überörtlich stehen FGr Ortung, FGr Schwere Bergung sowie die Fachzüge Führung/Kommunikation und Logistik auf dem Holzrand.
- **Überörtliche Einheiten:** Stehen dauerhaft auf dem Holzrand der Platte und werden nach der Alarmierung als »alarmiert« gekennzeichnet. Je Organisation wird eine Seite belegt: Sanitätsdienst im Westen (weiß), ABC-Schutz im Norden (orange), THW im Osten (blau), Bezirksbereitschaft Feuerwehr im Süden (rot). Die Kategorie wird in `js/daten.js` über das Feld `kat` (`san`, `abc`, `fw`, `thw`) festgelegt.
- **Alarmierbare Einheiten:** Leiste rechts mit Stichworten und allen Einheiten in Gruppen, Suche und Alarmieren-Knopf.
- **Taktische Zeichen:** Offizielle Zeichen nach DV 102 aus dem Zeichensatz von Jonas Köritz in Lagekarte, Arbeitstafel, Einheitenliste, Wachenübersicht und auf den Fahrzeugmarken.
- **Keine Spieldynamik:** Die Lage wird beim Start des Szenarios zum Zeitpunkt der Übergabe festgelegt und ändert sich danach nicht mehr. Kräfte sind vor Ort oder auf Anfahrt. Nur Kräfte vor Ort stehen als Fahrzeug an der Einsatzstelle.
- **Nachalarmierung:** In der Ausarbeitung werden alle Stichworte und Einheiten nach Gruppen angezeigt und per Klick alarmiert, ebenso in der Leiste rechts. Alarmierte Kräfte werden als »alarmiert« geführt und treffen nie ein. Beim Antippen einer Wache oder einer überörtlichen Einheit wird die Anfahrtszeit zur Einsatzstelle in Minuten angezeigt, ebenso in der Meldung nach der Alarmierung und im Hinweis der Kacheln.
- **Unterlagen:** Der Knopf »Unterlagen« in der Kopfleiste öffnet die Original-PDF der Lernunterlage und der Taktischen Arbeitstafel. Für die Lernunterlage steht ein Kapitelverzeichnis zur Verfügung. In der Übergabe führen Direktsprünge zur Karte, zur Fahrzeugübersicht und zur AAO. »PDF speichern« legt das Original als Datei ab.
- **Lagekarte ergänzen:** In der Übergabe, in der Ausarbeitung und auf der Arbeitstafel öffnet »Lagekarte ergänzen« eine Zeichenfläche über der übergebenen Lagekarte. Werkzeuge: Auswählen, taktisches Zeichen (Suche, Gruppen, Klicken oder Ziehen auf die Karte), Stift, Linie, Pfeil, Kreis, Text (Eingabe direkt in der Karte) und Radierer (Klicken oder Wischen). Jedes eigene Element ist direkt anklickbar: Ein Klick wählt es aus, daneben erscheinen »Löschen«, »Duplizieren« und »Beschriften«, Ziehen verschiebt es. Zusätzlich löschen Entf, Rechtsklick und das ✕ in der Liste »Ihre Ergänzungen«. Strg+Z macht rückgängig, Strg+D dupliziert. Die übergebene Lagekarte bleibt unverändert. Die Ergänzungen erscheinen in den Unterlagen und auf der Arbeitstafel und können als SVG gespeichert werden.
- **Arbeitstafel:** Wird mit Eintreffen, Nachforderungen, Benachrichtigungen und der Führungsorganisation fortgeschrieben.

## Anmeldung

Beim Aufruf wird ein Passwort abgefragt. Mit »Auf diesem Gerät angemeldet bleiben« bleibt die Anmeldung im Browser gespeichert, sonst gilt sie bis zum Schließen des Tabs. »Abmelden« steht in der Kopfleiste.

Das Passwort ist nicht im Klartext hinterlegt, sondern als SHA-256-Hash von `pms-musterstadt:` plus Passwort in `js/login.js` (Konstante `HASH`). Ein neues Passwort wird so eingetragen:

```sh
printf '%s' 'pms-musterstadt:NeuesPasswort' | sha256sum
```

Die Anmeldung ist eine Zugangsschwelle im Browser. Wer die Dateien direkt abruft, etwa die PDF-Dateien in `assets/` oder den Quelltext im Repository, wird dadurch nicht gehindert.

## Eigene Lagen

Eigene Lagen werden im Spiel über »Neue Lage« (Leiste rechts oder »Alle Szenarien«) angelegt oder als Kopie eines Beispielszenarios (»Als Vorlage kopieren«) begonnen. Der Lagen-Editor gliedert sich in Grunddaten und Einsatzort (Position durch Antippen der Karte), Alarmierung (Initialmeldung der Leitstelle und alarmierte Einheiten), Übergabe und Unterlagen, Lagekarte (Elemente wählen und in die Karte tippen), Nachfragen, Ausarbeitung (erwartete Abschnitte, Kriterien, Erwartungshorizont der Nachalarmierung), Kommission (Gefahrenmatrix und Rückfragen), Pressekonferenz sowie eine JSON-Ansicht. Im Kopf wird angezeigt, welche Angaben für eine vollständige Bewertung noch fehlen.

- **Speichern:** Im Claude-Viewer werden eigene Lagen privat je Person gespeichert (`db`, Pfad `data/users/<id>/lage-<id>`), außerhalb im Browser (`localStorage`).
- **Exportieren:** Eine einzelne Lage oder alle eigenen Lagen werden als JSON-Datei gespeichert.
- **Importieren:** JSON-Datei über »Importieren« wählen oder auf die Szenarienliste ziehen. Jede importierte Lage wird geprüft und bereinigt (Zahlenfelder, zulässige Elementtypen, bekannte Einheiten). Eine Lage mit bereits vorhandener eigener ID wird aktualisiert.

Austauschformat:

```json
{ "format": "planbesprechung-musterstadt/lagen", "version": 1, "lagen": [ { "titel": "…", "x": 48.5, "y": 40.8, "…": "…" } ] }
```

Eine Lage im Export hat denselben Aufbau wie die Szenarien in `js/szenarien.js`.

## Neues Szenario anlegen

Ein Szenario wird als weiteres Objekt in `window.SZENARIEN` ergänzt. Pflichtfelder:

```js
{
  id: "eindeutige-id", beispiel: false,
  titel: "Kurztitel", typ: "abc" | "brand" | "tunnel",
  x: 46.4, y: 44.6,                        // Einsatzort in Prozent der Kartentextur
  ort: { adresse, detail, wb },
  zeit: "Freitag", datum: "2026-11-06", t0: "17:18", meldender: "…",
  wetter: "…", stichwort: "…",
  meldung: "Initialmeldung der Leitstelle",
  alarmiert: ["LZ1", "FF11", "MANV20"],    // IDs aus daten.js
  cAlarm: 4,                               // Minuten nach t0, Alarmierung C-Dienst
  uebergabe: { von: "B-Dienst 1, …", text: ["Absatz 1", "Absatz 2"] },
  info: [{ titel: "Gefahrstoff", zeilen: [["Stoff", "…"]] }],
  lagekarte: [ /* Elemente, siehe unten */ ],
  nachfragen: [{ f: "Frage", a: "Antwort des Zugführers", wichtig: true }],
  ausarbeitung: [ /* abschnitte, text (massnahmen), text (lage), nachforderung */ ],
  kommission: [ /* matrix (Gefahren), text (Begründung, Befehl, Lageänderung) */ ],
  presse: { anlass, frage, kriterien, sekunden: 60 }
}
```

**Lagekarte** (viewBox 640 × 400): `tz` (beliebiges taktisches Zeichen, `z`: Schlüssel aus `js/zeichen.js`, z. B. `Gefahren/Akute_Gefahr_durch_Gas`, `s`: Größe), `fz` (Fahrzeug, `org`: fw, rd, pol, zivil), `zone` (`kind`: gefahr, absperr), `warn` (Warntafel), `wind`, `wolke`, `rauch`, `wasserschleier`, `el` (Führungsstelle), `personen`, `ablage`, `offen` (fehlende Angabe mit Fragezeichen), `pfeil`, `gebaeude`, `brand`, `flaeche`, `linie` (mittel, wasser, brandwand, gleis), `hydrant`, `schlauch`, `ausgang`, `text`.

**Aufgaben in ausarbeitung und kommission:**
- `text` mit `kriterien: [["Kriterium", Punkte], …]`, Selbstbewertung
- `matrix` mit `soll: ["Atemgifte:Menschen", …]`, Gefahrenmatrix nach FwDV 500
- `abschnitte` mit `soll` und `kann` (Namen aus `MS.abschnitte`)
- `nachforderung` mit `soll: [{ t: "key" | "lz" | "typ", …, pts, label, warum }]`

Die verfügbaren IDs für `alarmiert` und die Bewertung stehen in `js/daten.js` (`anf`, `komponenten`, `ueber`, `extern`, `manv`). FF-Einheiten werden als `FF` plus Nummer angesprochen, z. B. `FF23`.

## Quellenlage

Stärken und Fahrzeuge folgen dem Anhang II der Lernunterlage. Wo die Lernunterlage keine Stärke nennt (z. B. V-Dekon, BTP-B 500, ATF), wird nur die Fahrzeuganzahl gezählt. Fahrzeiten werden aus der Entfernung geschätzt (BF 1 min Ausrückzeit, FF 5 min, Rufbereitschaft zusätzlich 10 min) und legen nur fest, welche der zu Beginn alarmierten Kräfte bei der Übergabe vor Ort oder auf Anfahrt sind.

Die Lernunterlage B2-211 beschreibt keine Einheiten des THW. Der THW-Ortsverband Musterstadt ist daher eine Ergänzung mit fiktivem Standort. Gliederung und Stärken folgen der THW-Stärke- und Ausstattungsübersicht (StAN), die Ausrückzeiten von 15–35 Minuten bilden die ehrenamtliche Alarmierung ab.

## Taktische Zeichen und Lizenz

Die taktischen Zeichen stammen aus [jonas-koeritz/Taktische-Zeichen](https://github.com/jonas-koeritz/Taktische-Zeichen) und stehen unter [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Zum Aktualisieren das Repository klonen und `python3 tools/zeichen.py <Pfad>` ausführen (benötigt `jinja2`). Three.js steht unter der MIT-Lizenz (`vendor/three-LICENSE.txt`), pdf.js unter der Apache-Lizenz 2.0 (`vendor/pdfjs-LICENSE.txt`). Die Lernunterlage B2-211 ist urheberrechtlich durch das IdF NRW geschützt. Laut Urheberrechtsvermerk ist die Vervielfältigung für die Ausbildung der Feuerwehren des Landes Nordrhein-Westfalen ausdrücklich genehmigt, eine darüber hinausgehende Weitergabe bedarf der Genehmigung des IdF NRW.
