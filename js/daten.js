/* Planbesprechung Musterstadt · Stammdaten
   Quelle: IdF NRW, Lernunterlage B2-211 »Musterstadt« (Juli 2017), Anhang II maßgeblich.
   Koordinaten x/y in Prozent der Kartentextur (assets/karte.svg, Ausschnitt 54/156 bis 442/618 pt der PDF-Seite 25).
   Stärke als Führer/Unterführer/Mannschaft/Gesamt, Klammer = Besetzung bei Bedarf.

   Anforderbare Einsatzmittel (anf):
     id     eindeutiger Schlüssel, wird in den Szenarien für die Bewertung genutzt
     typen  Fahrzeugtypen, welche mit dem Einsatzmittel kommen (für Typzählungen)
     lz     Anrechnung als Löschzug (1, 0.5 oder 0)
     keys   zusätzliche Bewertungsschlüssel
     ruf    Rufbereitschaft, Ausrückzeit +10 min
     ziel   abweichendes Ziel (z. B. Wachbesetzung)
*/
window.MS = {
  karte: { breiteKm: 24, hoeheKm: 28.6 },

  wachen: [
    { id: "FRW1", kurz: "FRW 1", name: "Feuer- und Rettungswache 1", art: "bf", wb: 1, x: 47.09, y: 38.24,
      rolle: "Innenstadtwache, Führungsstandort, Atemschutzwerkstatt, Rüstkomponenten",
      gruppen: [
        { t: "Führung", tot: "3/3/2/8", v: [["KdoW", "1/-/-/1", "D-Dienst"], ["ELW 1", "1/1/1/3", "C-Dienst"], ["ELW 1", "1/1/-/2", "B-Dienst z.b.V., 01-ELW1-03"], ["ELW 2", "-/1/1/2", "Besetzung durch Leitstelle"]] },
        { t: "Löschzug 1", tot: "1/4/12/17", v: [["ELW 1", "1/1/1/3", "B-Dienst 1"], ["HLF 20", "-/1/5/6"], ["DLA (K) 23/12", "-/1/1/2"], ["HLF 20", "-/1/5/6"]] },
        { t: "Sonderfahrzeuge (Springer)", tot: "-/3/3/6", v: [["RW", "(-/1/1/2)", "ersetzt bei TH die DLK"], ["KW 30", "(-/1/1/2)", "Bus- oder Lkw-Unfall"], ["TLF 4000", "(-/1/1/2)"], ["GW-Atemschutz", "(-/1/1/2)"], ["WLF", "(-/1/1/2)"], ["WLF", "(-/1/1/2)"], ["GW-Höhenrettung", "(-/1/3/4)"], ["MTF", ""]] },
        { t: "Rettungsdienst", tot: "1/1/8/10", v: [["NEF", "1/1/-/2", "01-NEF-01"], ["RTW", "-/-/2/2", "01-RTW-01"], ["RTW", "-/-/2/2", "01-RTW-02"], ["KTW", "-/-/2/2", "01-KTW-01"], ["KTW", "-/-/2/2", "01-KTW-02, 10 h"]] },
        { t: "RD Spitzenbedarf", tot: "(1/1/4/6)", v: [["NEF", "(1/1/-/2)", "01-NEF-02"], ["RTW", "(-/-/2/2)", "01-RTW-03"], ["KTW", "(-/-/2/2)", "01-KTW-03"]] },
        { t: "Reserve", tot: "", v: [["HLF 20", "", "Reserve"], ["DLA (K) 23/12", "", "Reserve, Besetzung durch LZ 11"]] }
      ],
      ab: ["AB-V-Dekon", "AB-Strahlenschutz", "AB-Rüst", "AB-Bau", "AB-Mulde", "AB-Küche"],
      anf: [
        { id: "LZ1", name: "Löschzug 1", typen: ["ELW 1", "HLF 20", "HLF 20", "DLA (K) 23/12"], lz: 1 },
        { id: "RW1", name: "Rüstwagen", typen: ["RW"] },
        { id: "KW1", name: "Kranwagen KW 30", typen: ["KW 30"] },
        { id: "TLF1", name: "TLF 4000", typen: ["TLF 4000"] },
        { id: "GWA", name: "GW-Atemschutz", typen: ["GW-Atemschutz"] },
        { id: "GWH", name: "GW-Höhenrettung", typen: ["GW-Höhenrettung"] },
        { id: "ELW2", name: "ELW 2 mit Führungsunterstützung", typen: ["ELW 2"], keys: ["FUEST"] },
        { id: "DDIENST", name: "D-Dienst (Direktionsdienst)", typen: ["KdoW"], ruf: true },
        { id: "BZBV", name: "B-Dienst z.b.V. (OrgL RD)", typen: ["ELW 1"], keys: ["ORGL"], ruf: true },
        { id: "ABVDEKON", name: "WLF mit AB-V-Dekon", typen: ["WLF"] },
        { id: "ABSTRAHL", name: "WLF mit AB-Strahlenschutz", typen: ["WLF"] },
        { id: "ABRUEST", name: "WLF mit AB-Rüst", typen: ["WLF"] },
        { id: "ABBAU", name: "WLF mit AB-Bau", typen: ["WLF"] },
        { id: "ABMULDE", name: "WLF mit AB-Mulde", typen: ["WLF"] },
        { id: "ABKUECHE", name: "WLF mit AB-Küche", typen: ["WLF"], keys: ["VERPFL"] },
        { id: "RTW1R", name: "Reserve-RTW 01-RTW-03", typen: ["RTW"] },
        { id: "NEF1R", name: "Reserve-NEF 01-NEF-02", typen: ["NEF"] }
      ] },

    { id: "FRW2", kurz: "FRW 2", name: "Feuer- und Rettungswache 2", art: "bf", wb: 2, x: 58.40, y: 51.63,
      rolle: "Innenstadtwache, Rettungsdienstlager, Desinfektion, Taucheinheit",
      gruppen: [
        { t: "Löschzug 2", tot: "1/4/12/17", v: [["ELW 1", "1/1/1/3", "B-Dienst 2"], ["HLF 20", "-/1/5/6"], ["DLA (K) 23/12", "-/1/1/2"], ["HLF 20", "-/1/5/6"]] },
        { t: "Sonderfahrzeuge (Springer)", tot: "-/2/2/4", v: [["TLF 4000", "(-/1/1/2)"], ["WLF", "(-/1/1/2)", "AB-MANV"], ["GW-Öl", "(-/1/1/2)"], ["GW-Tauchen", "(-/1/3/4)"], ["KdoW", "(1/-/-/1)", "LNA, 02-KDOW-01"]] },
        { t: "Rettungsdienst", tot: "1/1/8/10", v: [["NEF", "1/1/-/2", "02-NEF-01"], ["RTW", "-/-/2/2", "02-RTW-01"], ["RTW", "-/-/2/2", "02-RTW-02"], ["KTW", "-/-/2/2", "02-KTW-01"], ["KTW", "-/-/2/2", "02-KTW-02, 10 h"]] },
        { t: "RD Spitzenbedarf", tot: "(1/1/4/6)", v: [["NEF", "(1/1/-/2)", "02-NEF-02"], ["RTW", "(-/-/2/2)", "02-RTW-03"], ["KTW", "(-/-/2/2)", "02-KTW-03"]] }
      ],
      ab: ["AB-MANV", "AB-Sonderlöschmittel", "AB-Boot", "AB-Sand", "AB-Tank"],
      anf: [
        { id: "LZ2", name: "Löschzug 2", typen: ["ELW 1", "HLF 20", "HLF 20", "DLA (K) 23/12"], lz: 1 },
        { id: "TLF2", name: "TLF 4000", typen: ["TLF 4000"] },
        { id: "GWOEL", name: "GW-Öl", typen: ["GW-Öl"] },
        { id: "GWT", name: "GW-Tauchen", typen: ["GW-Tauchen"] },
        { id: "LNA", name: "Leitender Notarzt", typen: ["KdoW"], ruf: true },
        { id: "ABMANV", name: "WLF mit AB-MANV", typen: ["WLF"] },
        { id: "ABSOLM", name: "WLF mit AB-Sonderlöschmittel", typen: ["WLF"] },
        { id: "ABBOOT", name: "WLF mit AB-Boot", typen: ["WLF"] },
        { id: "ABSAND", name: "WLF mit AB-Sand", typen: ["WLF"] },
        { id: "ABTANK", name: "WLF mit AB-Tank", typen: ["WLF"], keys: ["VERPFL"] },
        { id: "RTW2R", name: "Reserve-RTW 02-RTW-03", typen: ["RTW"] },
        { id: "NEF2R", name: "Reserve-NEF 02-NEF-02", typen: ["NEF"] }
      ] },

    { id: "FRW3", kurz: "FRW 3", name: "Feuer- und Rettungswache 3", art: "bf", wb: 3, x: 49.66, y: 74.43,
      rolle: "Außenwache mit Gruppe, Ergänzung zum Löschzug durch FRW 1/2 oder FF",
      gruppen: [
        { t: "Gruppe", tot: "-/2/7/9", v: [["HLF 20", "-/1/5/6"], ["DLA (K) 23/12", "-/1/2/3"]] },
        { t: "Rettungsdienst", tot: "1/1/4/6", v: [["NEF", "1/1/-/2", "03-NEF-01"], ["RTW", "-/-/2/2", "03-RTW-01"], ["KTW", "-/-/2/2", "03-KTW-01"]] },
        { t: "RD Spitzenbedarf", tot: "-/-/4/4", v: [["RTW", "-/-/2/2", "03-RTW-02"], ["KTW", "-/-/2/2", "03-KTW-02"]] }
      ],
      ab: [],
      anf: [
        { id: "GR3", name: "Gruppe FRW 3", typen: ["HLF 20", "DLA (K) 23/12"], lz: 0.5 },
        { id: "RTW3R", name: "Reserve-RTW 03-RTW-02", typen: ["RTW"] }
      ] },

    { id: "RW4", kurz: "RW 4", name: "Rettungswache 4", art: "rd", wb: 1, x: 65.00, y: 31.21,
      rolle: "Hilfsorganisation, Einsatzeinheiten 1 und 2",
      gruppen: [
        { t: "Rettungsdienst", tot: "-/-/4/4", v: [["RTW", "-/-/2/2", "RD MUS 04-RTW-01"], ["KTW", "-/-/2/2", "04-KTW-01, 10 h"]] },
        { t: "Spitzen- und Sonderbedarf", tot: "-/-/4/4", v: [["KTW-B", "-/-/2/2", "04-KTWB-01"], ["ITW", "-/-/2/2", "04-ITW-01"]] },
        { t: "Hilfsorganisation", tot: "4/14/48/66", v: [["Einsatzeinheit", "2/7/24/33", "EE 1"], ["Einsatzeinheit", "2/7/24/33", "EE 2"]] }
      ],
      ab: [],
      anf: [
        { id: "SEGSAN1", name: "SEG-San 1 (aus EE 1)", typen: ["GW-San", "KTW", "KTW"], keys: ["SEGSAN"] },
        { id: "SEGBT1", name: "SEG-Bt 1 (aus EE 1)", typen: ["Betreuungsgruppe"], keys: ["SEGBT"] },
        { id: "EE2", name: "Einsatzeinheit 2 komplett", typen: ["Einsatzeinheit"], keys: ["EE", "SEGBT"] },
        { id: "ITW4", name: "ITW 04-ITW-01", typen: ["ITW"] }
      ] },

    { id: "RW5", kurz: "RW 5", name: "Rettungswache 5", art: "rd", wb: 2, x: 38.04, y: 56.82,
      rolle: "Hilfsorganisation, Einsatzeinheiten 3 und 4, ELW 2 RD",
      gruppen: [
        { t: "Rettungsdienst", tot: "-/-/4/4", v: [["RTW", "-/-/2/2", "RD MUS 05-RTW-01"], ["KTW", "-/-/2/2", "05-KTW-01, 10 h"]] },
        { t: "Spitzen- und Sonderbedarf", tot: "1/-/4/5", v: [["KTW-B", "-/-/2/2", "05-KTWB-01"], ["ELW 2", "1/-/2/3", "KAT MUS 00-ELW2-01"]] },
        { t: "Hilfsorganisation", tot: "4/14/48/66", v: [["Einsatzeinheit", "2/7/24/33", "EE 3"], ["Einsatzeinheit", "2/7/24/33", "EE 4"]] }
      ],
      ab: [],
      anf: [
        { id: "SEGSAN2", name: "SEG-San 2 (aus EE 3)", typen: ["GW-San", "KTW", "KTW"], keys: ["SEGSAN"] },
        { id: "SEGBT2", name: "SEG-Bt 2 (aus EE 3)", typen: ["Betreuungsgruppe"], keys: ["SEGBT"] },
        { id: "EE4", name: "Einsatzeinheit 4 komplett", typen: ["Einsatzeinheit"], keys: ["EE", "SEGBT"] },
        { id: "ELW2RD", name: "ELW 2 RD (Führungsstaffel HiOrg)", typen: ["ELW 2"] }
      ] }
  ],

  /* Freiwillige Feuerwehr: [Nr, Typ, Partner, Sonderaufgabe, x, y, Gesamt, Fahrzeuge] */
  ff: [
    [11, "LZ", null, "Wachbesetzung FRW 1", 45.93, 39.87, "1/4/15/20", [["ELW 1", "1/1/1/3"], ["HLF 20", "-/1/8/9"], ["LF 20", "-/1/5/6"], ["RW", "(-/1/1/2)"]]],
    [12, "LG", 15, "ABC-Komponente", 35.03, 44.61, "1/4/13/18", [["ELW 1", "1/1/1/3"], ["LF 20 KatS", "-/1/8/9"], ["GW-L1", "-/1/2/3"], ["GW-Mess", "-/1/1/2"], ["MTF", "(-/1/7/8)"]]],
    [13, "LZ", null, "MANV-Unterstützung", 47.84, 28.23, "1/4/15/20", [["ELW 1", "1/1/1/3"], ["HLF 20", "-/1/8/9"], ["LF 10", "-/1/5/6"], ["DLA (K) 23/12", "-/1/1/2"], ["RW", "(-/1/1/2)"]]],
    [14, "LG", 28, "Überörtliche Hilfe", 20.72, 46.54, "-/2/13/15", [["LF 20 KatS", "-/1/8/9"], ["GW-L2", "-/1/5/6"]]],
    [15, "LG", 12, "", 27.99, 28.72, "-/2/13/15", [["HLF 20", "-/1/8/9"], ["GW-L2", "-/1/5/6"]]],
    [16, "LG", 17, "", 30.03, 16.41, "-/2/9/11", [["LF 20 KatS", "-/1/8/9"], ["TLF 2000", "-/1/1/2"]]],
    [17, "LG", 16, "", 46.60, 9.20, "-/2/15/17", [["LF 20", "-/1/8/9"], ["MTF", "-/1/7/8"]]],
    [18, "LG", 19, "", 68.14, 14.42, "-/2/15/17", [["HLF 20", "-/1/8/9"], ["MTF", "-/1/7/8"]]],
    [19, "LG", 18, "ABC-Komponente", 63.92, 32.66, "-/3/16/19", [["LF 20 KatS", "-/1/8/9"], ["Dekon-LKW P", "-/1/5/6"], ["ABC-ErkW", "-/1/3/4"], ["MTF", "(-/1/7/8)"]]],
    [21, "LZ", null, "Wachbesetzung FRW 2", 49.74, 56.69, "1/4/15/20", [["ELW 1", "1/1/1/3"], ["HLF 20", "-/1/8/9"], ["LF 20", "-/1/5/6"], ["DLA (K) 23/12", "-/1/1/2"]]],
    [22, "LZ", null, "", 36.26, 56.69, "-/3/14/17", [["HLF 20", "-/1/8/9"], ["LF 10", "-/1/5/6"], ["DLA (K) 23/12", "-/1/1/2"]]],
    [23, "LZ", null, "ABC-Komponente", 63.87, 57.92, "-/4/13/17", [["LF 20 KatS", "-/1/8/9"], ["GW-G", "-/1/1/2"], ["ABC-ErkW", "-/1/3/4"], ["TLF 4000", "-/1/1/2", "Reserve"], ["HLF 20", "(-/1/8/9)", "Reserve"], ["MTF", "(-/1/7/8)"]]],
    [24, "LZ", null, "Wasserversorgung", 68.99, 51.39, "1/4/16/21", [["ELW 1", "1/1/1/3"], ["HLF 20", "-/1/8/9"], ["LF 20 KatS", "-/1/5/6"], ["GW-L2", "-/1/2/3"]]],
    [25, "LZ", null, "", 76.78, 32.66, "-/3/14/17", [["HLF 20", "-/1/8/9"], ["LF 20", "-/1/5/6"], ["TLF 2000", "-/1/1/2"], ["MTF", "(-/1/7/8)"]]],
    [26, "LG", 27, "Überörtliche Hilfe, Boot", 74.77, 63.07, "-/2/9/11", [["LF 20 KatS", "-/1/8/9"], ["RW", "-/1/1/2"], ["GA Boot", ""]]],
    [27, "LG", 26, "Überörtliche Hilfe", 85.44, 64.89, "-/2/9/11", [["HLF 20", "-/1/8/9"], ["TLF 2000", "-/1/1/2"], ["MTF", "(-/1/7/8)"]]],
    [28, "LG", 14, "Überörtliche Hilfe", 15.85, 60.43, "-/2/15/17", [["HLF 20", "-/1/8/9"], ["MTF", "-/1/7/8"]]],
    [31, "LZ", null, "MANV- und IuK-Unterstützung", 54.12, 69.16, "1/4/15/20", [["ELW 1", "1/1/1/3"], ["HLF 20", "-/1/8/9"], ["LF 10", "-/1/7/8"], ["GW-L2", "(-/1/1/2)"], ["MTF", "(-/1/7/8)"]]],
    [32, "LG", 33, "IuK-Unterstützung", 44.10, 79.96, "-/2/9/11", [["HLF 20", "-/1/8/9"], ["RW", "-/1/1/2"], ["MTF", "(-/1/7/8)"]]],
    [33, "LG", 32, "", 33.56, 74.11, "-/2/9/11", [["LF 20 KatS", "-/1/8/9"], ["TLF 2000", "-/1/1/2"], ["GA LIMA", "", "Lichtmast"]]]
  ],

  /* Städtische Sonderkomponenten, welche an einer FF-Einheit anfahren */
  komponenten: {
    11: [{ id: "WB1", name: "Wachbesetzung FRW 1 durch LZ 11", typen: [], ziel: "FRW1", keys: ["WACHE1"] }],
    21: [{ id: "WB2", name: "Wachbesetzung FRW 2 durch LZ 21", typen: [], ziel: "FRW2", keys: ["WACHE2"] }],
    12: [{ id: "ABCZ", name: "ABC-Zug Musterstadt (12 und 23)", typen: ["ELW 1", "LF 20 KatS", "LF 20 KatS", "GW-Mess", "GW-G", "WLF"] },
         { id: "MESSZ", name: "Messzug Musterstadt (12, 19, 23)", typen: ["ELW 1", "ABC-ErkW", "ABC-ErkW", "MTF", "MTF", "MTF"], keys: ["MESS"] }],
    19: [{ id: "PDEKON", name: "P-Dekon (19 mit AB-V-Dekon)", typen: ["Dekon-LKW P", "LF 20 KatS", "WLF"] },
         { id: "GDEKON", name: "G-Dekon (19 mit GW-L1 der 12)", typen: ["LF 20 KatS", "GW-L1"] }],
    23: [{ id: "VDEKON", name: "V-Dekon 50 (12, 19, 23 und BF)", typen: ["LF 20 KatS", "GW-G"], keys: ["VDEKON"] }],
    24: [{ id: "WASSER", name: "EA Wasserversorgung (LZ 24 mit GW-L2)", typen: [], keys: ["WASSER"] }]
  },

  /* Überörtliche Einheiten: stehen auf dem Holzrand, je Organisation eine Seite (Sanität West, ABC Nord, THW Ost, Feuerwehr Süd), und fahren von dort an */
  ueber: [
    { id: "UMANV", kat: "san", kurz: "ÜMANV-S", name: "ÜMANV-S Nachbarkreis", eta: 22, mehrfach: true, info: "1 NEF, 2 RTW, 1 KTW oder RTW", rand: "w" },
    { id: "RTH", kat: "san", kurz: "RTH", name: "Rettungshubschrauber", eta: 12, mehrfach: true, info: "1 Notarzt, 1 Notfallsanitäter, 1 Pilot", rand: "w" },
    { id: "PTZ", kat: "san", kurz: "PT-Z 10", name: "Patiententransport-Zug 10 NRW", eta: 55, mehrfach: true, info: "4 RTW, 4 KTW, 2 NEF, Führung", rand: "w" },
    { id: "BHPB", kat: "san", kurz: "BHP-B 50", name: "Behandlungsplatz-Bereitschaft 50 NRW", eta: 80, info: "Behandlungsplatz für 50 Patienten je Stunde", rand: "w" },
    { id: "BTPB", kat: "san", kurz: "BTP-B 500", name: "Betreuungsplatz-Bereitschaft 500 NRW", eta: 95, info: "Betreuung und Verpflegung von 500 Betroffenen", rand: "w" },
    { id: "ABCZNRW", kat: "abc", kurz: "ABC-Z NRW", name: "ABC-Zug NRW Nachbarkreis", eta: 55, info: "ABC-Zug nach ABC-Schutz-Konzept NRW", rand: "n" },
    { id: "MESSNRW", kat: "abc", kurz: "Messzug", name: "Messzug NRW Nachbarkreis", eta: 50, keys: ["MESS"], info: "Messen und Warnen im Ausbreitungsgebiet", rand: "n" },
    { id: "VDEKNRW", kat: "abc", kurz: "V-Dekon", name: "V-Dekon NRW Nachbarkreis", eta: 75, keys: ["VDEKON"], info: "Verletzten-Dekontaminationsplatz", rand: "n" },
    { id: "ATF", kat: "abc", kurz: "ATF", name: "Analytische Task Force", eta: 120, info: "Mobile Analytik, Fachberatung Gefahrstoffe", rand: "n" },
    { id: "BEZB", kat: "fw", kurz: "Bez.-Ber.", name: "Bezirksbereitschaft Feuerwehr", eta: 65, lz: 4, info: "Führung, 4 Löschzüge, Sonderfahrzeuge", rand: "s" },
    { id: "THWO", kat: "thw", kurz: "THW FGr O", name: "THW FGr Ortung Typ B", eta: 80, thw: true, info: "Biologische und technische Ortung verschütteter Personen, THW-OV Nachbarkreis", rand: "o" },
    { id: "THWSB", kat: "thw", kurz: "THW FGr SB", name: "THW FGr Schwere Bergung Typ B", eta: 95, thw: true, info: "Schweres Bergungsgerät, Abstützen, Schreitbagger, THW-OV Nachbarkreis", rand: "o" },
    { id: "THWFK", kat: "thw", kurz: "THW FZ FK", name: "THW Fachzug Führung/Kommunikation", eta: 100, thw: true, info: "Führungsunterstützung und Kommunikation für Einsatzleitung und Stab", rand: "o" },
    { id: "THWLOG", kat: "thw", kurz: "THW FZ Log", name: "THW Fachzug Logistik", eta: 120, thw: true, info: "Verpflegung, Materialwirtschaft und Instandsetzung für Einsatzkräfte", rand: "o" }
  ],

  /* Externe Stellen: werden sofort informiert oder angefordert, ohne Kartenbewegung */
  extern: [
    { id: "POL", name: "Polizei", info: "Absperrung, Verkehrslenkung, Ermittlungen" },
    { id: "WARN", name: "Warnung der Bevölkerung", info: "Warn-App, Sirenen, Lautsprecherdurchsagen, Medien" },
    { id: "TUIS", name: "TUIS Fachberatung", info: "Transport-Unfall-Informations- und Hilfeleistungssystem der Chemie" },
    { id: "UWB", name: "Untere Wasserbehörde", info: "Gewässer- und Bodenschutz" },
    { id: "BEZREG", name: "Bezirksregierung Lagedienst", info: "Information bei Großlage, MANV 50 oder überörtlicher Hilfe" },
    { id: "KH", name: "Krankenhäuser", info: "Vorwarnung, Aufnahmekapazitäten" },
    { id: "PSNV", name: "PSNV und Notfallseelsorge", info: "Betreuung von Betroffenen und Angehörigen" },
    { id: "BUS", name: "Busse der Verkehrsbetriebe", info: "Wärme und Transport für Betroffene" },
    { id: "VB", name: "Notfallmanager Verkehrsbetriebe", info: "U-Bahn, Fahrstrom, Erdung, Tunnellüftung" },
    { id: "HEIM", name: "Einrichtungsleitung und Heimaufsicht", info: "Bewohnerlisten, Pflegebedarf, Ersatzunterbringung" },
    { id: "UNTER", name: "Ersatzunterbringung Stadt", info: "Turnhallen und Schulen, Ansprechpartner in der Leitstelle" },
    { id: "AUTOB", name: "Autobahn GmbH", info: "Sperrung, Umleitung, Fahrbahnreinigung" },
    { id: "PRESSE", name: "Pressesprecher", info: "Medienarbeit über B-Dienst z.b.V." },
    { id: "ENERG", name: "Energieversorger", info: "Strom und Gas freischalten" },
    { id: "STADTW", name: "Stadtwerke", info: "Wasser, Abwasser, Kanalnetz" },
    { id: "ORDN", name: "Ordnungsamt", info: "Ordnungsbehördliche Maßnahmen, Ersatzunterbringung" }
  ],

  /* Alarmstufen der AAO */
  aao: [["0", "1 (H)LF"], ["0+", "1 (H)LF + 1 Sonderfahrzeug"], ["1", "1 LZ"], ["1+", "1 LZ + 1 (H)LF"], ["2", "2 LZ"], ["3", "3 LZ"], ["4", "4 LZ"], ["5", "Alle Kräfte plus überörtliche Hilfe"]],

  /* MANV-Stufen: Einsatzmittelkette als Pakete */
  manv: {
    MANV10: { name: "MANV 10", keys: ["MANV10", "LNA", "ORGL", "SEGSAN"], info: "LNA, OrgL, 3 NEF, 3 RTW, 1 KTW, AB-MANV, GW-San, 2 ÜMANV-S, RTH", funk: 44 },
    MANV20: { name: "MANV 20", keys: ["MANV10", "MANV20", "LNA", "ORGL", "SEGSAN"], info: "LNA, OrgL, 3 NEF, 6 RTW, 2 KTW, AB-MANV, SEG-San, LZ 13 oder 31, 3 ÜMANV-S, RTH", funk: 88 },
    MANV50: { name: "MANV 50", keys: ["MANV10", "MANV20", "MANV50", "LNA", "ORGL", "SEGSAN", "EE", "PTZ", "BHPB"], info: "zusätzlich 2 Einsatzeinheiten, LZ 13 und 31, 3 ÜMANV-S überörtlich, 3 PT-Z 10, BHP-B 50, 2 RTH", funk: 363 }
  },

  /* Einsatzabschnitte und Führungskräfte für den Baukasten Führungsorganisation */
  abschnitte: ["Brandbekämpfung", "Technische Rettung", "Menschenrettung und Evakuierung", "Gefahrenabwehr ABC", "Dekontamination", "Messen und Warnen", "Medizinische Rettung", "Betreuung", "Wasserversorgung", "Bereitstellungsraum", "Logistik und Atemschutz", "Umwelt- und Gewässerschutz", "Absperrung und Verkehr"],
  rufgruppen: ["MUS_10", "MUS_20", "MUS_30", "MUS_40", "MUS_50", "MUS_60", "MUS_70", "MUS_80", "MUS_90"],
  fuehrung: ["B-Dienst 1", "B-Dienst 2", "B-Dienst z.b.V. (OrgL RD)", "LNA", "Zugführer ABC (LG 12)", "Zugführer LZ 13", "Zugführer LZ 22", "Zugführer LZ 24", "Zugführer LZ 31", "Führungskraft HiOrg", "Führungsassistent C-Dienst"],

  /* Stärke und Fahrzeuganzahl je anforderbarem Einsatzmittel für die Kräfteübersicht der Arbeitstafel.
     null bei der Stärke = in der Lernunterlage nicht angegeben, es wird nur die Fahrzeuganzahl gezählt. */
  staerke: {
    LZ1: ["1/4/12/17", 4], LZ2: ["1/4/12/17", 4], GR3: ["-/2/7/9", 2],
    RW1: ["-/1/1/2", 1], KW1: ["-/1/1/2", 1], TLF1: ["-/1/1/2", 1], TLF2: ["-/1/1/2", 1], GWA: ["-/1/1/2", 1],
    GWH: ["-/1/3/4", 1], GWT: ["-/1/3/4", 1], GWOEL: ["-/1/1/2", 1], ELW2: ["-/1/1/2", 1], DDIENST: ["1/-/-/1", 1],
    BZBV: ["1/1/-/2", 1], LNA: ["1/-/-/1", 1], ABVDEKON: ["-/1/1/2", 1], ABSTRAHL: ["-/1/1/2", 1], ABRUEST: ["-/1/1/2", 1],
    ABBAU: ["-/1/1/2", 1], ABMULDE: ["-/1/1/2", 1], ABKUECHE: ["-/1/1/2", 1], ABMANV: ["-/1/1/2", 1], ABSOLM: ["-/1/1/2", 1],
    ABBOOT: ["-/1/1/2", 1], ABSAND: ["-/1/1/2", 1], ABTANK: ["-/1/1/2", 1], RTW1R: ["-/-/2/2", 1], RTW2R: ["-/-/2/2", 1],
    RTW3R: ["-/-/2/2", 1], NEF1R: ["1/1/-/2", 1], NEF2R: ["1/1/-/2", 1], ITW4: ["-/-/2/2", 1], ELW2RD: ["1/-/2/3", 1],
    SEGSAN1: ["2/2/11/14", 4], SEGSAN2: ["2/2/11/14", 4], SEGBT1: ["1/5/13/19", 4], SEGBT2: ["1/5/13/19", 4],
    EE2: ["2/7/24/33", 8], EE4: ["2/7/24/33", 8],
    ABCZ: ["1/5/18/24", 6], MESSZ: ["1/6/18/25", 6], PDEKON: ["-/2/13/15", 3], GDEKON: ["-/1/8/9", 2], VDEKON: [null, 4],
    ABCZNRW: ["1/5/18/24", 5], MESSNRW: ["1/6/18/25", 6], BEZB: ["10/19/85/114", 20],
    UMANV: [null, 4, 8], RTH: [null, 1, 3], PTZ: [null, 9, 20], BHPB: [null, 25, 116], BTPB: [null, 12], VDEKNRW: [null, 6], ATF: [null, 4],
    MANV10: [null, 20, 44], MANV20: [null, 35, 88], MANV50: [null, 116, 363],
    THWFB: ["1/-/-/1", 1], THWTZ1: ["1/5/16/22", 3], THWTZ2: ["1/5/16/22", 3], THWE: ["-/2/7/9", 1], THWWP: ["-/3/9/12", 2], THWUL: ["-/1/3/4", 1],
    THWO: ["-/2/7/9", 1], THWSB: ["-/3/9/12", 1], THWLOG: ["1/7/20/28", 6], THWFK: ["1/7/12/20", 4]
  },

  /* Technisches Hilfswerk: Ergänzung zur Lernunterlage B2-211, welche keine THW-Kräfte beschreibt.
     Gliederung und Stärken nach der THW-Stärke- und Ausstattungsübersicht (StAN), Standort fiktiv. */
  thw: {
    id: "THWOV", kurz: "THW", name: "THW-Ortsverband Musterstadt", art: "thw", wb: 3, x: 60.5, y: 66.5,
    rolle: "Ergänzung zur Lernunterlage: OV-Stab, zwei Technische Züge und Fachgruppen. Ehrenamtliche Einsatzkräfte, Anforderung über die Leitstelle beim Ortsbeauftragten, Ausrückzeit etwa 30 Minuten.",
    gruppen: [
      { t: "OV-Stab", tot: "2/2/6/10", v: [["FüKW", "", "Ortsbeauftragter, Fachberater THW"], ["MTW", ""]] },
      { t: "1. Technischer Zug mit FGr N", tot: "1/5/16/22", v: [["FüKW", "1/1/2/4", "Zugtrupp"], ["GKW", "-/2/7/9", "Bergungsgruppe, Anhänger Einsatzgerüstsystem"], ["MzGW", "-/2/7/9", "FGr Notversorgung und Notinstandsetzung, Beleuchtung"], ["Anh. NEA 50 kVA LiMa", "", "Netzersatzanlage mit Lichtmast"], ["kl. Boot", ""]] },
      { t: "2. Technischer Zug mit FGr R Typ A", tot: "1/5/16/22", v: [["FüKW", "1/1/2/4", "Zugtrupp"], ["GKW", "-/2/7/9", "Bergungsgruppe, Anhänger Einsatzgerüstsystem"], ["Kipper", "-/2/7/9", "FGr Räumen"], ["Bagger", "", "auf Tieflader"], ["Anh. Tieflader", ""]] },
      { t: "Fachgruppen", tot: "-/6/19/25", v: [["LKW Lbw", "-/2/7/9", "FGr Elektroversorgung"], ["Anh. NEA 650 kVA", ""], ["Anh. NEA 200 kVA", ""], ["LKW Lbw", "-/3/9/12", "FGr Wasserschaden/Pumpen Typ B"], ["MLW", "", "FGr WP"], ["Anh. SwPu 15000", "", "Schmutzwasserpumpe 15.000 l/min"], ["MTW", "-/1/3/4", "Trupp Unbemannte Luftfahrtsysteme"]] }
    ],
    ab: [],
    anf: [
      { id: "THWFB", name: "Fachberater THW", typen: ["PKW"], ausr: 15, info: "Beratung der Einsatzleitung, Verbindung zum THW, Anforderung weiterer THW-Einheiten" },
      { id: "THWTZ1", name: "1. Technischer Zug mit FGr N", typen: ["FüKW", "GKW", "MzGW"], ausr: 30, info: "Bergung, Abstützen, Beleuchtung, Notstrom und Notinstandsetzung" },
      { id: "THWTZ2", name: "2. Technischer Zug mit FGr Räumen", typen: ["FüKW", "GKW", "Kipper"], ausr: 35, info: "Bergung, Räumen mit Bagger, Trümmer- und Hindernisbeseitigung" },
      { id: "THWE", name: "FGr Elektroversorgung", typen: ["LKW Lbw"], ausr: 35, info: "Netzersatzanlagen 650 kVA und 200 kVA, Einspeisung in Gebäude" },
      { id: "THWWP", name: "FGr Wasserschaden/Pumpen Typ B", typen: ["LKW Lbw", "MLW"], ausr: 35, info: "Leistungsstarke Pumpen bis 15.000 l/min, Lenzen und Wasserförderung" },
      { id: "THWUL", name: "Trupp Unbemannte Luftfahrtsysteme", typen: ["MTW"], ausr: 30, info: "Drohne für Lageerkundung und Übersichtsbilder" }
    ]
  }
};
