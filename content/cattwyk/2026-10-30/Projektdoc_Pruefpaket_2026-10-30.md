# PPWR Radar – Cattwyk-Prüfpaket v3, Stand 30.10.2026

Versandfertig am 30.10.2026 (Prüfpaket 59 Seiten PDF/DOCX, Beilage Delta-Recherchen 17./19./26.10., KMU-Leitfaden KH-01-26-088-EN-N, Anschreiben). Dateien im Repo unter content/cattwyk/2026-10-30/. Ersetzt die Fassung vom 26.10.2026. Datenbank: 78 Praxisfragen, A35 am 30.10.2026 konsolidiert (Upsert via INSERT … ON CONFLICT, umgeht das UPDATE-Limit des SQL-Tools).


Ausgangslage in der Datenbank (Stand 30.10.2026): 78 Praxisfragen (Auslegungen), 40 Anforderungen, 23 Regeln der Rollen-Engine, 8 Vereinfachungs-Hinweise, 67 Glossar-Lemmata – alle im Status „Entwurf“, nichts davon ist bisher ausgespielt. 20 Praxisfragen tragen das Flag „(neu 10/2026)“ (A30–A36, B18–B21, C13–C21), 17 ältere Praxisfragen tragen ein offenes (!)-Flag aus der Verifikation vor dem Livestream. Vier Anforderungen (9, 19, 20, 21) wurden am 26.10.2026 ergänzt; A35 wurde am 30.10.2026 konsolidiert.

Gewünschte Rückmeldung je Datensatz: (a) freigeben wie entworfen, (b) freigeben mit Änderung (bitte Wortlaut), (c) nicht ausspielen, nur Hintergrund. Bei Divergenzen zwischen Kommission und ZSVR: Welche Lesart spielt der Radar für Deutschland aus, und mit welchem Hinweis? Das Produkt erklärt, ordnet ein, priorisiert und erstellt Entwürfe; es berät nicht.

Einordnungskürzel: [RN] Rechtsnorm · [UA] unverbindliche Auslegung der EU-Kommission · [BI] Behördeninformation, keine Rechtsnorm · [GE] Gerichtsentscheidung · [VF] Verfahren, nicht erlassen · [VM] Verbandsmeinung. Unsicherheiten mit (!).

## Priorität 1 – Session-Pflicht (Produktkern, Divergenz Behörde/Kommission oder Datum im Bestand überholt)

### P1.1 Versandaufkleber und Zusammenfügen der Versandverpackung – A30, A31, C21 (Anforderungen 7, 8)
- **Nutzerfragen:** A30 „Wir sind Onlinehändler und kleben auf fertig gekaufte Versandkartons nur unser Versandetikett. Im Sommer hieß es, damit würden wir zum Erzeuger. Stimmt das?“ – A31 „Wir kaufen Faltkartons flach ein, falten sie, kleben sie mit unserem Klebeband zu und füllen mit Luftpolsterfolie. Sind wir Erzeuger dieser Versandverpackung?“
- **Stand:** Kommissions-FAQ 2. Ed. (03.08.2026) Kap. II FAQ 5–7 [UA]: Versandaufkleber ist kein Branding; Erzeuger (manufacturer) der Transportverpackung ist, wer die leere Verpackung in ihre endgültige Form bringt, mehrere Erzeuger je Sendung möglich. Seit 19.10.2026 zusätzlich der DG-ENV-Leitfaden „PPWR and small businesses“ (KH-01-26-088-EN-N, liegt bei) [UA]: Fn. 6 „sticker on the box for shipment purposes is not considered to be branding“; wer neutrale Kartons, Klebeband, Paletten ohne eigene Marke nutzt, ist nicht Erzeuger, Erzeuger ist der physische Hersteller/Lieferant. Dagegen ZSVR-Themenseite „Versand- und Onlinehandel“ [BI]: Fall B.2 (Zusammenfügen beim Händler) → Erzeuger; Fall B.3 (Hinzufügen zu fertiger Verpackung) → Erzeuger nur bei Einfluss auf die Recyclingfähigkeit (Art. 21); Versandetikett nicht eigens behandelt. Schriftliche ZSVR-Stellungnahme zum Etikett bis 30.10.2026 nicht auffindbar (!).
- **Fragen an die Kanzlei:** (1) Welche Lesart spielt der Radar für den deutschen Markt aus: Kommission (Etikett unschädlich, Faltkarton-Hersteller bleibt Erzeuger) oder ZSVR (Zusammenfügen macht zum Erzeuger)? (2) Ist die ZSVR-Lesart auf die Systembeteiligung (Hersteller/producer nach VerpackDG) beschränkt, oder reklamiert sie auch die Erzeugerrolle (manufacturer, Konformität) für sich? (3) Kann das Flag an Regel B1 der Rollen-Engine aufgelöst werden, und wie ist Regel A5 zu fassen?
- **Fundstellen:** Art. 3 Abs. 1 Nr. 13 und Nr. 15 lit. a PPWR; Art. 21 PPWR; § 3, § 7 VerpackDG. Verbindlichkeit beider Quellen: unverbindlich.

### P1.2 Musterfall Verpackungsebene Verlag/Versandhändler – A36 (Anforderungen 6, 7, 18, 31, 32, 38)
- **Nutzerfrage:** „Wir sind ein Verlag und verschicken Zeitschriften und Bücher an Leser, teils in Folie eingeschweißt, teils im Umschlag oder Buchkarton. Betrifft uns die PPWR, und was müssen wir für welche Verpackung tun?“
- **Stand:** Beruht auf der ZSVR-Unterscheidung formstabil/flexibel und der FAQ 2. Ed.; nutzt die Regeln D1–D5 der Rollen-Engine (Ebene Verpackungseinheit, Teil B.2). Divergenz aus P1.1 und die Lohnfertigungs-Zuordnung (A02) sind hier eingebaut. Antwort 2.016 Zeichen, über dem Zielkorridor 900–1.600.
- **Fragen:** Trägt die Zuordnung je Verpackung (Folie: Folienhersteller Erzeuger; Umschlag/Karton je nach Branding; Systembeteiligung beim Verlag als Hersteller)? Regeln D1–D5 gemeinsam prüfen. Kürzung auf 1.600 Zeichen freigeben.
- **Fundstellen:** Art. 3 Abs. 1 Nr. 1, 13, 15 lit. a, 18 PPWR; Art. 15 Abs. 2, 19, 24 PPWR; §§ 6, 7, 13 Abs. 3, 68 Abs. 2 VerpackDG; ZSVR-Katalog Allgemeiner Teil 08/2026 [BI].

### P1.3 Lohnabfüllung und Stretchfolie/Paletten aus dem Ausland – A02, A23 (Anforderung 8)
- **Stand:** A02 trägt das Flag „Lohnfertigungs-Zuordnung in Session bestätigen“; A23 trägt „U4: Session-Pflicht, bis dahin nicht ausspielen“ und wurde am 17.10.2026 um die FAQ-Aussage ergänzt, dass bei Stretchfolie der Folienhersteller Erzeuger ist. A29 verweist auf den Abgleich mit der EUNR-Lesart (EUNR-Papier nur Sekundärquelle).
- **Fragen:** (1) Lohnabfüller vs. Auftraggeber: Wer ist Erzeuger (manufacturer) und wer Hersteller (producer) bei Abfüllung unter Marke des Auftraggebers? (2) Bei Paletten und Stretchfolie aus NL: Importeur-/Vertreiberrolle des deutschen Empfängers und Systembeteiligung? (3) A23 freigeben oder weiter sperren?
- **Fundstellen:** Art. 3 Abs. 1 Nr. 13, 15 PPWR; Art. 16, 19 PPWR; § 3 VerpackDG.

### P1.4 Lagerware von vor dem 12.08.2026 – C15, C21 Aussage 4 gegen Anforderung 10 und C01
- **Nutzerfrage:** „Wir haben Verpackungen im Lager, die vor dem 12. August produziert wurden, aber noch nicht verkauft sind. Müssen wir die jetzt alle mit Erzeugerangaben nachkennzeichnen?“
- **Stand:** Unsere Lesart in Anforderung 10 und C01: kein Abverkaufsprivileg, Inverkehrbringen nach dem 12.08.2026 unterliegt der PPWR (Art. 3 Abs. 1 Nr. 10, 11). FAQ 2. Ed. Kap. X FAQ 5 und KMU-Leitfaden [UA]: keine Umetikettierung, keine Vernichtung, Angaben nach Art. 15 Abs. 5 und 6 per Begleitdokument oder digital.
- **Fragen:** Ist die pragmatische Kommissionslinie für Deutschland tragfähig (Marktüberwachung nach § 63 ff. VerpackDG, § 68 Abs. 17)? Wie formulieren wir Anforderung 10 um, ohne eine Konformitätszusage zu geben?
- **Fundstellen:** Art. 3 Abs. 1 Nr. 10, 11; Art. 15 Abs. 5, 6 PPWR; § 68 Abs. 17 VerpackDG.

### P1.5 Bevollmächtigter nach Art. 45 Abs. 3 – A35 (Watch-Item), A28, Anforderung 9, Regeln B3 und C6
- **Nutzerfrage:** „Es heißt, die Pflicht zum Bevollmächtigten für ausländische Online-Händler werde wieder gekippt. Müssen wir jetzt überhaupt noch einen benennen?“
- **Stand (30.10.2026):** Rechtslage unverändert, Pflicht seit 12.08.2026 [RN]. Verfahren 2025/0395(COD) [VF]: Kommissionsvorschlag COM(2025) 982 = Vollaussetzung bis 01.01.2035; EP-Position 20.10.2026 (T10-0345/2026, 616:9:39) = nur EU-Kleinst-/Kleinunternehmen (unter 50 Beschäftigte, unter 10 Mio. Euro Umsatz oder Bilanzsumme) bis 2035 oder Circular Economy Act; Ratsmandat 21.10.2026 (PM 841/26) = EU-Hersteller unter 1 t Verpackung je Kalenderjahr im jeweiligen Mitgliedstaat, Schutzklausel, Überprüfung bis 31.12.2030, Auslaufen 2032 (!); Trilog folgt. Kommission bittet Mitgliedstaaten, bis zur Entscheidung auf Sanktionen zu verzichten (politische Aussage). ZSVR: „Eine Befreiung von dieser Pflicht ist nicht möglich“ [BI]. Die Antwort A35 wurde am 30.10.2026 konsolidiert (Kommission = Vollaussetzung, EP = Größenkriterium, Rat = Mengenkriterium); Teil B.1 zeigt den aktuellen Wortlaut.
- **Fragen:** (1) Freigabe der Kernaussage „Pflicht gilt, Verzicht ist ein bewusstes Risiko“ und des Hinweises auf den Kommissions-Appell? (2) A28: Die Aussage „Bevollmächtigter kann nur eine unternehmensexterne Person sein“ ist nur als ZSVR-Information belegt – gibt es eine Norm-Fundstelle (§ 5 VerpackDG, Art. 45 Abs. 3 PPWR)? Normzitat für die Wirksamkeit mit LUCID-Bestätigung (§ 5 Abs. 4–6 VerpackDG?) (!). (3) Regeln B3 und C6 der Rollen-Engine.
- **Fundstellen:** Art. 45 Abs. 3 PPWR; § 5 Abs. 2 VerpackDG; A10-0266/2026; T10-0345/2026; Rat PM 841/26.

### P1.6 Kennzeichnungstermine als Mindestdaten – C14, Anforderungen 19, 20, 21, Anforderung 22/V9
- **Nutzerfrage:** „Wir planen unsere Verpackungsdrucke für 2028. Steht das harmonisierte Sortierlabel wirklich zum 12.08.2028 fest?“
- **Stand:** Durchführungsakt nach Art. 12 Abs. 6 / Art. 13 Abs. 2 hat die Frist 12.08.2026 verfehlt; Have-your-say 19243 nennt seit Oktober 2026 als Annahme Q2 2027 (Durchführungsbeschluss, kein Entwurf) [VF]. Unsere Berechnung über „je nachdem, welcher Zeitpunkt der spätere ist“: Pflicht frühestens Mitte 2029 (Sortierlabel, freiwillige Labels) bzw. Ende 2029/Anfang 2030 (Mehrweg) (!). Irreführungsverbot Art. 12 Abs. 8 gilt seit 12.08.2026.
- **Fragen:** (1) Bestätigung der Berechnung und der Formulierung „Mindestdatum“. (2) Exakte Wortlaute Art. 12 Abs. 1, 2, 4 und Art. 13 Abs. 1 am Volltext pinnen. (3) Art. 12 Abs. 9 (Kennzeichnung der Systembeteiligung ab 12.02.2027 nur über QR/digital): Was bedeutet das für den Grünen Punkt und für Anforderung 22 (derzeit gesperrt, V9)?
- **Fundstellen:** Art. 12 Abs. 1, 2, 4, 6, 7, 8, 9; Art. 13 Abs. 1, 2 PPWR.

### P1.7 Konformitätserklärung: Umfang, Ebene Verpackungseinheit, Delegation – C16, C21 Aussage 3, C03, C09 (Anforderungen 4, 5, 6, 37)
- **Nutzerfrage:** „Brauchen wir für jeden Karton, jede Folie und jedes Etikett eine eigene Konformitätserklärung? Und darf unser Bevollmächtigter die unterschreiben?“
- **Stand:** FAQ 2. Ed. Kap. XV FAQ 5/8/14, Kap. X FAQ 9 [UA]: eine DoC je Verpackungseinheit möglich; technische Dokumentation nicht delegierbar; DoC durch Bevollmächtigten nach Art. 17 mit Mandat. KMU-Leitfaden [UA]: DoC muss „derzeit nur“ Art. 5 (Schwermetalle, PFAS) abdecken (!). § 62 VerpackDG: Deutsch oder Englisch.
- **Fragen:** (1) Darf der Radar die Aussage „DoC derzeit nur Art. 5“ ausspielen, oder bleibt die Anhang-VIII-Struktur mit „nicht anwendbar“-Einträgen (unsere Empfehlung)? (2) „TD nicht delegierbar“ gegen Art. 17 Abs. 2 PPWR pinnen. (3) C03/C09: Absatz-Pins zu Art. 15 (V1) offen – welche Absätze tragen die Sprach- und Adressaussagen? (4) Relevanz für den Dokumenten-Generator: eine DoC je Verpackungseinheit als Default?
- **Fundstellen:** Art. 15 Abs. 3, 17, 18, 38, 39, Anhang VII und VIII PPWR; Art. 5 PPWR; § 62 VerpackDG.

## Priorität 2 – vor Freigabe der betroffenen Datensätze klären

### P2.1 Handels-Eigenmarke mit genanntem Abfüller – A32 (Anforderung 8)
Nutzerfrage: „Auf unserer Handelsmarke steht zusätzlich ‚hergestellt für … von Molkerei XY‘. Sind wir trotzdem Erzeuger der Verpackung?“ Stand: ZSVR-Meldung 12.08.2026 [BI]: Handelsunternehmen bei Eigenmarke Hersteller und in der Regel auch Erzeuger; Kommission FAQ Kap. II FAQ 6/7 [UA] mit Einzelfallvorbehalt bei Lizenzmodellen. Frage: Trägt „in der Regel“ als Default, und wie beschreiben wir den Lizenzfall? Fundstellen: Art. 3 Abs. 1 Nr. 13 lit. a, Nr. 15 lit. b PPWR.

### P2.2 Maßgefertigte neutrale Transportverpackung – A33 (Anforderungen 8, 40)
Nutzerfrage: „Wir lassen uns unbedruckte Transportkartons nach unseren Maßen und Spezifikationen fertigen. Ist der Kartonagenhersteller oder sind wir der Erzeuger?“ Stand: FAQ Kap. X FAQ 14 [UA] ordnet bei kundenspezifischer Spezifikation dem Auftraggeber zu; Regel A4 der Rollen-Engine stellt auf physische Herstellung ab; KMU-Leitfaden stellt für neutrale Standardverpackung auf den physischen Hersteller ab. Frage: Wo liegt die Grenze zwischen „Spezifikation“ und „Standardware“, und wie fassen wir Regel A4? Fundstellen: Art. 3 Abs. 1 Nr. 13, Art. 16 Abs. 1 PPWR.

### P2.3 Konzerninterne Verbringung – A34 (Anforderungen 8, 10)
Nutzerfrage: „Wir verpacken Teile in unserem Werk in Polen und schicken sie an unser eigenes Werk in Deutschland. Bringen wir diese Verpackung in Verkehr?“ Stand: FAQ Kap. II FAQ 13 [UA]: kein Inverkehrbringen. Frage: Verhältnis zur Definition Art. 3 Abs. 1 Nr. 10/11 und zur Systembeteiligung in Deutschland (Anfall als Abfall beim deutschen Werk). Fundstellen: Art. 3 Abs. 1 Nr. 10, 11 PPWR; § 3, § 7 VerpackDG.

### P2.4 Vollständigkeitserklärung 2026 – B18, B05 (Anforderung 33)
Nutzerfrage: „Unser Wirtschaftsprüfer fragt, ob wir für 2026 zwei Vollständigkeitserklärungen brauchen.“ Stand: ZSVR-Hinweise 2026 (PDF undatiert, verbreitet 13.08.2026) [BI]: eine VE je Hersteller nach § 10 VerpackDG; Prüfleitlinien 2024 gelten fort; Schulungspflicht § 56 Abs. 4, Bestandsprüfer bis 31.12.2027. Fragen: Normzitate § 68 Abs. 5 Satz 4, § 56 Abs. 4, § 68 Abs. 16 VerpackDG am Volltext bestätigen; B05-Flag „E06: Verweis § 66 Abs. 1 Nr. 6/7 auf § 68 Abs. 3 prüfen“.

### P2.5 Permanenttragetaschen – B20 (Anforderung 32)
Stand: BVerwG 23.07.2026 – 10 C 6.25 [GE, rechtskräftig] zu § 3 Abs. 8, § 7 VerpackG. Frage: Übertragung auf § 3 Abs. 6, § 7 Abs. 1 VerpackDG ist unsere Zuordnung, nicht die des Gerichts – tragfähig? ZSVR spricht von möglichen rückwirkenden Beteiligungspflichten; wie weit darf der Radar das sagen?

### P2.6 Katalog 2026 und E-Commerce-Verpackungen an Gewerbekunden – B21, B12 (Anforderung 32)
Stand: Katalog Allgemeiner Teil 08/2026 [BI] als norminterpretierende Verwaltungsvorschrift (§ 54 Abs. 1 Satz 2 Nr. 33 VerpackDG); VG Osnabrück 30.09.2026 – 7 A 112/24 [GE, nicht rechtskräftig] bestätigt Gesamtmarktbetrachtung. Frage: Verhältnis zu B12; Formulierung für B2B-Versender, die sich auf § 11 VerpackDG (Ausnahmen) berufen wollen.

### P2.7 Marktüberwachung ab Tag eins – C17, B04 (Anforderungen 4, 6)
Stand: FAQ Kap. XVI FAQ 1 [UA] („supportive approach“, Art. 62: zuerst Abhilfe); Kommissions-Äußerung „zunächst verwarnen“ vom 12.08.2026 nur per Instagram, keine förmliche Mitteilung (!); § 68 Abs. 17 VerpackDG (Bußgeld nach § 66 Abs. 2 erst ab 12.02.2027). Frage: Wie weit darf der Radar die Entwarnung formulieren, ohne eine Zusage zu geben?

### P2.8 Berichtigung Art. 29 Abs. 4 lit. b („Waren“ statt „Rohstoffe“) – C13 (Anforderung 27)
Stand: Berichtigung ABl. L 2026/90654 vom 04.08.2026 [RN], nur deutsche Fassung; Berichtigungsliste R(01)–R(07) am 19.10.2026 verifiziert, das (!) im Flag ist aufgelöst. Frage: Freigabe; Glossar- und Erklärtexte, die „Rohstoffe“ zitieren, werden angepasst.

### P2.9 Palettenfolie und Umreifungsbänder – C11 (Mehrweg)
Stand: Delegierter Beschluss (EU) 2026/429 [RN], ABl. 06.05.2026. Offenes Flag: Reichweite gegenüber Art. 29 Abs. 1 – Art. 1 des Beschlusses nimmt nur von Abs. 2 und 3 aus, Erwägungsgrund 2 erstreckt die Wirkung auf die Quoten des Abs. 1 (!). Frage: Welche Reichweite spielt der Radar aus? ABl.-Veröffentlichung ist belegt (EUR-Lex „Completed by 32026D0429“, 26.05.2026).

### P2.10 PET-Flaschen, Rezyklat-Berechnung – C12, C10 (Anforderung 14)
Stand: Detailaussagen (chemisches Recycling, Drittstaaten-Anrechnung) beruhen auf Kommissions-PM und Sekundärberichten; ABl.-Volltext des DB (EU) 2026/1425 vor Freigabe prüfen (!). C10: EU-Werte pinnen (V4/V5), Konkurrenz nationale Quote § 45 VerpackDG vs. Art. 7 PPWR ab 2030 klären.

### P2.11 ZSVR-Prüfschema Erzeuger/Hersteller – A29 (Anforderung 8)
Stand: ZSVR-Grundsätze (Markenvorrang, „EU-weit genau ein Erzeuger“) ohne exakte Normzitate auf der ZSVR-Seite [BI]; EUNR-Papier nur Sekundärquelle. Frage: Abgleich der ZSVR-Lesart mit der EUNR-Lesart und der FAQ 2. Ed.; was davon darf als „Behördenpraxis“ ausgespielt werden?

## Priorität 3 – Hintergrund oder Pins, kein Freigabe-Blocker

- **B19 Mindeststandard 2026** (Anforderungen 12, 35): Verwaltungsvorschrift nach § 26 Abs. 3 VerpackDG, gilt für 2027; Verhältnis zu Verordnungen nach § 26a und zu delegierten Rechtsakten nach Art. 6 Abs. 4 PPWR prüfen. B15-Flag „V16: AbfRRL-Zitat pinnen“.
- **C18 Rezyklat-Rechtsakte Art. 7 Abs. 8/9/10** (Anforderung 14): Initiativen 18753, 19033, 18752, Annahme Q4 2026, gesetzliche Frist 31.12.2026 [VF]. Keine Freigabefrage, Beobachtung.
- **C19 Registerformat Art. 44 Abs. 14** (Anforderung 31): Entwurf Ares(2026)7688068, Annahme überfällig [VF]; AT/CZ/EE fordern Zurückstellung (Sekundärquelle). Frage: Hinweis auf ein mögliches EU-Portal ausspielen oder nicht?
- **C20 Public Procurement Act, Streichung Art. 63 PPWR** (keine Anforderung): COM(2026) 590 vom 09.09.2026 [VF]. Fragen: Relevanz für Lieferanten der öffentlichen Hand; ausspielen oder Hintergrund; Antwort 1.839 Zeichen auf 1.600 kürzen.
- **Ältere Pins aus der Launch-Verifikation:** A05 „U8: Verbund-/Franchise-Eskalationsschwelle“ (Kleinstunternehmen im Franchise); A09 „U5: Wortlaut VO 2019/1020 pinnen“ (Fulfillment für Drittland-Kunden); A15 „U2: Anwendungsbereich § 7 Abs. 2 in Session“ (bedruckte Serviceverpackungen); A17 „Erstattungsverfahren ungeregelt → Eskalation“ (Weiterexport, Lizenz zurückholen); C05 „V2: Fortgeltungs-Mechanik bestätigen“ (Schwermetall-Grenzwert bei Mehrweg); C07 „V14: Absatz-Pins Art. 27/28“ (Mehrweg-Paletten, Systembeitritt).
- **Nichtigkeitsklagen gegen die PPWR** (Hintergrund): T-197/25 (Art. 50, Pfand) sowie T-236/25 bis T-249/25 (Art. 7 Abs. 1, 2, 5 lit. b; Art. 25 und Anhang V; Art. 29 Abs. 1–4; Art. 50 und Anhang X). Verfahrensstand nicht geprüft (!). Frage: Erwähnung im Radar sinnvoll, oder bis zu einer Entscheidung ignorieren?

## Querschnittsfragen (Produkt, nicht Datensatz)

1. Rollen-Engine: Regeln A4, A5 (physische Herstellung vs. Spezifikation/Branding), B1 (Zusammenfügen), B3 und C6 (Bevollmächtigter), D1–D5 (Ebene Verpackungseinheit) – gemeinsam mit P1.1 bis P1.3 prüfen.
2. Divergenz-Hinweis: Standardsatz für Datensätze, in denen Kommission und ZSVR auseinanderliegen (Vorschlag: „Die ZSVR vertritt für die Systembeteiligung in Deutschland eine strengere Lesart; der PPWR Radar weist beide aus und empfiehlt bis zur Klärung die strengere.“) – Freigabe des Wortlauts.
3. Kennzeichnung „unverbindliche Auslegung der EU-Kommission“: Gilt die Formel auch für den KMU-Leitfaden und die DG-ENV-Webseiten, oder braucht es eine eigene Kategorie „Information der EU-Kommission“?
4. Landing-Wortlaut: „juristische Plausibilisierung durch Cattwyk Rechtsanwaltsgesellschaft“ – bleibt die Nennung in der Zwischenstufe (redaktionell geprüft, juristische Prüfung läuft)?
5. Update-Ticker: Seit 30.10.2026 zeigt das Produkt die Funde des wöchentlichen Rechtsmonitorings als datierte Meldungen mit Quelle und Einordnung (rechtsverbindlich / unverbindliche Auslegung / Verfahren / Behördeninformation / Gericht), jeweils mit dem Hinweis „Entwurf – ungeprüft“ und dem Satz „Geltende Rechtslage dadurch unverändert“, wo das zutrifft. Auslegung bleibt den Praxisfragen vorbehalten. Frage: Ist diese Trennung (Meldung = Fakt mit Quelle, Praxisfrage = Einordnung nach Prüfung) aus Ihrer Sicht tragfähig, und soll die Kanzlei die Meldungen einzeln sehen oder nur stichprobenartig?

## Vollständigkeitsprüfung (30.10.2026)
- Alle 20 Praxisfragen mit Flag „(neu 10/2026)“ sind in Teil B.1 enthalten: A30, A31, A32, A33, A34, A35, A36, B18, B19, B20, B21, C13, C14, C15, C16, C17, C18, C19, C20, C21.
- Alle 17 älteren Praxisfragen mit offenem Flag sind in Teil B.4 enthalten: A02, A05, A09, A15, A17, A23, A28, A29, B05, B15, C03, C05, C07, C09, C10, C11, C12.
- Die Cattwyk-Abschnitte der Delta-Recherchen 17.10., 19.10. und 26.10.2026 sind eingearbeitet; die drei Recherchen liegen als Beilage bei, ebenso der KMU-Leitfaden der Kommission.
- Anforderungen mit (!)-Stellen im Fachtext: 24 von 40 (nr 1, 4, 5, 6, 7, 11, 14, 15, 16, 17, 18, 22, 23, 24, 25, 27, 29, 30, 33, 34, 35, 36, 37, 39). Davon sind 4, 5, 6, 7, 14, 22, 27, 33, 35 über die Praxisfragen oben abgedeckt; die übrigen 15 tragen eigene Unsicherheitsmarker, die in Teil C als Fundstellen-Pins erscheinen.

---

## Anschreiben (Entwurf, du-Form)

**Betreff:** PPWR Radar – wir gehen an den Start: Bitte um juristische Plausibilisierung unserer Wissensbasis

Liebe Julia, liebe Franziska,

lange nichts gehört von uns zum PPWR Radar – das Projekt lag seit August auf Eis, jetzt nehmen wir es wieder auf und wollen in den nächsten Wochen live gehen. Dafür brauchen wir euch.

**Worum es geht.** Der PPWR Radar erklärt Unternehmen, welche Rolle sie nach der PPWR und dem VerpackDG haben (Erzeuger, Hersteller, Importeur, Vertreiber), welche Pflichten daraus folgen und was sie konkret tun müssen – mit Fundstelle an jeder Aussage. Das Produkt erklärt, ordnet ein, priorisiert und erstellt Entwürfe; es berät nicht. Eure Rolle ist die juristische Plausibilisierung: Stimmt die Aussage, stimmt die Fundstelle, ist die Grenze richtig gezogen. Freigegebene Inhalte erscheinen im Produkt mit dem Hinweis „juristisch plausibilisiert durch Cattwyk“.

**Was im Anhang liegt.**

1. **Prüfpaket (PDF und Word, 59 Seiten, Rechtsstand 30.10.2026).** Es ist so gebaut, dass ihr so wenig Zeit wie möglich braucht:
   - *Prioritäten* (Seiten 3–6): sieben Punkte, an denen Kommission, ZSVR oder unser Datenbestand auseinanderliegen – das ist der Stoff für eine gemeinsame Session.
   - *Teil A – Sammelfreigabe:* 121 Datensätze ohne offenen Punkt, eine Zeile je Datensatz, Freigabe blockweise per Haken (etwa 60–90 Minuten Querlesen).
   - *Teil B – Einzelprüfung:* 65 Karten mit je einer konkreten Frage und drei Kästchen (freigeben / ändern / streichen), darunter 20 neue Praxisfragen zur Rechtsentwicklung seit Juli.
   - *Teil C – Fundstellen-Bestätigungen:* 68 Stellen, an denen wir eine Norm oder einen Absatz mit (!) als unsicher markiert haben.
   - *Teil D – Gesamtfreigabe.*
2. **Beilage Delta-Recherchen** (17.10., 19.10., 26.10.2026): alles, was sich seit Juli rechtlich und behördlich bewegt hat, mit Quellen – Kommissions-FAQ 2. Edition, Berichtigung der deutschen PPWR-Fassung, ZSVR-Veröffentlichungen, Mindeststandard 2026, Rechtsprechung, laufende EU-Verfahren.
3. **Neuer KMU-Leitfaden der Kommission** „PPWR and small businesses: What do I need to know?“ vom 19.10.2026 (KH-01-26-088-EN-N). Er ist für uns wichtig, weil er an zwei Stellen von der ZSVR-Lesart abweicht (Versandaufkleber, neutrale Transportverpackung) und zur Konformitätserklärung sagt, sie müsse „derzeit nur“ Art. 5 abdecken. Dazu haben wir konkrete Fragen (Prioritäten P1.1, P1.4, P1.7).

**Was wir uns wünschen.**

- **Eine Videosession von 90 Minuten**, in der wir die Prioritätenliste und Teil B gemeinsam durchgehen. Wir setzen die Entscheidungen dabei live im System. Mögliche Termine schlage ich gern vor – sagt mir, welche Wochen bei euch gehen.
- **Teil A und Teil C** könnt ihr vorab oder danach erledigen, in Word (Kästchen anklicken, Anmerkung in die Zeile) oder im PDF (kommentieren oder ausdrucken).
- Wenn euch beim Lesen etwas grundsätzlich falsch vorkommt, lieber früh ein kurzer Anruf als eine lange Mail.

**Was seit dem Sommer dazugekommen ist**, damit ihr es einordnen könnt: Das System bestimmt Rollen und Pflichten jetzt je Verpackung statt nur je Produktlinie (Regeln D1–D5), zeigt dazu Hinweise zur Vereinfachung (z. B. Umschlag statt selbst angewendeter Folie) und hat seit dieser Woche einen Update-Ticker, der die Funde unseres wöchentlichen Rechtsmonitorings als datierte Meldungen mit Quelle und Einordnung ausspielt. Auslegung bleibt den Praxisfragen vorbehalten, die erst nach eurer Prüfung sichtbar werden. Ob diese Trennung aus eurer Sicht trägt, ist eine der Querschnittsfragen im Paket.

Bis zur Freigabe spielen wir redaktionell geprüfte Inhalte mit dem Hinweis „juristische Prüfung läuft“ aus; eure Nennung auf der Startseite („juristische Plausibilisierung durch Cattwyk Rechtsanwaltsgesellschaft“) bleibt in der Zwischenstufe, wenn euch das recht ist – auch das steht als Frage im Paket.

Ich weiß, dass das ein Brocken ist. Deshalb die Struktur mit Sammelfreigabe und Prioritäten: Wenn ihr nur die Prioritätenliste und Teil B.1 lest, haben wir schon das Wichtigste. Alles Weitere besprechen wir in der Session.

Vielen Dank – ich freue mich, dass es jetzt losgeht.

Herzliche Grüße
Malte

Jan Malte Andresen
packaging journal · ella Verlag und Medien GmbH

Anhänge:
– Cattwyk_Pruefpaket_PPWR-Radar_2026-10-30.pdf (und .docx zum Ausfüllen)
– Beilage_Delta-Recherchen_2026-10-30.pdf
– KH-01-26-088-EN-N_PPWR-and-small-businesses.pdf
