/* Planbesprechung Musterstadt · Szenarien
   Jedes Szenario folgt dem Ablauf der Planbesprechung nach VAP 2.2:
   Alarm, Übergabe mit Unterlagen, Erkundung mit Nachfragen, Ausarbeitung in 4 Minuten,
   Rückfragen der Kommission, O-Ton in der Pressekonferenz.

   x, y           Einsatzort in Prozent der Kartentextur
   t0, datum      Alarmzeit und Datum (für die Datum-Uhrzeitgruppe)
   alarmiert      IDs der Einsatzmittel nach Initialalarm (siehe daten.js)
   cAlarm         Minuten nach t0, zu welchen der Prüfling (C-Dienst) alarmiert wird
   uebergabe      Übergabe durch den Zugführer
   info           Unterlagen (Gefahrstoff, Objekt, Umfeld)
   lagekarte      Elemente der unvollständigen Lagekarte (viewBox 640 x 400)
   nachfragen     { f: Frage, a: Antwort, wichtig: true für bewertungsrelevante Nachfragen }
   ausarbeitung   Aufgaben im 4-Minuten-Block: abschnitte | text | nachforderung
   kommission     Rückfragen: matrix | text
   presse         O-Ton mit Anlass, Kriterien und Sprechzeit in Sekunden
   Bewertung Nachalarmierung:
     { t: "key", any: [...] }       mindestens einer der Schlüssel ist angefordert
     { t: "lz",  min: n }           Summe der Löschzüge (Löschgruppe = 0,5)
     { t: "typ", typ: "...", min }  Anzahl eines Fahrzeugtyps
*/
window.SZENARIEN = [
  {
    "id": "a1-ammoniak",
    "beispiel": true,
    "titel": "Gefahrgutunfall A 1",
    "typ": "abc",
    "x": 37.4,
    "y": 22.4,
    "ort": {
      "adresse": "A 1, Richtungsfahrbahn Bremen, km 312,4",
      "detail": "zwischen AS Musterstadt-Nord und Rastplatz Heidhorn",
      "wb": "Wachbezirk 1, Ausrückebereich LZ 13"
    },
    "zeit": "Dienstag",
    "datum": "2026-11-03",
    "t0": "07:42",
    "meldender": "Polizei Autobahnwache",
    "wetter": "14 °C, bedeckt, trocken, Wind aus Südwest mit 3 m/s",
    "stichwort": "TH-ABC 2 · MANV 20",
    "meldung": "Leitstelle Musterstadt für C-Dienst. Einsatz TH-ABC 2 und MANV 20 auf der A 1, Richtungsfahrbahn Bremen, Kilometer 312,4. Auffahrunfall eines Reisebusses auf ein stehendes Tankfahrzeug im Rückstau. Laut Anrufer tritt Gas mit stechendem Geruch aus, mehrere Personen im Bus sind verletzt. Warntafel 268 über 1005 durch Polizei bestätigt. Alarmiert sind Löschzug 1, Löschzug 13, Rüstwagen, ABC-Zug und die Einsatzmittelkette MANV 20. Die Polizei hat die Richtungsfahrbahn gesperrt. B-Dienst 1 fordert den C-Dienst zur Übernahme der Einsatzleitung an.",
    "alarmiert": [
      "LZ1",
      "FF13",
      "RW1",
      "ABCZ",
      "MANV20",
      "POL"
    ],
    "cAlarm": 11,
    "uebergabe": {
      "von": "B-Dienst 1, Zugführer Löschzug 1",
      "text": [
        "Herr Verbandsführer, B-Dienst 1. Wir sind um 07:50 Uhr eingetroffen.",
        "Ein Reisebus mit 46 Personen, eine Seniorengruppe auf Tagesfahrt, ist auf einen stehenden Tankauflieger aufgefahren. Der Auflieger hat Ammoniak geladen, Warntafel 268 über 1005, laut Frachtbrief rund 20 Tonnen.",
        "Am Heck des Tanks tritt im Bereich der Domarmatur hörbar Gas aus. Es bildet sich eine weiße Wolke, welche bodennah über die Böschung nach Nordosten zieht. Ich habe einen Gefahrenbereich von 50 Metern um den Tank und die Absperrgrenze bei 100 Metern festgelegt.",
        "Der Bus steht mit dem Vorderwagen im Gefahrenbereich. Etwa 20 Personen haben den Bus selbstständig über die hintere Tür verlassen und stehen auf der Gegenfahrbahn am Mittelstreifen, viele husten und klagen über brennende Augen. Rund 26 Personen sind noch im Bus, darunter der eingeklemmte Busfahrer und drei nicht gehfähige Personen.",
        "Ein Trupp des HLF 20-1 hat unter Atemschutz die vordere Tür geöffnet. Das HLF 20-2 baut einen Wasserschleier zwischen Tank und Bus auf. Der Löschzug 13 hat mit der Rettung des Busfahrers begonnen, der Rüstwagen ist im Einsatz. Die Drehleiter steht ungenutzt am Ende der Einsatzstelle.",
        "Vom Rettungsdienst sind zwei RTW und ein NEF vor Ort, eine geordnete Patientenablage gibt es noch nicht. Der Fahrer des Tankzuges steht bei der Polizei und klagt über Augenreizung. Der ABC-Zug ist soeben eingetroffen und rüstet sich mit CSA aus.",
        "Offen sind die Dekontamination, die Patientenablage und die Warnung der Bevölkerung im Ortsteil Nord. Ich bitte um Übernahme der Einsatzleitung."
      ]
    },
    "info": [
      {
        "titel": "Gefahrstoff",
        "zeilen": [
          [
            "Stoff",
            "Ammoniak, wasserfrei"
          ],
          [
            "UN-Nummer",
            "1005"
          ],
          [
            "Nummer zur Kennzeichnung der Gefahr",
            "268 (giftiges Gas, ätzend)"
          ],
          [
            "Klasse",
            "2, Klassifizierungscode 2TC"
          ],
          [
            "Eigenschaften",
            "Verflüssigtes Gas, farblos, stechender Geruch ab etwa 5 ppm. Gas leichter als Luft, austretendes Flüssiggas bildet jedoch kalte, bodennahe Nebel."
          ],
          [
            "Grenzwerte",
            "AEGL-2 (60 min) 160 ppm, AEGL-3 (60 min) 1100 ppm"
          ],
          [
            "Explosionsbereich",
            "15–33,6 Vol.-%, Zündtemperatur 630 °C"
          ],
          [
            "Löslichkeit",
            "Sehr gut wasserlöslich, Wasserschleier wirksam, Niederschlagswasser stark alkalisch und gewässergefährdend"
          ],
          [
            "Schutz",
            "CSA am Leck, Kälteschutz bei Flüssigphase, Atemschutz im Gefahrenbereich"
          ]
        ]
      },
      {
        "titel": "Umfeld",
        "zeilen": [
          [
            "Wind",
            "Südwest 3 m/s, Ausbreitung Richtung Nordost"
          ],
          [
            "Bebauung",
            "Ortsteil am Gerätehaus 17 in etwa 1,8 km Entfernung in Windrichtung"
          ],
          [
            "Gewässer",
            "Straßenentwässerung in Graben zum Mühlenbach"
          ],
          [
            "Verkehr",
            "Rückstau in Fahrtrichtung Bremen, Gegenfahrbahn noch befahren"
          ]
        ]
      }
    ],
    "lagekarte": [
      {
        "t": "flaeche",
        "pts": [
          [
            0,
            150
          ],
          [
            640,
            150
          ],
          [
            640,
            250
          ],
          [
            0,
            250
          ]
        ],
        "f": "strasse"
      },
      {
        "t": "linie",
        "pts": [
          [
            0,
            200
          ],
          [
            640,
            200
          ]
        ],
        "s": "mittel"
      },
      {
        "t": "linie",
        "pts": [
          [
            0,
            100
          ],
          [
            640,
            60
          ]
        ],
        "s": "wasser",
        "txt": "Graben"
      },
      {
        "t": "zone",
        "kind": "gefahr",
        "cx": 330,
        "cy": 180,
        "r": 70,
        "txt": "Gefahrenbereich 50 m"
      },
      {
        "t": "zone",
        "kind": "absperr",
        "cx": 330,
        "cy": 180,
        "r": 130,
        "txt": "Absperrgrenze 100 m"
      },
      {
        "t": "fz",
        "x": 330,
        "y": 176,
        "txt": "Tank NH₃",
        "org": "zivil",
        "w": 70
      },
      {
        "t": "warn",
        "x": 380,
        "y": 152,
        "oben": "268",
        "unten": "1005"
      },
      {
        "t": "fz",
        "x": 248,
        "y": 176,
        "txt": "Reisebus",
        "org": "zivil",
        "w": 64
      },
      {
        "t": "wind",
        "x": 520,
        "y": 70,
        "dir": 45,
        "txt": "SW 3 m/s"
      },
      {
        "t": "wolke",
        "x": 410,
        "y": 120
      },
      {
        "t": "fz",
        "x": 180,
        "y": 176,
        "txt": "HLF 20-1",
        "org": "fw"
      },
      {
        "t": "fz",
        "x": 285,
        "y": 222,
        "txt": "HLF 20-2",
        "org": "fw"
      },
      {
        "t": "wasserschleier",
        "x1": 300,
        "y1": 160,
        "x2": 300,
        "y2": 215
      },
      {
        "t": "fz",
        "x": 120,
        "y": 176,
        "txt": "LZ 13",
        "org": "fw"
      },
      {
        "t": "fz",
        "x": 70,
        "y": 176,
        "txt": "DLK",
        "org": "fw"
      },
      {
        "t": "fz",
        "x": 120,
        "y": 226,
        "txt": "RW",
        "org": "fw"
      },
      {
        "t": "el",
        "x": 40,
        "y": 228,
        "txt": "B 1"
      },
      {
        "t": "fz",
        "x": 30,
        "y": 176,
        "txt": "ABC-Zug",
        "org": "fw"
      },
      {
        "t": "fz",
        "x": 200,
        "y": 290,
        "txt": "RTW",
        "org": "rd"
      },
      {
        "t": "fz",
        "x": 250,
        "y": 290,
        "txt": "RTW",
        "org": "rd"
      },
      {
        "t": "fz",
        "x": 300,
        "y": 290,
        "txt": "NEF",
        "org": "rd"
      },
      {
        "t": "personen",
        "x": 230,
        "y": 238,
        "txt": "ca. 20 Personen"
      },
      {
        "t": "fz",
        "x": 600,
        "y": 176,
        "txt": "Polizei",
        "org": "pol"
      },
      {
        "t": "offen",
        "x": 120,
        "y": 330,
        "txt": "Patientenablage"
      },
      {
        "t": "offen",
        "x": 40,
        "y": 290,
        "txt": "Dekon"
      },
      {
        "t": "offen",
        "x": 560,
        "y": 330,
        "txt": "Bereitstellungsraum"
      },
      {
        "t": "pfeil",
        "x1": 20,
        "y1": 130,
        "x2": 120,
        "y2": 130,
        "txt": "Fahrtrichtung Bremen"
      },
      {
        "t": "tz",
        "z": "Gefahren/Akute_Gefahr_durch_Gas",
        "x": 432,
        "y": 200,
        "s": 38,
        "txt": "NH₃"
      }
    ],
    "nachfragen": [
      {
        "f": "Wie viele Personen sind betroffen und in welchem Zustand?",
        "a": "Insgesamt 46 Businsassen und der Fahrer des Tankzuges. Etwa 20 stehen auf der Gegenfahrbahn mit Augen- und Atemwegsreizungen, 26 sind noch im Bus. Der Busfahrer ist eingeklemmt, drei Personen sind nicht gehfähig. Den Zustand der übrigen im Bus kann ich nicht beurteilen.",
        "wichtig": true
      },
      {
        "f": "Was tritt genau aus und lässt sich die Leckage eingrenzen?",
        "a": "Gasförmiges Ammoniak an der Domarmatur, zeitweise bildet sich Reif an der Armatur. Eine Flüssigphase am Boden haben wir bislang nicht gesehen. Die Austrittsmenge kann ich nicht abschätzen.",
        "wichtig": true
      },
      {
        "f": "Was liegt in Ausbreitungsrichtung?",
        "a": "Bei Wind aus Südwest liegt in etwa 600 Metern ein Bauernhof mit Tierhaltung, dort sind Personen im Haus. Nach etwa 1,8 Kilometern folgt der Ortsteil am Gerätehaus 17.",
        "wichtig": true
      },
      {
        "f": "Ist die Gegenfahrbahn gesperrt?",
        "a": "Nein. Die Polizei sperrt bislang nur die Richtungsfahrbahn Bremen. Die Personen am Mittelstreifen stehen dadurch ungeschützt neben dem fließenden Verkehr.",
        "wichtig": true
      },
      {
        "f": "Wo ist Platz für Patientenablage und Dekontamination?",
        "a": "Westlich der Unfallstelle, etwa 250 Meter entgegen der Fahrtrichtung, ist der Standstreifen frei. Der Bereich liegt im Luv. Dort steht bislang nur die Drehleiter.",
        "wichtig": true
      },
      {
        "f": "Ist der Graben bereits betroffen?",
        "a": "Das Wasser des Wasserschleiers läuft über die Böschung in den Graben zum Mühlenbach. Eine Rückhaltung ist noch nicht aufgebaut.",
        "wichtig": true
      },
      {
        "f": "Liegen bereits Messwerte vor?",
        "a": "Nein. Der ABC-Zug hat Mehrgasmessgeräte dabei, die Messungen haben noch nicht begonnen.",
        "wichtig": true
      },
      {
        "f": "Gibt es Informationen von Spedition oder Fahrer?",
        "a": "Der Fahrer hat den Frachtbrief übergeben, die Notfallnummer der Spedition steht darauf. Erreicht wurde dort noch niemand."
      },
      {
        "f": "Welche Kräfte sind wo eingesetzt?",
        "a": "HLF 20-1 mit einem Trupp unter Atemschutz am Bus, HLF 20-2 am Wasserschleier, LZ 13 mit Rüstwagen bei der Rettung des Fahrers, ABC-Zug rüstet am Ende der Einsatzstelle aus. Zwei RTW und ein NEF sichten auf der Gegenfahrbahn."
      },
      {
        "f": "Gibt es verletzte Einsatzkräfte?",
        "a": "Bislang nicht. Der Trupp am Bus klagt über leichten Geruch trotz Atemschutz, das prüfen wir gerade."
      }
    ],
    "ausarbeitung": [
      {
        "id": "orga",
        "typ": "abschnitte",
        "titel": "Führungsorganisation und Abschnittsbildung",
        "frage": "Skizzieren Sie die Führungsorganisation mit Abschnitten, Abschnittsleitern und Rufgruppen.",
        "soll": [
          "Gefahrenabwehr ABC",
          "Dekontamination",
          "Medizinische Rettung",
          "Messen und Warnen",
          "Bereitstellungsraum"
        ],
        "kann": [
          "Technische Rettung",
          "Menschenrettung und Evakuierung",
          "Betreuung",
          "Umwelt- und Gewässerschutz",
          "Logistik und Atemschutz",
          "Absperrung und Verkehr"
        ],
        "hinweis": "EA Medizinische Rettung durch OrgL RD und LNA. EA Messen und Warnen kann bei Bindung des ZF ABC durch einen Zugführer der BF geführt werden."
      },
      {
        "id": "massnahmen",
        "typ": "text",
        "titel": "Weitere Maßnahmen",
        "frage": "Legen Sie die weiteren Maßnahmen und Einsatzschwerpunkte in der Reihenfolge fest.",
        "kriterien": [
          [
            "Menschenrettung aus dem Bus als erster Schwerpunkt unter Atemschutz, im Gefahrenbereich mit CSA",
            2
          ],
          [
            "Gasaustritt eindämmen: Wasserschleier fortführen, Abdichten an der Domarmatur durch den ABC-Zug",
            2
          ],
          [
            "Dekontamination aller Personen aus dem Gefahrenbereich vor Übergabe an den Rettungsdienst",
            2
          ],
          [
            "Patientenablage außerhalb des Gefahrenbereichs, quer zum Wind und auf der Luvseite",
            1
          ],
          [
            "Messen und Warnen im Ausbreitungsgebiet Nordost",
            1
          ],
          [
            "Rückhaltung des Niederschlagswassers, Schutz des Grabens",
            1
          ],
          [
            "Raumordnung: Anfahrt aus Luv, Bereitstellungsraum außerhalb der Absperrgrenze",
            1
          ]
        ]
      },
      {
        "id": "lage",
        "typ": "text",
        "titel": "Lagemeldung",
        "frage": "Formulieren Sie Ihre Lagemeldung an die Leitstelle.",
        "kriterien": [
          [
            "Übernahme der Einsatzleitung durch den C-Dienst mit Uhrzeit",
            1
          ],
          [
            "Lage: Auffahrunfall Reisebus auf Tankzug, Ammoniakaustritt UN 1005",
            1
          ],
          [
            "Betroffene: 46 Personen, davon etwa 26 im Bus, Fahrer eingeklemmt",
            1
          ],
          [
            "Eingeleitete Maßnahmen: Gefahrenbereich, Wasserschleier, Menschenrettung",
            1
          ],
          [
            "Konkrete Nachforderungen benannt (MANV 50, Alarmstufe, Dekon, Messen)",
            2
          ],
          [
            "Hinweis auf Ausbreitung nach Nordost und Warnung der Bevölkerung",
            1
          ],
          [
            "Einsatzleitung auf MUS_90, nächste Lagemeldung terminiert",
            1
          ]
        ]
      },
      {
        "id": "nachf",
        "typ": "nachforderung",
        "titel": "Nachalarmierung",
        "frage": "Alarmieren Sie über Karte, Leiste und Stichworte alle erforderlichen Kräfte nach und informieren Sie die erforderlichen Stellen.",
        "soll": [
          {
            "t": "key",
            "any": [
              "MANV50"
            ],
            "pts": 3,
            "label": "Erhöhung auf MANV 50",
            "warum": "46 Personen mit Reizgasexposition, davon mehrere nicht gehfähig. MANV 20 reicht nicht aus."
          },
          {
            "t": "lz",
            "min": 3,
            "pts": 2,
            "label": "Mindestens ein weiterer Löschzug",
            "warum": "Personal für Menschenrettung unter CSA, Wasserschleier, Dekon und Absperrung."
          },
          {
            "t": "key",
            "any": [
              "PDEKON"
            ],
            "pts": 2,
            "label": "P-Dekon",
            "warum": "Dekontamination der Einsatzkräfte unter CSA."
          },
          {
            "t": "key",
            "any": [
              "VDEKON"
            ],
            "pts": 2,
            "label": "V-Dekon",
            "warum": "Kontaminierte Businsassen vor Übergabe an den Rettungsdienst."
          },
          {
            "t": "key",
            "any": [
              "MESS"
            ],
            "pts": 2,
            "label": "Messzug",
            "warum": "Ausbreitung Richtung Ortsteil Nord feststellen und Warnbereich festlegen."
          },
          {
            "t": "key",
            "any": [
              "WARN"
            ],
            "pts": 2,
            "label": "Warnung der Bevölkerung",
            "warum": "Bewohner im Ausbreitungsgebiet: Fenster und Türen schließen."
          },
          {
            "t": "key",
            "any": [
              "ELW2"
            ],
            "pts": 1,
            "label": "ELW 2 mit Führungsunterstützung",
            "warum": "Mehrere Einsatzabschnitte und hoher Kommunikationsbedarf."
          },
          {
            "t": "key",
            "any": [
              "GWA"
            ],
            "pts": 1,
            "label": "GW-Atemschutz",
            "warum": "Hoher Verbrauch an Atemschutzgeräten und CSA."
          },
          {
            "t": "key",
            "any": [
              "SEGBT"
            ],
            "pts": 1,
            "label": "Betreuung",
            "warum": "Unverletzte Insassen nach der Dekon benötigen Witterungsschutz und Betreuung."
          },
          {
            "t": "key",
            "any": [
              "TUIS"
            ],
            "pts": 1,
            "label": "TUIS Fachberatung",
            "warum": "Abdichten, Umpumpen und Bergung des Ammoniaktanks."
          },
          {
            "t": "key",
            "any": [
              "UWB"
            ],
            "pts": 1,
            "label": "Untere Wasserbehörde",
            "warum": "Alkalisches Niederschlagswasser im Graben."
          },
          {
            "t": "key",
            "any": [
              "BEZREG"
            ],
            "pts": 1,
            "label": "Bezirksregierung informieren",
            "warum": "MANV 50 und ABC-Lage mit möglicher überörtlicher Hilfe."
          },
          {
            "t": "key",
            "any": [
              "DDIENST"
            ],
            "pts": 1,
            "label": "D-Dienst informieren",
            "warum": "Großschadenslage mit Außenwirkung."
          },
          {
            "t": "key",
            "any": [
              "WB1",
              "WACHE1"
            ],
            "pts": 1,
            "label": "Wachbesetzung FRW 1",
            "warum": "Löschzug 1 ist langfristig gebunden."
          },
          {
            "t": "key",
            "any": [
              "AUTOB"
            ],
            "pts": 1,
            "label": "Autobahn GmbH",
            "warum": "Sperrung beider Richtungsfahrbahnen und Umleitung."
          }
        ],
        "kann": [
          "ATF für Messungen und Fachberatung",
          "KH Vorwarnung der Krankenhäuser",
          "PSNV für die Seniorengruppe",
          "Pressesprecher"
        ]
      }
    ],
    "kommission": [
      {
        "id": "gefahren",
        "typ": "matrix",
        "titel": "Gefahren",
        "frage": "Die Kommission fragt: Welche Gefahren sehen Sie an dieser Einsatzstelle und für wen?",
        "soll": [
          "Atemgifte:Menschen",
          "Atemgifte:Tiere",
          "Atemgifte:Mannschaft",
          "Angstreaktion:Menschen",
          "Ausbreitung:Menschen",
          "Ausbreitung:Tiere",
          "Ausbreitung:Umwelt",
          "Chemische Stoffe:Menschen",
          "Chemische Stoffe:Tiere",
          "Chemische Stoffe:Umwelt",
          "Chemische Stoffe:Mannschaft",
          "Chemische Stoffe:Gerät",
          "Erkrankung/Verletzung:Menschen",
          "Erkrankung/Verletzung:Mannschaft",
          "Explosion:Mannschaft",
          "Explosion:Gerät"
        ],
        "hinweis": "Ammoniak ist im Nahbereich des Lecks zündfähig (15–33,6 Vol.-%). Das alkalische Niederschlagswasser gefährdet den Graben und den Mühlenbach."
      },
      {
        "id": "begruendung",
        "typ": "text",
        "titel": "Begründung",
        "frage": "Die Kommission fragt: Begründen Sie Ihre Abschnittsbildung und die räumliche Lage der Abschnitte.",
        "kriterien": [
          [
            "Trennung von Gefahrenbereich (EA ABC) und Versorgung (EA MedRett)",
            2
          ],
          [
            "Dekon als Schnittstelle an der Grenze des Gefahrenbereichs im Luv",
            2
          ],
          [
            "Patientenablage außerhalb der Absperrgrenze im Luv",
            1
          ],
          [
            "Messen und Warnen als eigener Abschnitt wegen der räumlichen Entfernung",
            1
          ],
          [
            "Bereitstellungsraum außerhalb, Zufahrt aus Luv",
            1
          ],
          [
            "Führungsspanne von höchstens fünf Abschnitten eingehalten",
            1
          ]
        ]
      },
      {
        "id": "befehl",
        "typ": "text",
        "titel": "Befehl",
        "frage": "Die Kommission fordert: Erteilen Sie dem Zugführer ABC als Abschnittsleiter Gefahrenabwehr ABC Ihren Befehl.",
        "kriterien": [
          [
            "Lage knapp: Leck an der Domarmatur, Wolke Richtung Nordost",
            1
          ],
          [
            "Einheit und Mittel: ABC-Zug, HLF 20-2 mit Wasserschleier wird unterstellt",
            1
          ],
          [
            "Auftrag: Leckage abdichten bzw. Armatur schließen",
            2
          ],
          [
            "Wasserschleier fortführen, Niederschlagswasser zurückhalten",
            1
          ],
          [
            "Eigenschutz: CSA, Sicherheitstrupp, Atemschutzüberwachung, Dekon vor Verlassen des Gefahrenbereichs",
            2
          ],
          [
            "Grenzen: Gefahrenbereich 50 m, keine Zündquellen",
            1
          ],
          [
            "Verbindung über MUS_10, Rückmeldung bei Erfolg oder spätestens in 15 Minuten",
            1
          ]
        ]
      },
      {
        "id": "lageaenderung",
        "typ": "text",
        "titel": "Lageänderung",
        "frage": "08:20 Uhr: Der Messtrupp meldet am Bauernhof in 600 Metern Entfernung 180 ppm Ammoniak. Der Landwirt und seine Familie befinden sich im Haus. Wie reagieren Sie?",
        "kriterien": [
          [
            "Bewertung: AEGL-2 überschritten, Gefahr für die Bewohner",
            1
          ],
          [
            "Schutz im Gebäude: Fenster und Türen schließen, Lüftung abschalten, keine Evakuierung durch die Wolke",
            2
          ],
          [
            "Warnbereich ausweiten, Warnung der Bevölkerung aktualisieren",
            2
          ],
          [
            "Messungen fortführen, Ausbreitung prognostizieren",
            1
          ],
          [
            "Bewohner telefonisch oder über Polizei unterrichten, Tiere berücksichtigen",
            1
          ],
          [
            "Rückmeldung an die Leitstelle",
            1
          ]
        ]
      }
    ],
    "presse": {
      "id": "presse",
      "typ": "text",
      "titel": "O-Ton Pressekonferenz",
      "anlass": "08:45 Uhr, Pressekonferenz am Rastplatz Heidhorn. Mehrere Redaktionen und ein Fernsehteam bitten um ein kurzes Statement.",
      "frage": "Geben Sie einen O-Ton von etwa 60 Sekunden ab.",
      "kriterien": [
        [
          "Vorstellung mit Name und Funktion",
          1
        ],
        [
          "Gesicherte Fakten zum Ereignis in wenigen Sätzen",
          1
        ],
        [
          "Nur bestätigte Zahlen, keine Spekulation zu Ursache oder Schuld",
          2
        ],
        [
          "Maßnahmen der Einsatzkräfte verständlich benannt",
          1
        ],
        [
          "Verhaltenshinweise: Fenster und Türen schließen, Gebiet meiden, Warn-App beachten",
          2
        ],
        [
          "Hinweis auf Sperrung der A 1 und Umleitung",
          1
        ],
        [
          "Keine Namen, keine Diagnosen einzelner Personen",
          1
        ],
        [
          "Verweis auf weitere Informationen und Zeitpunkt der nächsten Pressekonferenz",
          1
        ]
      ],
      "sekunden": 60
    }
  },
  {
    "id": "seniorenzentrum",
    "beispiel": true,
    "titel": "Brand Seniorenzentrum",
    "typ": "brand",
    "x": 65.2,
    "y": 46,
    "ort": {
      "adresse": "Seniorenzentrum Lindenhof, Lindenallee 40",
      "detail": "Innenstadtrand Ost",
      "wb": "Wachbezirk 2, Ausrückebereich LZ 24"
    },
    "zeit": "Sonntag",
    "datum": "2026-11-08",
    "t0": "02:47",
    "meldender": "BMA und Nachtwache",
    "wetter": "3 °C, Nieselregen, Wind aus West mit 2 m/s",
    "stichwort": "F 2 Y · erhöht auf F 3 und MANV 10",
    "meldung": "Leitstelle Musterstadt für C-Dienst. Einsatz F 3 mit Menschenleben in Gefahr, zusätzlich MANV 10, im Seniorenzentrum Lindenhof, Lindenallee 40. Auslösung der Brandmeldeanlage und Notruf der Nachtwache, Brand im 2. Obergeschoss Nordflügel. Der B-Dienst 2 hat um 02:56 Uhr auf F 3 und MANV 10 erhöht. Alarmiert sind Löschzug 2, Löschzug 24, Löschzug 23 und die Einsatzmittelkette MANV 10. Sie werden zur Übernahme der Einsatzleitung angefordert.",
    "alarmiert": [
      "LZ2",
      "FF24",
      "FF23",
      "MANV10"
    ],
    "cAlarm": 9,
    "uebergabe": {
      "von": "B-Dienst 2, Zugführer Löschzug 2",
      "text": [
        "Herr Verbandsführer, B-Dienst 2. Wir sind um 02:52 Uhr eingetroffen.",
        "Das Seniorenzentrum hat drei Geschosse mit einem Nord- und einem Südflügel. Insgesamt sind 94 Bewohner im Haus, davon 31 im 2. Obergeschoss. Die beiden Flügel sind durch eine Brandwand mit Rauchschutztür getrennt.",
        "Das Zimmer 2.14 im 2. OG Nordflügel steht im Vollbrand, Flammen schlagen aus dem Fenster zur Hofseite. Der Flur im 2. OG Nordflügel ist bis zum Boden verraucht. Die Rauchschutztür zum Treppenraum Nord war festgekeilt, Rauch ist bis ins 1. OG gezogen. Der Treppenraum Süd ist rauchfrei.",
        "Ein Angriffstrupp des HLF 20-1 geht mit C-Rohr über den Treppenraum Nord zur Brandbekämpfung vor. Zwei Trupps unter Atemschutz retten Bewohner aus den Zimmern im 2. OG Nordflügel. Bisher sind sieben Bewohner gerettet, zwei davon über die Drehleiter an der Hofseite. Sechs Personen werden mit Verdacht auf Rauchgasvergiftung vom Rettungsdienst im Foyer Süd gesichtet.",
        "Die drei Pflegekräfte der Nachtwache haben begonnen, das 1. OG Nordflügel in den Südflügel zu verlegen. Im 2. OG Nordflügel sind laut Nachtwache noch etwa neun Bewohner, davon fünf bettlägerig. Zwei Bewohner nutzen Sauerstoffkonzentratoren, im Lagerraum 2. OG Nord stehen zwei Sauerstoffflaschen.",
        "Der Löschzug 24 steht in Bereitstellung an der Lindenallee, der Löschzug 23 ist auf Anfahrt. Die Wasserversorgung läuft bislang über einen Hydranten.",
        "Offen sind die Versorgung der evakuierten Bewohner, die Kontrolle des 3. OG und eine zweite Wasserversorgung. Ich bitte um Übernahme."
      ]
    },
    "info": [
      {
        "titel": "Objekt",
        "zeilen": [
          [
            "Nutzung",
            "Pflegeeinrichtung, 94 Bewohner der Pflegegrade 2 bis 5"
          ],
          [
            "Bauweise",
            "Massivbau 1998, drei Geschosse und Keller"
          ],
          [
            "Brandabschnitte",
            "Nord- und Südflügel, Brandwand mit Rauchschutztür T30-RS"
          ],
          [
            "Rettungswege",
            "Treppenraum Nord und Treppenraum Süd, Anleiterstellen an Hof- und Straßenseite"
          ],
          [
            "Technik",
            "BMA mit Aufschaltung, Feuerwehrlaufkarten am FIBS im Foyer Süd"
          ],
          [
            "Bewohner",
            "23 nicht gehfähig, 6 mit Sauerstoffversorgung, 11 mit Demenz"
          ],
          [
            "Personal",
            "Nachtwache mit drei Pflegekräften, Rufbereitschaft der Einrichtungsleitung"
          ]
        ]
      },
      {
        "titel": "Besondere Gefahr",
        "zeilen": [
          [
            "Sauerstoff",
            "Konzentratoren in zwei Zimmern, zwei Flaschen 10 l im Lagerraum 2. OG Nord"
          ],
          [
            "Wirkung",
            "Brandbeschleunigung bei Sauerstoffanreicherung, Zerknallgefahr erwärmter Flaschen"
          ]
        ]
      }
    ],
    "lagekarte": [
      {
        "t": "flaeche",
        "pts": [
          [
            0,
            330
          ],
          [
            640,
            330
          ],
          [
            640,
            380
          ],
          [
            0,
            380
          ]
        ],
        "f": "strasse",
        "txt": "Lindenallee"
      },
      {
        "t": "gebaeude",
        "x": 120,
        "y": 60,
        "w": 200,
        "h": 90,
        "txt": "Nordflügel"
      },
      {
        "t": "gebaeude",
        "x": 320,
        "y": 60,
        "w": 90,
        "h": 220,
        "txt": "Südflügel"
      },
      {
        "t": "linie",
        "pts": [
          [
            320,
            60
          ],
          [
            320,
            150
          ]
        ],
        "s": "brandwand",
        "txt": "Brandwand"
      },
      {
        "t": "brand",
        "x": 190,
        "y": 100,
        "txt": "Zi. 2.14"
      },
      {
        "t": "text",
        "x": 120,
        "y": 30,
        "txt": "Hofseite"
      },
      {
        "t": "fz",
        "x": 200,
        "y": 30,
        "txt": "DLK",
        "org": "fw"
      },
      {
        "t": "fz",
        "x": 180,
        "y": 190,
        "txt": "HLF 20-1",
        "org": "fw"
      },
      {
        "t": "fz",
        "x": 250,
        "y": 190,
        "txt": "HLF 20-2",
        "org": "fw"
      },
      {
        "t": "el",
        "x": 460,
        "y": 300,
        "txt": "B 2"
      },
      {
        "t": "fz",
        "x": 400,
        "y": 300,
        "txt": "NEF",
        "org": "rd"
      },
      {
        "t": "fz",
        "x": 520,
        "y": 300,
        "txt": "RTW",
        "org": "rd"
      },
      {
        "t": "fz",
        "x": 580,
        "y": 300,
        "txt": "RTW",
        "org": "rd"
      },
      {
        "t": "ablage",
        "x": 365,
        "y": 255,
        "txt": "Sichtung Foyer Süd"
      },
      {
        "t": "hydrant",
        "x": 90,
        "y": 340
      },
      {
        "t": "schlauch",
        "pts": [
          [
            90,
            340
          ],
          [
            90,
            230
          ],
          [
            180,
            205
          ]
        ]
      },
      {
        "t": "fz",
        "x": 80,
        "y": 360,
        "txt": "LZ 24",
        "org": "fw",
        "w": 56
      },
      {
        "t": "wind",
        "x": 560,
        "y": 60,
        "dir": 90,
        "txt": "W 2 m/s"
      },
      {
        "t": "offen",
        "x": 520,
        "y": 150,
        "txt": "Betreuung"
      },
      {
        "t": "offen",
        "x": 230,
        "y": 290,
        "txt": "Atemschutzsammelplatz"
      },
      {
        "t": "offen",
        "x": 580,
        "y": 230,
        "txt": "Bereitstellungsraum"
      },
      {
        "t": "offen",
        "x": 40,
        "y": 120,
        "txt": "2. Hydrant"
      },
      {
        "t": "tz",
        "z": "Gefahren/Gefahr_durch_Explosion",
        "x": 262,
        "y": 100,
        "s": 30,
        "txt": "O₂-Flaschen"
      }
    ],
    "nachfragen": [
      {
        "f": "Wie viele Bewohner sind noch im Gefahrenbereich?",
        "a": "Laut Nachtwache noch etwa neun im 2. OG Nord, davon fünf bettlägerig. Im 1. OG Nord laufen die Verlegungen, dort sind noch etwa 14 Bewohner. Das 3. OG ist noch nicht kontrolliert.",
        "wichtig": true
      },
      {
        "f": "Gibt es eine Bewohnerliste?",
        "a": "Die Nachtwache hat eine Belegungsliste im Dienstzimmer am Foyer Süd. Gerettete Bewohner werden darauf bisher nicht abgehakt.",
        "wichtig": true
      },
      {
        "f": "Ist der Brand auf das Zimmer begrenzt?",
        "a": "Der Angriffstrupp meldet ein Zimmer im Vollbrand, die Tür zum Flur ist inzwischen durchgebrannt. Flammen im Flur gibt es noch nicht, aber starke Verrauchung. Ob der Brand über die Fassade ins 3. OG geht, ist offen.",
        "wichtig": true
      },
      {
        "f": "Wo stehen die Sauerstoffflaschen genau?",
        "a": "Im Lagerraum 2.10 gegenüber dem Brandzimmer, etwa sechs Meter entfernt. Der Raum ist bislang nicht betroffen.",
        "wichtig": true
      },
      {
        "f": "Wo können evakuierte Bewohner warm untergebracht werden?",
        "a": "Der Speisesaal im Erdgeschoss Südflügel ist rauchfrei, beheizt und bietet Platz für etwa 60 Personen.",
        "wichtig": true
      },
      {
        "f": "Gibt es eine zweite Anleiterstelle?",
        "a": "Die Straßenseite ist anleiterbar. Die Hofseite erreicht man nur über die Zufahrt Nord, dort steht unsere Drehleiter.",
        "wichtig": true
      },
      {
        "f": "Wie ist die Wasserversorgung?",
        "a": "Ein Unterflurhydrant an der Lindenallee mit unbekannter Leistung. Der nächste Hydrant liegt etwa 120 Meter entfernt an der Hofzufahrt Nord."
      },
      {
        "f": "Ist die Einrichtungsleitung informiert?",
        "a": "Die Nachtwache hat die Pflegedienstleitung angerufen. Sie ist auf dem Weg, die Ankunftszeit ist unbekannt."
      },
      {
        "f": "Gibt es verletzte Einsatzkräfte?",
        "a": "Nein."
      },
      {
        "f": "Läuft eine Entrauchung?",
        "a": "Nein. Die Rauchabzugsöffnung im Treppenraum Nord ist noch geschlossen, ein Lüfter ist noch nicht gesetzt."
      }
    ],
    "ausarbeitung": [
      {
        "id": "orga",
        "typ": "abschnitte",
        "titel": "Führungsorganisation und Abschnittsbildung",
        "frage": "Skizzieren Sie die Führungsorganisation mit Abschnitten, Abschnittsleitern und Rufgruppen.",
        "soll": [
          "Brandbekämpfung",
          "Menschenrettung und Evakuierung",
          "Medizinische Rettung",
          "Betreuung",
          "Bereitstellungsraum"
        ],
        "kann": [
          "Logistik und Atemschutz",
          "Wasserversorgung",
          "Absperrung und Verkehr"
        ],
        "hinweis": "Die Betreuung von 94 pflegebedürftigen Bewohnern bindet erhebliche Kräfte und benötigt einen eigenen Abschnitt mit Pflegepersonal der Einrichtung."
      },
      {
        "id": "massnahmen",
        "typ": "text",
        "titel": "Weitere Maßnahmen",
        "frage": "Legen Sie die weiteren Maßnahmen und Einsatzschwerpunkte in der Reihenfolge fest.",
        "kriterien": [
          [
            "Menschenrettung im 2. OG Nordflügel hat Vorrang, gleichzeitig Brandbekämpfung zur Sicherung der Rettung",
            2
          ],
          [
            "Rauchschutztüren schließen, Treppenraum Nord entrauchen, Treppenraum Süd rauchfrei halten",
            2
          ],
          [
            "Horizontale Evakuierung in den Südflügel hinter die Brandwand statt Räumung ins Freie",
            2
          ],
          [
            "Sauerstoffquellen sichern, Flaschen kühlen oder entfernen",
            1
          ],
          [
            "Kontrolle aller Geschosse, insbesondere 3. OG Nordflügel",
            1
          ],
          [
            "Geordnete Patientenablage und Betreuung der Bewohner im Warmen",
            1
          ],
          [
            "Zweite Wasserversorgung herstellen",
            1
          ]
        ]
      },
      {
        "id": "lage",
        "typ": "text",
        "titel": "Lagemeldung",
        "frage": "Formulieren Sie Ihre Lagemeldung an die Leitstelle.",
        "kriterien": [
          [
            "Übernahme der Einsatzleitung durch den C-Dienst mit Uhrzeit",
            1
          ],
          [
            "Lage: Zimmerbrand 2. OG Nordflügel, Rauchausbreitung Treppenraum Nord und 1. OG",
            1
          ],
          [
            "Personen: 94 Bewohner, etwa 9 noch im 2. OG Nord, 6 Patienten",
            1
          ],
          [
            "Maßnahmen: Brandbekämpfung, Menschenrettung, horizontale Evakuierung",
            1
          ],
          [
            "Konkrete Nachforderungen benannt (Alarmstufe, MANV 20, Betreuung)",
            2
          ],
          [
            "Hinweis auf Sauerstoff im Brandbereich",
            1
          ],
          [
            "Einsatzleitung auf MUS_90, nächste Lagemeldung terminiert",
            1
          ]
        ]
      },
      {
        "id": "nachf",
        "typ": "nachforderung",
        "titel": "Nachalarmierung",
        "frage": "Alarmieren Sie über Karte, Leiste und Stichworte alle erforderlichen Kräfte nach und informieren Sie die erforderlichen Stellen.",
        "soll": [
          {
            "t": "lz",
            "min": 4,
            "pts": 3,
            "label": "Erhöhung auf F 4",
            "warum": "Atemschutzintensive Menschenrettung, Ablösung der Trupps und Kontrolle aller Geschosse."
          },
          {
            "t": "typ",
            "typ": "DLA (K) 23/12",
            "min": 2,
            "pts": 1,
            "label": "Zweites Hubrettungsfahrzeug",
            "warum": "Anleitern an Straßen- und Hofseite, Reserve für den zweiten Rettungsweg."
          },
          {
            "t": "key",
            "any": [
              "MANV20"
            ],
            "pts": 2,
            "label": "Erhöhung auf MANV 20",
            "warum": "Bettlägerige Bewohner mit Rauchgasexposition, mehr als 10 Patienten zu erwarten."
          },
          {
            "t": "key",
            "any": [
              "SEGBT"
            ],
            "pts": 2,
            "label": "Betreuung",
            "warum": "94 Bewohner bei 3 °C und Nieselregen, hoher Pflegebedarf."
          },
          {
            "t": "key",
            "any": [
              "HEIM"
            ],
            "pts": 2,
            "label": "Einrichtungsleitung und Heimaufsicht",
            "warum": "Bewohnerliste, Medikation, zusätzliches Pflegepersonal."
          },
          {
            "t": "key",
            "any": [
              "GWA"
            ],
            "pts": 1,
            "label": "GW-Atemschutz",
            "warum": "Hoher Verbrauch an Atemschutzgeräten und Fluchthauben."
          },
          {
            "t": "key",
            "any": [
              "ELW2"
            ],
            "pts": 1,
            "label": "ELW 2 mit Führungsunterstützung",
            "warum": "Fünf Einsatzabschnitte."
          },
          {
            "t": "key",
            "any": [
              "WB2",
              "WACHE2"
            ],
            "pts": 1,
            "label": "Wachbesetzung FRW 2",
            "warum": "Löschzug 2 ist langfristig gebunden."
          },
          {
            "t": "key",
            "any": [
              "BUS"
            ],
            "pts": 1,
            "label": "Busse der Verkehrsbetriebe",
            "warum": "Wärmeraum und Transport für evakuierte Bewohner."
          },
          {
            "t": "key",
            "any": [
              "UNTER"
            ],
            "pts": 1,
            "label": "Ersatzunterbringung",
            "warum": "Der Nordflügel bleibt bis auf Weiteres unbewohnbar."
          },
          {
            "t": "key",
            "any": [
              "KH"
            ],
            "pts": 1,
            "label": "Krankenhäuser vorwarnen",
            "warum": "Rauchgasvergiftungen bei vorerkrankten Bewohnern."
          },
          {
            "t": "key",
            "any": [
              "PSNV"
            ],
            "pts": 1,
            "label": "PSNV",
            "warum": "Bewohner, Angehörige und Pflegepersonal."
          }
        ],
        "kann": [
          "Pressesprecher",
          "Polizei für Verkehrslenkung",
          "D-Dienst informieren"
        ]
      }
    ],
    "kommission": [
      {
        "id": "gefahren",
        "typ": "matrix",
        "titel": "Gefahren",
        "frage": "Die Kommission fragt: Welche Gefahren sehen Sie an dieser Einsatzstelle und für wen?",
        "soll": [
          "Atemgifte:Menschen",
          "Atemgifte:Mannschaft",
          "Angstreaktion:Menschen",
          "Ausbreitung:Menschen",
          "Ausbreitung:Sachwerte",
          "Erkrankung/Verletzung:Menschen",
          "Erkrankung/Verletzung:Mannschaft",
          "Explosion:Menschen",
          "Explosion:Mannschaft"
        ],
        "hinweis": "Die Explosionsgefahr ergibt sich aus den Sauerstoffflaschen im Lagerraum 2. OG Nord. Bettlägerige und demente Bewohner können sich nicht selbst retten."
      },
      {
        "id": "begruendung",
        "typ": "text",
        "titel": "Begründung",
        "frage": "Die Kommission fragt: Begründen Sie Ihre Abschnittsbildung und die räumliche Lage der Abschnitte.",
        "kriterien": [
          [
            "Trennung von Brandbekämpfung und Menschenrettung wegen der Atemschutzintensität",
            2
          ],
          [
            "Südflügel hinter der Brandwand als sicherer Bereich",
            2
          ],
          [
            "Medizinische Rettung im Foyer Süd mit Zugang von außen",
            1
          ],
          [
            "Betreuung im Speisesaal Süd oder in Bussen, getrennt von der MedRett",
            1
          ],
          [
            "Bereitstellungsraum an der Lindenallee mit freier Anfahrt",
            1
          ],
          [
            "Führungsspanne eingehalten",
            1
          ]
        ]
      },
      {
        "id": "befehl",
        "typ": "text",
        "titel": "Befehl",
        "frage": "Die Kommission fordert: Erteilen Sie dem Abschnittsleiter Menschenrettung und Evakuierung Ihren Befehl.",
        "kriterien": [
          [
            "Lage: etwa 9 Bewohner im 2. OG Nord, 5 bettlägerig, Sauerstoff in zwei Zimmern",
            1
          ],
          [
            "Auftrag: Absuchen und Retten aller Personen im 2. OG Nordflügel, durchsuchte Räume kennzeichnen",
            2
          ],
          [
            "Horizontale Evakuierung 1. OG Nord in den Südflügel hinter die Brandwand, Rauchschutztüren schließen",
            2
          ],
          [
            "Kontrolle 3. OG und Treppenraum Nord",
            1
          ],
          [
            "Übergabe der Geretteten an die Sichtung im Foyer Süd",
            1
          ],
          [
            "Atemschutz: Sicherheitstrupp, Atemschutzüberwachung, Fluchthauben",
            1
          ],
          [
            "Verbindung über MUS_20, Rückmeldung nach Abschluss jedes Geschosses",
            1
          ]
        ]
      },
      {
        "id": "lageaenderung",
        "typ": "text",
        "titel": "Lageänderung",
        "frage": "03:25 Uhr: Der Angriffstrupp meldet Brandausbreitung über die Fassade in das Zimmer 3.14 im 3. OG. Im 3. OG Nord befinden sich zwölf Bewohner. Wie reagieren Sie?",
        "kriterien": [
          [
            "Schwerpunkt verlagern: Menschenrettung 3. OG Nord vorrangig",
            2
          ],
          [
            "Zusätzliche Atemschutztrupps, Alarmstufe prüfen",
            1
          ],
          [
            "Brandbekämpfung von außen über die Drehleiter, Riegelstellung an der Fassade",
            2
          ],
          [
            "Horizontale Evakuierung des 3. OG über den Treppenraum Süd",
            1
          ],
          [
            "Unterabschnitt 3. OG bilden",
            1
          ],
          [
            "Rückmeldung an die Leitstelle, MANV-Stufe prüfen",
            1
          ]
        ]
      }
    ],
    "presse": {
      "id": "presse",
      "typ": "text",
      "titel": "O-Ton Pressekonferenz",
      "anlass": "04:30 Uhr, die Lokalzeitung und ein Radiosender sind an der Lindenallee eingetroffen und bitten um ein Statement.",
      "frage": "Geben Sie einen O-Ton von etwa 60 Sekunden ab.",
      "kriterien": [
        [
          "Vorstellung mit Name und Funktion",
          1
        ],
        [
          "Gesicherte Fakten zum Brand in wenigen Sätzen",
          1
        ],
        [
          "Keine Angaben zur Brandursache",
          1
        ],
        [
          "Keine Namen und kein Gesundheitszustand einzelner Bewohner",
          2
        ],
        [
          "Verweis auf den Träger und ein Infotelefon für Angehörige",
          2
        ],
        [
          "Maßnahmen benannt: Rettung, Verlegung, Unterbringung",
          1
        ],
        [
          "Anerkennung für das Pflegepersonal und die Einsatzkräfte",
          1
        ],
        [
          "Hinweis auf die nächste Information",
          1
        ]
      ],
      "sekunden": 60
    }
  },
  {
    "id": "ubahn-domplatz",
    "beispiel": true,
    "titel": "Zugbrand U-Bahnhof Domplatz",
    "typ": "tunnel",
    "x": 46.4,
    "y": 44.6,
    "ort": {
      "adresse": "U-Bahnhof Domplatz, Linie U 2, Bahnsteigebene -2",
      "detail": "Altstadt, Innenstadt",
      "wb": "Wachbezirk 1, Ausrückebereich LZ 1"
    },
    "zeit": "Freitag",
    "datum": "2026-11-06",
    "t0": "17:18",
    "meldender": "Leitstelle Verkehrsbetriebe",
    "wetter": "9 °C, trocken, Wind aus Nordwest mit 4 m/s",
    "stichwort": "F 3 U-Bahn · MANV 20",
    "meldung": "Leitstelle Musterstadt für C-Dienst. Einsatz F 3 U-Bahn und MANV 20 im U-Bahnhof Domplatz, Linie U 2. Die Leitstelle der Verkehrsbetriebe meldet einen brennenden Zug im Tunnel südlich des Bahnhofs mit etwa 140 Fahrgästen. Der Fahrstrom ist abgeschaltet, die Erdung ist noch nicht bestätigt. Alarmiert sind Löschzug 1, Löschzug 2, Löschzug 11, GW-Atemschutz und die Einsatzmittelkette MANV 20. Sie werden zur Übernahme der Einsatzleitung angefordert.",
    "alarmiert": [
      "LZ1",
      "LZ2",
      "FF11",
      "GWA",
      "MANV20"
    ],
    "cAlarm": 4,
    "uebergabe": {
      "von": "B-Dienst 1, Zugführer Löschzug 1",
      "text": [
        "Herr Verbandsführer, B-Dienst 1. Wir sind um 17:22 Uhr eingetroffen.",
        "Ein Zug der Linie U 2 in Richtung Hauptbahnhof steht etwa 250 Meter südlich des Bahnsteigs im Tunnel. Laut Fahrer brennt es im Unterflurbereich des zweiten Wagens. Der Fahrer hat die Türen geöffnet, die Fahrgäste flüchten zu Fuß durch den Tunnel zum Bahnsteig Domplatz.",
        "Die Tunnellüftung fördert derzeit in Richtung Bahnsteig. Die Bahnsteigebene ist im südlichen Drittel verraucht, Rauch steigt über die Treppe Süd zur Verteilerebene. Die Rolltreppen sind gestoppt.",
        "Etwa 60 Fahrgäste haben den Bahnhof über den Ausgang Nord zum Domplatz verlassen, viele husten. Zwei Trupps des Löschzuges 1 sind unter Atemschutz über die Treppe Nord zum Bahnsteig vorgegangen und haben zwei Personen gerettet. Acht Verletzte liegen am Ausgang Nord, der Rettungsdienst sichtet dort mit einem NEF und zwei RTW.",
        "Der Fahrstrom ist laut Verkehrsbetrieben abgeschaltet, die Erdung ist nicht bestätigt. Den Gleisbereich habe ich daher noch nicht freigegeben. Im Tunnel und im Zug werden noch etwa 50 Personen vermutet.",
        "Der Löschzug 2 ist eingetroffen und steht am Domplatz, der Löschzug 11 ist auf Anfahrt. Offen sind die Tunnelrettung, der Zugang über den Notausstieg Süd und die Betreuung der unverletzten Fahrgäste. Ich bitte um Übernahme."
      ]
    },
    "info": [
      {
        "titel": "Objekt",
        "zeilen": [
          [
            "Ebenen",
            "Verteilerebene -1, Bahnsteigebene -2 mit Mittelbahnsteig 120 m"
          ],
          [
            "Zugänge",
            "Ausgang Nord Domplatz, Ausgang Ost Prinzipalmarkt, Notausstieg Süd an der Rothenburg nach 400 m"
          ],
          [
            "Tunnel",
            "Zweigleisig mit Fluchtweg am Rand, Notausstiege etwa alle 600 m"
          ],
          [
            "Löschwasser",
            "Trockene Steigleitung mit Einspeisung am Ausgang Nord"
          ],
          [
            "Funk",
            "BOS-Objektfunkanlage im Bahnhof, im Tunnel nur DMO"
          ]
        ]
      },
      {
        "titel": "Besondere Gefahr",
        "zeilen": [
          [
            "Fahrstrom",
            "750 V Gleichstrom über Stromschiene. Betreten des Gleisbereichs erst nach bestätigter Erdung durch die Verkehrsbetriebe"
          ],
          [
            "Lüftung",
            "Tunnellüftung durch die Verkehrsbetriebe umsteuerbar"
          ],
          [
            "Rauch",
            "Brandrauch aus Kunststoffen und Kabeln, schnelle Sichtbehinderung"
          ],
          [
            "Wege",
            "Lange Atemschutzwege, Rückzug muss gesichert sein"
          ]
        ]
      }
    ],
    "lagekarte": [
      {
        "t": "flaeche",
        "pts": [
          [
            60,
            40
          ],
          [
            580,
            40
          ],
          [
            580,
            110
          ],
          [
            60,
            110
          ]
        ],
        "f": "platz",
        "txt": "Domplatz"
      },
      {
        "t": "gebaeude",
        "x": 220,
        "y": 150,
        "w": 200,
        "h": 60,
        "txt": "Bahnsteig -2"
      },
      {
        "t": "linie",
        "pts": [
          [
            200,
            140
          ],
          [
            200,
            390
          ]
        ],
        "s": "gleis"
      },
      {
        "t": "linie",
        "pts": [
          [
            440,
            140
          ],
          [
            440,
            390
          ]
        ],
        "s": "gleis"
      },
      {
        "t": "text",
        "x": 455,
        "y": 380,
        "txt": "Richtung Hbf"
      },
      {
        "t": "fz",
        "x": 200,
        "y": 300,
        "txt": "U 2",
        "org": "zivil",
        "w": 40,
        "h": 90,
        "vertikal": true
      },
      {
        "t": "brand",
        "x": 215,
        "y": 310,
        "txt": "Wagen 2"
      },
      {
        "t": "rauch",
        "x": 260,
        "y": 230
      },
      {
        "t": "pfeil",
        "x1": 250,
        "y1": 360,
        "x2": 250,
        "y2": 240,
        "txt": "Lüftung"
      },
      {
        "t": "ausgang",
        "x": 300,
        "y": 120,
        "txt": "Ausgang Nord"
      },
      {
        "t": "ausgang",
        "x": 470,
        "y": 160,
        "txt": "Ausgang Ost"
      },
      {
        "t": "fz",
        "x": 120,
        "y": 75,
        "txt": "LZ 1",
        "org": "fw"
      },
      {
        "t": "fz",
        "x": 520,
        "y": 75,
        "txt": "LZ 2",
        "org": "fw"
      },
      {
        "t": "el",
        "x": 60,
        "y": 120,
        "txt": "B 1"
      },
      {
        "t": "ablage",
        "x": 330,
        "y": 75,
        "txt": "Sichtung"
      },
      {
        "t": "fz",
        "x": 400,
        "y": 75,
        "txt": "RTW",
        "org": "rd"
      },
      {
        "t": "fz",
        "x": 440,
        "y": 75,
        "txt": "RTW",
        "org": "rd"
      },
      {
        "t": "fz",
        "x": 260,
        "y": 75,
        "txt": "NEF",
        "org": "rd"
      },
      {
        "t": "personen",
        "x": 190,
        "y": 75,
        "txt": "ca. 60 Fahrgäste"
      },
      {
        "t": "offen",
        "x": 560,
        "y": 360,
        "txt": "Notausstieg Süd"
      },
      {
        "t": "offen",
        "x": 600,
        "y": 140,
        "txt": "Betreuung"
      },
      {
        "t": "offen",
        "x": 80,
        "y": 220,
        "txt": "Bereitstellungsraum"
      },
      {
        "t": "wind",
        "x": 600,
        "y": 230,
        "dir": 135,
        "txt": "NW 4 m/s"
      },
      {
        "t": "tz",
        "z": "Gefahren/Gefahr_durch_elektrischen_Strom",
        "x": 150,
        "y": 250,
        "s": 34,
        "txt": "750 V"
      }
    ],
    "nachfragen": [
      {
        "f": "Ist die Erdung inzwischen bestätigt?",
        "a": "Nein. Der Fahrstrom ist abgeschaltet, ein Mitarbeiter der Verkehrsbetriebe mit Erdungsgarnitur ist unterwegs. Ankunft etwa 17:40 Uhr.",
        "wichtig": true
      },
      {
        "f": "Kann die Tunnellüftung umgesteuert werden?",
        "a": "Laut Leitstelle der Verkehrsbetriebe ja, auf Anweisung der Feuerwehr innerhalb weniger Minuten. Bislang hat das niemand angewiesen.",
        "wichtig": true
      },
      {
        "f": "Wie viele Personen werden noch im Tunnel vermutet?",
        "a": "Der Fahrer schätzt 140 Fahrgäste. Etwa 60 sind am Domplatz, zwei haben wir gerettet. Rund 50 werden noch im Tunnel oder im Zug vermutet, der Rest hat den Bahnhof vermutlich über den Ausgang Ost verlassen.",
        "wichtig": true
      },
      {
        "f": "Wie ist die Lage am Ausgang Ost?",
        "a": "Unbekannt. Dort ist noch keine Einheit.",
        "wichtig": true
      },
      {
        "f": "Ist der Notausstieg Süd erreichbar?",
        "a": "Ja, über die Rothenburg. Es ist ein Treppenschacht von etwa zwölf Metern. Ob er rauchfrei ist, wissen wir nicht.",
        "wichtig": true
      },
      {
        "f": "Gibt es mobilitätseingeschränkte Fahrgäste?",
        "a": "Der Fahrer berichtet von einer Person im Rollstuhl im dritten Wagen.",
        "wichtig": true
      },
      {
        "f": "Ist die trockene Steigleitung belegt?",
        "a": "Nein, die Einspeisung am Ausgang Nord ist noch frei."
      },
      {
        "f": "Funktioniert der Funk unten?",
        "a": "Auf dem Bahnsteig funktioniert die Objektfunkanlage. Im Tunnel arbeiten wir im DMO."
      },
      {
        "f": "Was ist mit dem Gegengleis?",
        "a": "Der Gegenverkehr ist gestoppt, der Zug in Gegenrichtung steht am Hauptbahnhof."
      },
      {
        "f": "Gibt es verletzte Einsatzkräfte?",
        "a": "Nein."
      }
    ],
    "ausarbeitung": [
      {
        "id": "orga",
        "typ": "abschnitte",
        "titel": "Führungsorganisation und Abschnittsbildung",
        "frage": "Skizzieren Sie die Führungsorganisation mit Abschnitten, Abschnittsleitern und Rufgruppen.",
        "soll": [
          "Brandbekämpfung",
          "Menschenrettung und Evakuierung",
          "Medizinische Rettung",
          "Betreuung",
          "Bereitstellungsraum"
        ],
        "kann": [
          "Logistik und Atemschutz",
          "Absperrung und Verkehr",
          "Technische Rettung"
        ],
        "hinweis": "Ein eigener Abschnitt am Notausstieg Süd ist sinnvoll, sobald dieser Zugang genutzt wird. Im Tunnel wird im DMO kommuniziert."
      },
      {
        "id": "massnahmen",
        "typ": "text",
        "titel": "Weitere Maßnahmen",
        "frage": "Legen Sie die weiteren Maßnahmen und Einsatzschwerpunkte in der Reihenfolge fest.",
        "kriterien": [
          [
            "Lüftung umsteuern lassen: Abluft Richtung Hauptbahnhof, Bahnsteig und Rettungsweg rauchfrei",
            2
          ],
          [
            "Menschenrettung vom Bahnsteig in den Tunnel erst nach bestätigter Erdung",
            2
          ],
          [
            "Zweiter Zugang über den Notausstieg Süd erkunden und nutzen",
            1
          ],
          [
            "Brandbekämpfung am Zug zur Sicherung der Rettung über die trockene Steigleitung",
            1
          ],
          [
            "Lenkung der Selbstretter zum Ausgang Nord, Sammelstelle am Domplatz",
            1
          ],
          [
            "Patientenablage und Betreuung am Domplatz, getrennt von Anfahrtswegen",
            1
          ],
          [
            "Atemschutzlogistik und Ablösung wegen langer Wege",
            1
          ]
        ]
      },
      {
        "id": "lage",
        "typ": "text",
        "titel": "Lagemeldung",
        "frage": "Formulieren Sie Ihre Lagemeldung an die Leitstelle.",
        "kriterien": [
          [
            "Übernahme der Einsatzleitung durch den C-Dienst mit Uhrzeit",
            1
          ],
          [
            "Lage: Zugbrand im Tunnel 250 m südlich, Verrauchung Bahnsteig und Verteilerebene",
            1
          ],
          [
            "Personen: etwa 140 Fahrgäste, etwa 50 im Tunnel vermutet, 10 Patienten",
            1
          ],
          [
            "Maßnahmen: Menschenrettung vom Bahnsteig, Gleisbereich nicht freigegeben",
            1
          ],
          [
            "Konkrete Nachforderungen benannt (MANV 50, Alarmstufe, Verkehrsbetriebe)",
            2
          ],
          [
            "Forderung an Verkehrsbetriebe: Erdung bestätigen, Lüftung umsteuern",
            1
          ],
          [
            "Einsatzleitung auf MUS_90, nächste Lagemeldung terminiert",
            1
          ]
        ]
      },
      {
        "id": "nachf",
        "typ": "nachforderung",
        "titel": "Nachalarmierung",
        "frage": "Alarmieren Sie über Karte, Leiste und Stichworte alle erforderlichen Kräfte nach und informieren Sie die erforderlichen Stellen.",
        "soll": [
          {
            "t": "key",
            "any": [
              "MANV50"
            ],
            "pts": 3,
            "label": "Erhöhung auf MANV 50",
            "warum": "140 Fahrgäste mit Rauchgasexposition, 50 Personen im Tunnel vermutet."
          },
          {
            "t": "lz",
            "min": 5,
            "pts": 2,
            "label": "Erhöhung auf F 5 bzw. zwei weitere Löschzüge",
            "warum": "Lange Atemschutzwege, Ablösung und zweiter Zugang über den Notausstieg Süd."
          },
          {
            "t": "key",
            "any": [
              "VB"
            ],
            "pts": 2,
            "label": "Notfallmanager Verkehrsbetriebe",
            "warum": "Erdung bestätigen, Lüftung umsteuern, Zugverkehr einstellen."
          },
          {
            "t": "key",
            "any": [
              "ELW2"
            ],
            "pts": 2,
            "label": "ELW 2 mit Führungsunterstützung",
            "warum": "Mehrere Abschnitte, Objektfunk und DMO im Tunnel."
          },
          {
            "t": "key",
            "any": [
              "SEGBT"
            ],
            "pts": 1,
            "label": "Betreuung",
            "warum": "Zahlreiche unverletzte Fahrgäste am Domplatz."
          },
          {
            "t": "key",
            "any": [
              "BUS"
            ],
            "pts": 1,
            "label": "Busse der Verkehrsbetriebe",
            "warum": "Wärme und Abtransport der Fahrgäste."
          },
          {
            "t": "key",
            "any": [
              "WB1",
              "WB2",
              "WACHE1",
              "WACHE2"
            ],
            "pts": 1,
            "label": "Wachbesetzung",
            "warum": "Beide Innenstadtzüge und LZ 11 sind gebunden."
          },
          {
            "t": "key",
            "any": [
              "POL"
            ],
            "pts": 1,
            "label": "Polizei",
            "warum": "Absperrung der Innenstadt, Freihalten der Anfahrtswege."
          },
          {
            "t": "key",
            "any": [
              "KH"
            ],
            "pts": 1,
            "label": "Krankenhäuser vorwarnen",
            "warum": "Viele Rauchgasvergiftungen."
          },
          {
            "t": "key",
            "any": [
              "BEZREG"
            ],
            "pts": 1,
            "label": "Bezirksregierung informieren",
            "warum": "MANV 50 mit überörtlicher Hilfe."
          },
          {
            "t": "key",
            "any": [
              "DDIENST"
            ],
            "pts": 1,
            "label": "D-Dienst informieren",
            "warum": "Großschadenslage in der Innenstadt."
          },
          {
            "t": "key",
            "any": [
              "PSNV"
            ],
            "pts": 1,
            "label": "PSNV",
            "warum": "Fahrgäste und Angehörige."
          }
        ],
        "kann": [
          "GA LIMA der LG 33 zur Ausleuchtung",
          "GW-Höhenrettung für Rettung über Schächte",
          "Pressesprecher"
        ]
      }
    ],
    "kommission": [
      {
        "id": "gefahren",
        "typ": "matrix",
        "titel": "Gefahren",
        "frage": "Die Kommission fragt: Welche Gefahren sehen Sie an dieser Einsatzstelle und für wen?",
        "soll": [
          "Atemgifte:Menschen",
          "Atemgifte:Mannschaft",
          "Angstreaktion:Menschen",
          "Ausbreitung:Menschen",
          "Ausbreitung:Sachwerte",
          "Erkrankung/Verletzung:Menschen",
          "Erkrankung/Verletzung:Mannschaft",
          "Elektrizität:Menschen",
          "Elektrizität:Mannschaft"
        ],
        "hinweis": "Die Stromschiene ist bis zur bestätigten Erdung als spannungsführend zu betrachten. Panik und Orientierungslosigkeit im verrauchten Tunnel sind zu erwarten."
      },
      {
        "id": "begruendung",
        "typ": "text",
        "titel": "Begründung",
        "frage": "Die Kommission fragt: Begründen Sie Ihre Abschnittsbildung und die räumliche Lage der Abschnitte.",
        "kriterien": [
          [
            "Menschenrettung getrennt von Brandbekämpfung wegen Strömung und Rauch",
            2
          ],
          [
            "Eigener Abschnitt oder Unterabschnitt am Notausstieg Süd",
            1
          ],
          [
            "Atemschutzlogistik und Sammelplatz am Ausgang Nord",
            1
          ],
          [
            "Medizinische Rettung und Betreuung am Domplatz räumlich getrennt",
            2
          ],
          [
            "Bereitstellungsraum mit freigehaltener Zufahrt in der Innenstadt",
            1
          ],
          [
            "Kommunikation: Objektfunk am Bahnsteig, DMO im Tunnel",
            1
          ]
        ]
      },
      {
        "id": "befehl",
        "typ": "text",
        "titel": "Befehl",
        "frage": "Die Kommission fordert: Erteilen Sie dem Abschnittsleiter Menschenrettung Ihren Befehl.",
        "kriterien": [
          [
            "Lage: etwa 50 Personen zwischen Bahnsteig und Zug, Lüftung wird umgesteuert",
            1
          ],
          [
            "Auftrag: Tunnel zwischen Bahnsteig und Zug absuchen, Personen retten, Selbstretter zum Ausgang Nord lenken",
            2
          ],
          [
            "Gleisbereich erst nach bestätigter Erdung betreten",
            2
          ],
          [
            "Zugang über Notausstieg Süd erkunden",
            1
          ],
          [
            "Atemschutz: Rückzugsweg sichern, Wärmebildkamera, Sicherheitstrupp, Atemschutzüberwachung",
            1
          ],
          [
            "Übergabe der Geretteten an die Sichtung am Ausgang Nord",
            1
          ],
          [
            "Verbindung über MUS_20 und DMO im Tunnel, regelmäßige Rückmeldung",
            1
          ]
        ]
      },
      {
        "id": "lageaenderung",
        "typ": "text",
        "titel": "Lageänderung",
        "frage": "17:41 Uhr: Die Verkehrsbetriebe bestätigen die Erdung. Zugleich meldet ein Trupp am Zug eine Rauchdurchzündung im Wagen 2. Der Rollstuhlfahrer im Wagen 3 ist ansprechbar. Wie reagieren Sie?",
        "kriterien": [
          [
            "Gleisbereich freigeben und an alle Trupps melden",
            1
          ],
          [
            "Rettung des Rollstuhlfahrers vorrangig mit Rettungstrupp und Tragehilfe",
            2
          ],
          [
            "Brandbekämpfung am Zug zur Sicherung der Rettung, Riegel zwischen Wagen 2 und 3",
            2
          ],
          [
            "Lüftung in Richtung Hauptbahnhof sicherstellen",
            1
          ],
          [
            "Sicherheitstrupp in Bereitschaft",
            1
          ],
          [
            "Rückmeldung an die Leitstelle",
            1
          ]
        ]
      }
    ],
    "presse": {
      "id": "presse",
      "typ": "text",
      "titel": "O-Ton Pressekonferenz",
      "anlass": "18:30 Uhr, Pressekonferenz am Domplatz. Mehrere Fernsehsender und Onlineredaktionen sind vor Ort.",
      "frage": "Geben Sie einen O-Ton von etwa 60 Sekunden ab.",
      "kriterien": [
        [
          "Vorstellung mit Name und Funktion",
          1
        ],
        [
          "Gesicherte Fakten zum Ereignis in wenigen Sätzen",
          1
        ],
        [
          "Nur bestätigte Zahlen zu Betroffenen",
          1
        ],
        [
          "Keine Spekulation zur Ursache",
          2
        ],
        [
          "Hinweise: Innenstadt meiden, Linie U 2 eingestellt, Ersatzverkehr",
          2
        ],
        [
          "Angehörige: Infotelefon oder Sammelstelle benannt",
          1
        ],
        [
          "Keine Namen, keine Diagnosen",
          1
        ],
        [
          "Hinweis auf die nächste Information",
          1
        ]
      ],
      "sekunden": 60
    }
  }
];
