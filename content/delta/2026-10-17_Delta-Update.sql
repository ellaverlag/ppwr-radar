-- PPWR Radar – Delta-Update Rechtsstand 17.07.2026 -> 17.10.2026
-- Referenzfassung. Am 17.10.2026 in Einzelschritten über die Supabase-MCP-Schnittstelle eingespielt;
-- die Ergänzungstexte an bestehenden Datensätzen wurden dabei auf Kurzverweise ("vgl. Praxisfrage …")
-- verkürzt, weil längere UPDATE-Statements vom Tool abgewiesen wurden. Maßgeblich ist der Stand in der Datenbank.
-- Alle neuen Datensätze: review_status = entwurf, ausspielen = false, Flag "(neu 10/2026)".
-- Quellenhierarchie: PPWR/VerpackDG rechtsverbindlich; Kommissions-FAQ/Leitfaden = unverbindliche Auslegung;
-- ZSVR/UBA = Behördeninformation, keine Rechtsnorm; Gerichte = Entscheidung im Einzelfall.

begin;

with basis as (select coalesce(max(nr),0) as n from auslegungen),
neu(code, kurztitel, kategorie, verbindlichkeit, flag, bezug_nr, quellen, frage, antwort) as (values

('A30','Versandetikett auf dem Karton: Werden wir dadurch zum Erzeuger?','rollen_epr','unverbindliche_auslegung',
 '(neu 10/2026) Divergenz Kommission (FAQ 2. Ed. Kap. II FAQ 6/7: Versandaufkleber ist kein Branding) vs. ZSVR-Themenseite Versandhandel (Zusammenfügen zur Versandverpackung macht zum Erzeuger; Etikett nicht eigens behandelt). Schriftliche ZSVR-Stellungnahme zum Etikett bis 17.10.2026 nicht auffindbar. Cattwyk-Einordnung, welche Lesart ausgespielt wird.',
 array[8,7], array['Art. 3 Abs. 1 Nr. 13 PPWR (VO (EU) 2025/40)','Art. 21 PPWR','Kommissions-FAQ zur PPWR, 2. Edition (03.08.2026), Kap. II FAQ 5–7 (unverbindliche Auslegung der EU-Kommission)','ZSVR: „Versand- und Onlinehandel: Was ändert sich durch die PPWR?“ (verpackungsregister.org, Behördeninformation, keine Rechtsnorm)'],
 'Wir sind Onlinehändler und kleben auf fertig gekaufte Versandkartons nur unser Versandetikett. Im Sommer hieß es, damit würden wir zum Erzeuger. Stimmt das?',
 'Einordnung: Die Frage ist derzeit zwischen EU-Kommission und ZSVR unterschiedlich beantwortet. Die Kommission stellt in der 2. Edition ihrer FAQ (Kap. II FAQ 6/7) klar, dass ein Aufkleber zu Versandzwecken kein „Branding“ ist und den Versender daher nicht zum Erzeuger im Sinne des Art. 3 Abs. 1 Nr. 13 PPWR macht; ein handelsüblicher Karton ist mit seiner Herstellung fertig (FAQ 5). Die ZSVR behandelt das Etikett auf ihrer Themenseite nicht gesondert, sieht aber denjenigen als Erzeuger, der Materialien erst zur vollständigen Versandverpackung zusammenfügt, und bei Hinzufügen zu einer fertigen Verpackung eine Erzeugereigenschaft nach Art. 21 PPWR nur, wenn die Recyclingfähigkeit beeinflusst werden kann. Folge: Nach der Kommissionslesart entsteht durch das reine Etikett keine Erzeugerrolle und damit keine Pflicht zur Konformitätsbewertung, technischen Dokumentation und Konformitätserklärung für den Karton; diese bleiben beim Kartonhersteller. Herstellerpflichten nach VerpackDG (Registrierung, Systembeteiligung) sind davon unabhängig und treffen den Versender ohnehin, weil Versandverpackungen systembeteiligungspflichtig sind. Quellen: Art. 3 Abs. 1 Nr. 13, Art. 21 PPWR; Kommissions-FAQ 2. Ed. Kap. II FAQ 5–7 (unverbindlich); ZSVR-Themenseite Versandhandel (Behördeninformation). Grenze: Beide Dokumente sind keine Rechtsnormen. Eine schriftliche ZSVR-Stellungnahme zum Versandetikett liegt nach unserem Stand nicht vor. Wer auf Nummer sicher gehen will, lässt sich vom Kartonlieferanten die Angaben nach Art. 16 PPWR geben und dokumentiert, dass der Karton unverändert verwendet wird.'),

('A31','Flach gelieferter Karton, Klebeband, Füllmaterial: Wer ist Erzeuger der Versandverpackung?','rollen_epr','unverbindliche_auslegung',
 '(neu 10/2026) Kommissions-FAQ 2. Ed. Kap. II FAQ 5 („mehrere Hersteller je Sendung“) gegen ZSVR-Fälle B.2/B.3 (Zusammenfügen beim Händler). Abgleich mit Regel B1 und A5 der Rollen-Engine; B1-Flag ggf. auflösbar.',
 array[8], array['Art. 3 Abs. 1 Nr. 13 und Nr. 15 lit. a PPWR (VO (EU) 2025/40)','Art. 21 PPWR','Kommissions-FAQ zur PPWR, 2. Edition (03.08.2026), Kap. II FAQ 4 und 5 (unverbindliche Auslegung der EU-Kommission)','ZSVR: „Versand- und Onlinehandel“, Fälle B.2 und B.3 (verpackungsregister.org, Behördeninformation)'],
 'Wir kaufen Faltkartons flach ein, falten sie, kleben sie mit unserem Klebeband zu und füllen mit Luftpolsterfolie. Sind wir Erzeuger dieser Versandverpackung?',
 'Einordnung: Die Kommission betrachtet jedes Verpackungselement einzeln: Erzeuger einer Transportverpackung ist, wer die leere Verpackung in ihre endgültige Form bringt. Ein Faltkarton ist nach der Kommissions-FAQ bereits mit seiner Herstellung fertig, auch wenn er flach geliefert wird; Klebeband, Folie und Palette haben jeweils ihren eigenen Erzeuger, eine Sendung kann daher mehrere Erzeuger haben (FAQ 2. Ed. Kap. II FAQ 5). Die ZSVR sieht es enger: Wer Materialien zur vollständigen Versandverpackung zusammenfügt, ist nach ihrer Themenseite Erzeuger (Fall B.2); wer einer fertigen Verpackung Klebeband oder Füllmaterial hinzufügt, nur dann, wenn dies die Recyclingfähigkeit beeinflussen kann (Fall B.3, Art. 21 PPWR). Folge: Nach der Kommissionslesart bleiben Konformitätsbewertung und Konformitätserklärung beim jeweiligen Materialhersteller; Sie benötigen von jedem Lieferanten die Angaben nach Art. 16 PPWR. Nach der ZSVR-Lesart treffen Sie als Erzeuger der zusammengefügten Versandverpackung die Pflichten der Art. 15, 38 und 39 PPWR. Herstellerpflichten nach VerpackDG treffen Sie in beiden Lesarten. Quellen: Art. 3 Abs. 1 Nr. 13, Nr. 15 lit. a, Art. 21 PPWR; Kommissions-FAQ 2. Ed. Kap. II FAQ 4/5 (unverbindlich); ZSVR-Themenseite Versandhandel (Behördeninformation). Grenze: Solange die Divergenz nicht aufgelöst ist, empfiehlt sich die Dokumentation beider Wege: Lieferantenangaben nach Art. 16 einholen und zugleich festhalten, welche Elemente Sie selbst zusammenfügen.'),

('A32','Handels-Eigenmarke mit genanntem Abfüller: Wer ist Erzeuger?','rollen_epr','unverbindliche_auslegung',
 '(neu 10/2026) Ergänzt A03/A20 um Kommissions-FAQ 2. Ed. Kap. II FAQ 6/7 und ZSVR-Meldung vom 12.08.2026. ZSVR-Lesart („Handelsunternehmen in der Regel auch Erzeuger“) gegen Einzelfallvorbehalt der Kommission bei Lizenzmodellen abgleichen.',
 array[8], array['Art. 3 Abs. 1 Nr. 13 lit. a und Nr. 15 lit. b PPWR (VO (EU) 2025/40)','Kommissions-FAQ zur PPWR, 2. Edition (03.08.2026), Kap. II FAQ 6 und 7 (unverbindliche Auslegung der EU-Kommission)','ZSVR-Meldung vom 12.08.2026: „Zweite Fassung der PPWR-FAQ: Klarstellung zur Erzeugereigenschaft bei Eigenmarken des Handels“ (Behördeninformation)'],
 'Auf unserer Handelsmarke steht zusätzlich „hergestellt für … von Molkerei XY“. Sind wir trotzdem Erzeuger der Verpackung?',
 'Einordnung: Erzeuger ist nach Art. 3 Abs. 1 Nr. 13 lit. a PPWR, wer eine Verpackung unter eigenem Namen oder eigener Marke in Verkehr bringt. Die Kommissions-FAQ (2. Ed. Kap. II FAQ 6) stellt klar, dass bei Verpackungen mit Marke derjenige Erzeuger ist, dessen Name oder Marke aufgebracht ist, sofern er die maßgebliche vertragliche Kontrolle über Gestaltung und Herstellung hat; ist zusätzlich ein Fremdname genannt, entscheidet der Vertrag (FAQ 7). Die ZSVR liest das so, dass bei Handels-Eigenmarken das Handelsunternehmen Hersteller nach VerpackDG und in der Regel auch Erzeuger ist, auch wenn der Abfüller mitgenannt wird. Folge: Als Markeninhaber mit Gestaltungsvorgaben tragen Sie die Erzeugerpflichten (Art. 15, 38, 39 PPWR) und die Herstellerpflichten nach VerpackDG. Der Abfüller bleibt Lieferant nach Art. 16 PPWR und muss Ihnen die Konformitätsangaben liefern. Quellen: Art. 3 Abs. 1 Nr. 13 lit. a, Nr. 15 lit. b PPWR; Kommissions-FAQ 2. Ed. Kap. II FAQ 6/7 (unverbindlich); ZSVR-Meldung 12.08.2026 (Behördeninformation). Grenze: Bei echten Lizenzmodellen, in denen der Markeninhaber keinen Einfluss auf Gestaltung und Herstellung hat, verlangt die Kommission eine Einzelfallprüfung des Vertrags; hier ist eine Einordnung durch eine spezialisierte Kanzlei sinnvoll.'),

('A33','Maßgefertigte neutrale Transportverpackung: Erzeuger ist der Auftraggeber?','rollen_epr','unverbindliche_auslegung',
 '(neu 10/2026) Kommissions-FAQ 2. Ed. Kap. X FAQ 14. Prüfen gegen Regel A4 (physische Herstellung) – FAQ ordnet bei kundenspezifischer Spezifikation dem Auftraggeber zu.',
 array[8,40], array['Art. 3 Abs. 1 Nr. 13 PPWR (VO (EU) 2025/40)','Art. 16 Abs. 1 PPWR','Kommissions-FAQ zur PPWR, 2. Edition (03.08.2026), Kap. X FAQ 14 (unverbindliche Auslegung der EU-Kommission)'],
 'Wir lassen uns unbedruckte Transportkartons nach unseren Maßen und Spezifikationen fertigen. Ist der Kartonagenhersteller oder sind wir der Erzeuger?',
 'Einordnung: Bei kundenspezifisch gefertigter, unbedruckter Transportverpackung ordnet die Kommission die Erzeugerrolle dem Auftraggeber zu, der die Spezifikation festlegt (FAQ 2. Ed. Kap. X FAQ 14). Der fertigende Betrieb ist in diesem Fall Lieferant nach Art. 3 Abs. 1 Nr. 16 PPWR. Folge: Sie tragen als Erzeuger die Pflichten aus Art. 15 PPWR (Konformitätsbewertung nach Art. 38, technische Dokumentation nach Anhang VII, Konformitätserklärung nach Art. 39). Der Lieferant muss Ihnen nach Art. 16 Abs. 1 PPWR alle Informationen und Unterlagen liefern, die Sie für den Konformitätsnachweis brauchen; vereinbaren Sie das ausdrücklich im Liefervertrag. Quellen: Art. 3 Abs. 1 Nr. 13 und 16, Art. 15, 16 PPWR; Kommissions-FAQ 2. Ed. Kap. X FAQ 14 (unverbindlich). Grenze: Kauft derselbe Betrieb Standardkartons aus dem Katalog, bleibt der Kartonagenhersteller Erzeuger (vgl. A31).'),

('A34','Konzerninterne Verbringung: Inverkehrbringen oder nicht?','rollen_epr','unverbindliche_auslegung',
 '(neu 10/2026) Kommissions-FAQ 2. Ed. Kap. II FAQ 13. Verhältnis zur Definition Art. 3 Abs. 1 Nr. 10/11 und zu Datensatz #10 prüfen.',
 array[8,10], array['Art. 3 Abs. 1 Nr. 10 und 11 PPWR (VO (EU) 2025/40)','Kommissions-FAQ zur PPWR, 2. Edition (03.08.2026), Kap. II FAQ 13 (unverbindliche Auslegung der EU-Kommission)'],
 'Wir verpacken Teile in unserem Werk in Polen und schicken sie an unser eigenes Werk in Deutschland. Bringen wir diese Verpackung in Verkehr?',
 'Einordnung: Inverkehrbringen setzt eine erstmalige Bereitstellung auf dem Unionsmarkt voraus, also eine Abgabe im Rahmen einer Geschäftstätigkeit an einen anderen (Art. 3 Abs. 1 Nr. 10 und 11 PPWR). Die Kommission stellt klar, dass die Verbringung eigener Verpackungen innerhalb desselben Rechtsträgers ohne Handelsgeschäft kein Inverkehrbringen ist (FAQ 2. Ed. Kap. II FAQ 13). Folge: Für reine Werksverkehre innerhalb einer juristischen Person entstehen keine Erzeugerpflichten nach Art. 15 PPWR. Sobald die Verpackung einen anderen Rechtsträger erreicht, auch eine Konzernschwester, liegt eine Bereitstellung vor. Quellen: Art. 3 Abs. 1 Nr. 10 und 11 PPWR; Kommissions-FAQ 2. Ed. Kap. II FAQ 13 (unverbindlich). Grenze: Die Herstellerpflichten nach VerpackDG (Registrierung, Systembeteiligung) knüpfen an die erstmalige Bereitstellung im Bundesgebiet an; ob und ab wann diese im Konzern vorliegt, hängt von der konkreten Gesellschaftsstruktur ab (vgl. A21).'),

('A35','Bevollmächtigter nach Art. 45 Abs. 3: Gilt die Pflicht noch, oder wird sie ausgesetzt?','rollen_epr','rechtsverbindlich',
 '(neu 10/2026) Rechtslage unverändert, aber politisches Watch-Item: Omnibus VIII COM(2025) 982 (EP-Plenum 20.10.2026), Bundesregierung 08.09.2026, Kommissions-Appell „abstain from sanctioning“. Nach dem 20.10.2026 aktualisieren.',
 array[9], array['Art. 45 Abs. 3 PPWR (VO (EU) 2025/40)','§ 5 Abs. 2 VerpackDG (BGBl. 2026 I Nr. 207)','Kommissionsvorschlag COM(2025) 982 (Verfahren 2025/0395(COD)); ENVI-Bericht A10-0266/2026 vom 09.10.2026 (Gesetzgebungsverfahren, nicht erlassen)','DG ENV: „Extended producer responsibility for packaging: small businesses“ (environment.ec.europa.eu, politische Aussage, unverbindlich)','BMUKN-Meldung vom 08.09.2026: „Kritik an der EU-Verpackungsverordnung (PPWR): Bundesregierung setzt sich für Entlastungen ein“ (politische Position)'],
 'Es heißt, die Pflicht zum Bevollmächtigten für ausländische Online-Händler werde wieder gekippt. Müssen wir jetzt überhaupt noch einen benennen?',
 'Einordnung: Ja. Art. 45 Abs. 3 PPWR gilt seit dem 12.08.2026 unverändert, in Deutschland umgesetzt durch § 5 Abs. 2 VerpackDG (vgl. A26). Richtig ist, dass eine Änderung diskutiert wird: Die Kommission hat mit COM(2025) 982 vorgeschlagen, die Pflicht für Kleinst- und Kleinunternehmen mit EU-Sitz bis zum 01.01.2035 auszusetzen; der Umweltausschuss des Parlaments hat am 05.10.2026 zugestimmt, die Plenarabstimmung ist für den 20.10.2026 angesetzt, der Rat hat seine Verhandlungen im Juni 2026 eingestellt. Die Bundesregierung fordert zusätzlich, Händler unter 10 Tonnen Verpackung pro Jahr auszunehmen und die Registrierungspflicht im Zielland bis Mitte 2028 auszusetzen. Die Kommission hat die Mitgliedstaaten gebeten, die Pflicht bis zur Entscheidung „konstruktiv und pragmatisch“ durchzusetzen und auf Sanktionen zu verzichten. Folge: Rechtlich besteht die Pflicht fort; die Benennung muss vor der ersten Bereitstellung erfolgen. Ein Verzicht im Vertrauen auf die Diskussion ist ein Risiko, das Sie bewusst eingehen würden. Quellen: Art. 45 Abs. 3 PPWR; § 5 Abs. 2 VerpackDG; COM(2025) 982 und A10-0266/2026 (Verfahren); DG-ENV-Seite und BMUKN-Meldung (politische Aussagen). Grenze: Ob, wann und für wen eine Aussetzung kommt, ist offen. Der PPWR Radar aktualisiert diesen Datensatz nach der Parlamentsabstimmung.'),

('B18','Vollständigkeitserklärung für 2026: Welche Regeln gelten für das Übergangsjahr?','rollen_epr','rechtsverbindlich',
 '(neu 10/2026) Grundlage ZSVR-Hinweise 2026 (PDF undatiert, verbreitet 13.08.2026); Normzitate § 68 Abs. 5 Satz 4, § 56 Abs. 4, § 68 Abs. 16 VerpackDG am Volltext prüfen. Ergänzt B05/B06.',
 array[33], array['§ 10 VerpackDG (BGBl. 2026 I Nr. 207)','§ 68 Abs. 5 VerpackDG','§ 56 Abs. 4 Satz 3 und 4 VerpackDG','§ 68 Abs. 16 VerpackDG','ZSVR: „Aktuelle Hinweise zur Prüfung der Vollständigkeitserklärung 2026 und Schulungspflicht VE-Prüfung 2026“ (verpackungsregister.org, Behördeninformation, keine Rechtsnorm)'],
 'Unser Wirtschaftsprüfer fragt, ob wir für 2026 zwei Vollständigkeitserklärungen brauchen, eine nach altem und eine nach neuem Recht. Wie läuft das?',
 'Einordnung: Für das Bezugsjahr 2026 ist nach den Hinweisen der ZSVR nur eine Vollständigkeitserklärung je Hersteller zu hinterlegen, und zwar nach § 10 VerpackDG (§ 68 Abs. 5 VerpackDG). Die Prüfleitlinien vom 19.11.2024 gelten für das gesamte Jahr 2026 fort, ab dem 12.08.2026 sinngemäß. Für Mengen bis zum 11.08.2026 richten sich Herstellereigenschaft und Verpackungsarten nach dem VerpackG und dem alten Katalog, ab dem 12.08.2026 nach PPWR, VerpackDG und dem neuen Katalog; bestandskräftige Einordnungsentscheidungen bleiben wirksam (§ 68 Abs. 15 VerpackDG). Folge: Eine Erklärung, aber zwei Bewertungsmaßstäbe innerhalb des Jahres; Ihr Prüfer muss die Mengen entsprechend trennen. Neu ist außerdem die Schulungspflicht für registrierte Prüfer: Bestandsprüfer müssen den Nachweis bis zum 31.12.2027 erbringen, sonst wird die Registrierung ab dem 01.01.2028 aufgehoben (§ 56 Abs. 4, § 68 Abs. 16 VerpackDG). Quellen: §§ 10, 56 Abs. 4, 68 Abs. 5, 15 und 16 VerpackDG; ZSVR-Hinweise VE 2026 (Behördeninformation). Grenze: Neue Prüfleitlinien erscheinen erst für das Bezugsjahr 2027; die Schwellenwerte der VE-Pflicht (§ 10 Abs. 4) sind in B06 beschrieben.'),

('B19','Mindeststandard 2026 veröffentlicht: Was ändert sich für die Ökomodulation?','rollen_epr','rechtsverbindlich',
 '(neu 10/2026) Mindeststandard ist Verwaltungsvorschrift nach § 26 Abs. 3 VerpackDG; Verhältnis zu künftigen Verordnungen nach § 26a und zu den delegierten Rechtsakten nach Art. 6 Abs. 4 PPWR prüfen. Ergänzt B15/#35.',
 array[35,12], array['§ 26 Abs. 3 VerpackDG (BGBl. 2026 I Nr. 207)','§ 26a VerpackDG','Art. 6 Abs. 4 PPWR (VO (EU) 2025/40)','ZSVR/UBA: „Mindeststandard für die Bemessung der Recyclingfähigkeit systembeteiligungspflichtiger Verpackungen gemäß § 26 Abs. 3 VerpackDG“, Osnabrück 31.08.2026 (Verwaltungsvorschrift, Behördeninformation)'],
 'Die ZSVR hat einen neuen Mindeststandard veröffentlicht. Gilt der schon, und was heißt das für unsere Beteiligungsentgelte?',
 'Einordnung: ZSVR und Umweltbundesamt haben am 31.08.2026 den Mindeststandard 2026 nach § 26 Abs. 3 VerpackDG veröffentlicht. Er gilt für Verpackungen, die im Kalenderjahr nach der Veröffentlichung, also 2027, in Verkehr gebracht werden. Die Methodik bleibt unverändert; Gestaltungsparameter wurden ergänzt und zusammengefasst, recyclingunverträgliche Merkmale führen weiterhin zu einer Recyclingfähigkeit von null Prozent, pauschale Materialboni gibt es nicht. Folge: Die Systeme müssen ihre Beteiligungsentgelte nach § 26 VerpackDG an der Recyclingfähigkeit ausrichten; bis die delegierten Rechtsakte nach Art. 6 Abs. 4 PPWR (Leistungsklassen A bis C) gelten, bleiben Verordnungen zur Ökomodulierung nach § 26a VerpackDG an den Mindeststandard gebunden. Prüfen Sie Ihre Verpackungen für 2027 gegen den neuen Katalog der Gestaltungsparameter. Quellen: §§ 26, 26a VerpackDG; Art. 6 Abs. 4 PPWR; Mindeststandard 2026 (ZSVR/UBA, Verwaltungsvorschrift). Grenze: Der Mindeststandard ist kein Gesetz, sondern eine Verwaltungsvorschrift; eine Rechtsverordnung nach § 26a VerpackDG liegt noch nicht vor.'),

('B20','Permanenttragetaschen: Systembeteiligungspflichtig trotz Mehrfachnutzung?','rollen_epr','rechtsverbindlich',
 '(neu 10/2026) BVerwG-Urteil 23.07.2026 ergangen zu § 3 Abs. 8, § 7 VerpackG; Übertragung auf § 3 Abs. 6, § 7 Abs. 1 VerpackDG ist unsere Zuordnung, nicht die des Gerichts. Rückwirkende Beteiligungspflichten laut ZSVR möglich.',
 array[32], array['§ 3 Abs. 6 und § 7 Abs. 1 VerpackDG (BGBl. 2026 I Nr. 207)','BVerwG, Urteil vom 23.07.2026 – 10 C 6.25 (Pressemitteilung Nr. 57/2026; ergangen zu § 3 Abs. 8, § 7 VerpackG)','ZSVR-Pressemitteilung vom 23.07.2026 (Behördeninformation)'],
 'Wir geben an der Kasse stabile Mehrfach-Tragetaschen aus recyceltem PET ab. Sind das Produkte oder lizenzpflichtige Verpackungen?',
 'Einordnung: Das Bundesverwaltungsgericht hat am 23.07.2026 entschieden, dass eine Permanenttragetasche, die am Verkaufsort zum Transport der gekauften Waren abgegeben wird, systembeteiligungspflichtige Verpackung ist, unabhängig von Material, Haltbarkeit, Zweitnutzung und davon, ob sie entgeltlich oder unentgeltlich abgegeben wird (10 C 6.25, zu § 3 Abs. 8, § 7 VerpackG). Maßgeblich ist die Zweckbestimmung zum Transport am Verkaufsort. Die Definitionen des VerpackDG (§ 3 Abs. 6, § 7 Abs. 1) sind insoweit inhaltsgleich. Folge: Wer solche Taschen als Letztvertreiber oder Hersteller erstmals in Verkehr bringt, muss sie registrieren und an einem System beteiligen. Die ZSVR weist darauf hin, dass sich daraus auch rückwirkende Beteiligungspflichten ergeben können und Prüfer der Vollständigkeitserklärung dies künftig kontrollieren. Quellen: § 3 Abs. 6, § 7 Abs. 1 VerpackDG; BVerwG 10 C 6.25; ZSVR-PM 23.07.2026. Grenze: Das Urteil ist zum alten Recht ergangen; die Übertragung auf das VerpackDG ist naheliegend, aber noch nicht gerichtlich bestätigt.'),

('B21','Neuer Katalog 2026: E-Commerce-Verpackungen immer systembeteiligungspflichtig?','rollen_epr','rechtsverbindlich',
 '(neu 10/2026) Katalog Allgemeiner Teil Stand 08/2026 ist norminterpretierende Verwaltungsvorschrift (§ 54 Abs. 1 Satz 2 Nr. 33 VerpackDG); VG Osnabrück 30.09.2026 nicht rechtskräftig. Verhältnis zu B12 prüfen.',
 array[32], array['§ 3 Abs. 6 und 7 VerpackDG (BGBl. 2026 I Nr. 207)','§ 7 Abs. 1 Satz 1, § 8, § 54 Abs. 1 Satz 2 Nr. 33 VerpackDG','ZSVR: Katalog systembeteiligungspflichtiger Verpackungen, Allgemeiner Teil, Stand 08/2026, gültig ab 12.08.2026 (Verwaltungsvorschrift, Behördeninformation)','VG Osnabrück, Urteil vom 30.09.2026 – 7 A 112/24 (nicht rechtskräftig)'],
 'Wir versenden ausschließlich an Gewerbekunden. Trotzdem sagt die ZSVR, unsere Versandkartons seien systembeteiligungspflichtig. Wie passt das?',
 'Einordnung: Der zum 12.08.2026 neu gefasste Allgemeine Teil des Katalogs stellt auf eine Gesamtmarktbetrachtung ab: Entscheidend ist, wo Verpackungen einer Art typischerweise als Abfall anfallen, nicht die individuelle Vertriebsstruktur eines Unternehmens. Transportverpackungen für den Versand an Endkunden gelten danach als systembeteiligungspflichtig, Transportverpackungen für die Speditionslogistik in der Regel nicht; Serviceverpackungen sind stets pflichtig. Das VG Osnabrück hat diese typisierende Betrachtung am 30.09.2026 bestätigt und den Katalog als norminterpretierende Verwaltungsvorschrift eingeordnet (7 A 112/24, nicht rechtskräftig). Folge: Versandkartons an gewerbliche Kunden sind systembeteiligungspflichtig, wenn sie einer Katalogposition entsprechen, die typischerweise beim privaten Endverbraucher oder vergleichbaren Anfallstellen (§ 3 Abs. 7 VerpackDG) anfällt. Eine Befreiung über den Nachweis eigener B2B-Kunden ist nicht vorgesehen; eine herstellereigene Rücknahme ist keine Branchenlösung nach § 8 VerpackDG. Quellen: § 3 Abs. 6 und 7, § 7 Abs. 1, § 8 VerpackDG; Katalog Allgemeiner Teil 08/2026; VG Osnabrück 7 A 112/24. Grenze: Der Katalog regelt nicht, wer verpflichtet ist, sondern nur, welche Verpackungen pflichtig sind; die Herstellerfrage richtet sich nach Art. 3 Abs. 1 Nr. 15 PPWR (vgl. B10, B12).'),

('C13','Berichtigung der deutschen Fassung: Art. 29 Abs. 4 lit. b PPWR sagt jetzt „Waren“','mehrweg','rechtsverbindlich',
 '(neu 10/2026) Berichtigung ABl. L 2026/90654 vom 04.08.2026 betrifft nur die deutsche Sprachfassung. Datensatz #27 und Glossar-/Erklärtexte, die „Rohstoffe“ zitieren, anpassen.',
 array[27], array['Art. 29 Abs. 4 lit. b PPWR (VO (EU) 2025/40)','Berichtigung der Verordnung (EU) 2025/40, ABl. L 2026/90654 vom 04.08.2026 (deutsche Sprachfassung, rechtsverbindlich)'],
 'In unserem Ausdruck der PPWR steht bei den Mehrweg-Ausnahmen für Transportverpackungen „Rohstoffe“. Gilt die Ausnahme nur für Rohstofftransporte?',
 'Einordnung: Nein. Die deutsche Sprachfassung des Art. 29 Abs. 4 lit. b PPWR enthielt einen Übersetzungsfehler, der mit Berichtigung vom 04.08.2026 (ABl. L 2026/90654) korrigiert wurde: Die Ausnahme von den Mehrwegquoten gilt für Transportverpackungen, die für den Transport großer Maschinen, Ausrüstungen und „Waren“ verwendet werden, für die die Verpackung nach den individuellen Anforderungen des beauftragenden Wirtschaftsakteurs konzipiert ist; bisher stand dort „Rohstoffe“. Die anderen Sprachfassungen waren bereits korrekt. Folge: Maßgefertigte Transportverpackungen für individuelle Güter aller Art fallen unter die Ausnahme, nicht nur Rohstofftransporte. Prüfen Sie, ob Ihre Transportverpackungen kundenspezifisch konzipiert sind; dann greift Art. 29 Abs. 4 lit. b. Quellen: Art. 29 Abs. 4 lit. b PPWR in der berichtigten Fassung; ABl. L 2026/90654. Grenze: Die Berichtigung ändert nichts an den übrigen Voraussetzungen der Mehrwegquoten ab 2030 (vgl. #27) und an der Ausnahme für Palettenwicklungen und Umreifungsbänder (vgl. C11).'),

('C14','Kennzeichnungspflichten: Verschieben sich die Termine 2028/2029?','kennzeichnung','rechtsverbindlich',
 '(neu 10/2026) Durchführungsakt nach Art. 12 Abs. 6 / Art. 13 Abs. 2 verfehlt die Frist 12.08.2026 (Have-your-say-Initiative 19243, Annahme geplant Q4 2026). Folgetermine über „je nachdem, welcher Zeitpunkt der spätere ist“ errechnen; exakte Wortlaute Art. 12 Abs. 1, 2, 4 und Art. 13 Abs. 1 am Volltext pinnen. Datensätze #19–#21 angepasst.',
 array[19,20,21], array['Art. 12 Abs. 1, 2, 4, 6 und 7 PPWR (VO (EU) 2025/40)','Art. 13 Abs. 1 und 2 PPWR','Europäische Kommission, Have your say, Initiative 19243 „Packaging and packaging waste – new Commission implementing rules on harmonised labels“ (Entwurf angekündigt, Annahme geplant Q4 2026)','Kommissions-FAQ zur PPWR, 2. Edition (03.08.2026), Kap. VIII FAQ 1–4 (unverbindliche Auslegung der EU-Kommission)'],
 'Wir planen unsere Verpackungsdrucke für 2028. Steht das harmonisierte Sortierlabel wirklich zum 12.08.2028 fest?',
 'Einordnung: Die Kommission hätte die Durchführungsrechtsakte zu den harmonisierten Kennzeichnungen (Art. 12 Abs. 6, Art. 13 Abs. 2 PPWR) bis zum 12.08.2026 erlassen müssen. Das ist nicht geschehen; der Entwurf ist als Initiative 19243 angekündigt, die Annahme für das vierte Quartal 2026 geplant. Die Kennzeichnungspflichten gelten nach der Verordnung ab dem 12.08.2028 (Materialkennzeichnung, freiwillige Rezyklat- und Bio-Labels) bzw. 12.02.2029 (Mehrweg-Kennzeichnung) oder 24 bzw. 30 Monate nach Geltungsbeginn des Durchführungsakts, je nachdem, welcher Zeitpunkt der spätere ist. Folge: Wird der Durchführungsakt erst Ende 2026 oder 2027 wirksam, verschieben sich die Pflichten rechnerisch in das Jahr 2029. Die Termine 2028 sind damit Mindestdaten, keine festen Stichtage. Planen Sie Druckvorlagen so, dass das Label nach Veröffentlichung der Spezifikationen nachgezogen werden kann. Unverändert gilt bereits seit dem 12.08.2026 das Irreführungsverbot des Art. 12 Abs. 8. Quellen: Art. 12 Abs. 1, 2, 4, 6, 8, Art. 13 PPWR; Initiative 19243; Kommissions-FAQ 2. Ed. Kap. VIII (unverbindlich). Grenze: Die exakten Folgetermine ergeben sich erst aus dem Datum des Durchführungsakts; der PPWR Radar aktualisiert #19 bis #21, sobald er veröffentlicht ist.'),

('C15','Lagerware von vor dem 12.08.2026: Umetikettieren oder Begleitdokument?','konformitaet','unverbindliche_auslegung',
 '(neu 10/2026) Kommissions-FAQ 2. Ed. Kap. X FAQ 5 ist pragmatischer als unsere Lesart in #10 und C01 (kein Abverkaufsprivileg): keine Vernichtung/Umetikettierung, Art. 15 Abs. 5/6 per Begleitdokument. Spannung zu #10 für Cattwyk aufbereiten.',
 array[10,7], array['Art. 3 Abs. 1 Nr. 10 und 11 PPWR (VO (EU) 2025/40)','Art. 15 Abs. 5 und 6 PPWR','Kommissions-FAQ zur PPWR, 2. Edition (03.08.2026), Kap. X FAQ 5 (unverbindliche Auslegung der EU-Kommission)'],
 'Wir haben Verpackungen im Lager, die vor dem 12. August produziert wurden, aber noch nicht verkauft sind. Müssen wir die jetzt alle mit Erzeugerangaben nachkennzeichnen?',
 'Einordnung: Vor dem 12.08.2026 produzierte, aber noch nicht in Verkehr gebrachte Verpackungen unterliegen beim Inverkehrbringen den Anforderungen der PPWR (Art. 3 Abs. 1 Nr. 10 und 11; vgl. C01). Die Kommission hat in der 2. Edition ihrer FAQ (Kap. X FAQ 5) aber klargestellt, dass sie keine Vernichtung, Umarbeitung oder Umetikettierung solcher Bestände erwartet: Die Angaben zur Erzeugeridentifikation nach Art. 15 Abs. 5 und 6 dürfen für diese Ware über Begleitdokumente erfolgen; eine Einzelstückkennzeichnung verlangt Art. 15 Abs. 5 ohnehin nicht, eine Chargennummer genügt. Ist der Lieferant nicht mehr erreichbar, erwartet die Kommission „best efforts“. Bereits in Verkehr gebrachte Ware darf ohnehin am Markt bleiben. Folge: Dokumentieren Sie je Charge Erzeugername, Marke, Anschrift und Kontaktweg in den Lieferpapieren und halten Sie die Konformitätsangaben nach Art. 5 bereit; eine physische Nachkennzeichnung des Lagerbestands ist nach Kommissionslesart nicht erforderlich. Quellen: Art. 3 Abs. 1 Nr. 10 und 11, Art. 15 Abs. 5 und 6 PPWR; Kommissions-FAQ 2. Ed. Kap. X FAQ 5 (unverbindlich). Grenze: Die FAQ ist keine Rechtsnorm. Für die stofflichen Anforderungen (PFAS, Schwermetalle) bleibt es dabei, dass nicht konforme Lagerware nicht mehr in Verkehr gebracht werden darf (vgl. C01).'),

('C16','Konformitätserklärung: Eine je Verpackungseinheit, und darf sie der Bevollmächtigte ausstellen?','konformitaet','unverbindliche_auslegung',
 '(neu 10/2026) Kommissions-FAQ 2. Ed. Kap. XV FAQ 5/8/14 und Kap. X FAQ 9. Ergänzt C03/C04; Aussage „TD-Erstellung nicht delegierbar“ gegen Art. 17 Abs. 2 PPWR pinnen. Relevanz für Dokumenten-Generator (Ebene Verpackungseinheit).',
 array[6,5,37], array['Art. 15 Abs. 3 PPWR (VO (EU) 2025/40)','Art. 17 PPWR','Art. 18 PPWR','Art. 38 und 39 i. V. m. Anhang VII und VIII PPWR','§ 62 VerpackDG (BGBl. 2026 I Nr. 207)','Kommissions-FAQ zur PPWR, 2. Edition (03.08.2026), Kap. XV FAQ 5, 8 und 14 sowie Kap. X FAQ 9 (unverbindliche Auslegung der EU-Kommission)'],
 'Brauchen wir für jeden Karton, jede Folie und jedes Etikett eine eigene Konformitätserklärung? Und darf unser Bevollmächtigter die unterschreiben?',
 'Einordnung: Nach der Kommissions-FAQ kann eine Konformitätsbewertung und eine Konformitätserklärung die gesamte Verpackungseinheit abdecken, also alle Bestandteile, die zusammen in Verkehr gebracht werden (2. Ed. Kap. XV FAQ 5). Die Erklärung ist in der Sprache des Mitgliedstaats abzufassen, in dem die Verpackung bereitgestellt wird; in Deutschland genügt Deutsch oder Englisch (§ 62 VerpackDG). Prüfungen und Zertifizierungen dürfen an Labore delegiert werden, die Erstellung der technischen Dokumentation nach Anhang VII bleibt Sache des Erzeugers (Kap. XV FAQ 8). Ein Bevollmächtigter nach Art. 17 PPWR darf die Konformitätserklärung mit schriftlichem Mandat ausstellen (Kap. XV FAQ 14). Importeure müssen sicherstellen, dass der Drittlandserzeuger Konformitätsbewertung und Erklärung vorgenommen hat (Kap. X FAQ 9, Art. 18 PPWR). Folge: Eine Erklärung je Verpackungseinheit statt je Bestandteil ist zulässig; die Aufbewahrungsfrist beträgt fünf Jahre bei Einweg- und zehn Jahre bei Mehrwegverpackungen (Art. 15 Abs. 3). Quellen: Art. 15 Abs. 3, 17, 18, 38, 39, Anhang VII und VIII PPWR; § 62 VerpackDG; Kommissions-FAQ 2. Ed. (unverbindlich). Grenze: Was eine „Verpackungseinheit“ im Einzelfall umfasst, ist nicht normiert; bei wechselnden Bestandteilen ist eine Erklärung je Variante der sichere Weg.'),

('C17','Marktüberwachung ab Tag eins: Droht sofort ein Vertriebsverbot?','konformitaet','unverbindliche_auslegung',
 '(neu 10/2026) Kommissions-FAQ 2. Ed. Kap. XVI FAQ 1 (Art. 62, „supportive approach“) plus Instagram-Äußerung der Kommission vom 12.08.2026 (keine förmliche Mitteilung gefunden). Nationale Ebene: § 68 Abs. 17 VerpackDG unverändert. Ergänzt B04.',
 array[4,6], array['Art. 62 PPWR (VO (EU) 2025/40)','§ 66 Abs. 2 und § 68 Abs. 17 VerpackDG (BGBl. 2026 I Nr. 207)','Kommissions-FAQ zur PPWR, 2. Edition (03.08.2026), Kap. XVI FAQ 1 (unverbindliche Auslegung der EU-Kommission)'],
 'Wenn unsere Konformitätserklärung noch nicht fertig ist, kann die Behörde unsere Verpackungen sofort vom Markt nehmen?',
 'Einordnung: Nach Art. 62 PPWR fordert die Marktüberwachungsbehörde bei formaler Nichtkonformität, etwa fehlender Konformitätserklärung oder technischer Dokumentation, den Wirtschaftsakteur zunächst auf, den Mangel zu beheben. Weitergehende Maßnahmen bis zur Rücknahme vom Markt folgen erst, wenn die Nichtkonformität fortbesteht. Die Kommission hat in ihrer FAQ (2. Ed. Kap. XVI FAQ 1) klargestellt, dass eine Nichtkonformität ab dem 12.08.2026 nicht automatisch zu einem Vertriebsverbot führt, und den Behörden einen unterstützenden Ansatz empfohlen. In Deutschland sind die Bußgeldtatbestände für Verstöße gegen die PPWR (§ 66 Abs. 2 VerpackDG) erst ab dem 12.02.2027 anwendbar (§ 68 Abs. 17). Folge: Sie haben eine Abhilfephase, aber keine Freistellung. Nutzen Sie die Zeit bis Februar 2027, um Dokumentation und Erklärung zu vervollständigen; die Pflicht selbst gilt seit dem 12.08.2026. Quellen: Art. 62 PPWR; § 66 Abs. 2, § 68 Abs. 17 VerpackDG; Kommissions-FAQ 2. Ed. Kap. XVI (unverbindlich). Grenze: Die Übergangsregel des § 68 Abs. 17 betrifft nur die Bußgeldtatbestände des Abs. 2; Verstöße gegen das VerpackDG selbst (§ 66 Abs. 1, etwa Registrierung) sind seit dem 12.08.2026 bußgeldbewehrt (vgl. B04).'),

('C18','Rezyklatanteil Kunststoff: Welche Rechtsakte fehlen noch, und wann kommen sie?','stoffrecht','rechtsverbindlich',
 '(neu 10/2026) Drei Kommissions-Initiativen (18753, 19033, 18752) im Call-for-Evidence-Stadium, Annahme geplant Q4 2026, gesetzliche Frist 31.12.2026. Ergänzt #14, C10, C12.',
 array[14], array['Art. 7 Abs. 1, 8, 9 und 10 PPWR (VO (EU) 2025/40)','Europäische Kommission, Have your say, Initiativen 18753 (Art. 7 Abs. 8, Berechnung und Verifizierung), 19033 (Art. 7 Abs. 9, Nachhaltigkeitskriterien Recyclingtechnologien) und 18752 (Art. 7 Abs. 10, Drittlandsrezyklat), Call for Evidence 14.08.–16.09.2026 (Vorstufe, nicht erlassen)'],
 'Ab 2030 müssen unsere Kunststoffverpackungen Rezyklat enthalten. Nach welcher Methode wird das berechnet, und ist das schon geregelt?',
 'Einordnung: Die Mindestrezyklatanteile des Art. 7 Abs. 1 PPWR gelten ab dem 01.01.2030 (vgl. #14). Die Berechnungs- und Nachweismethodik (Art. 7 Abs. 8), die Nachhaltigkeitskriterien für Recyclingtechnologien (Art. 7 Abs. 9) und die Bedingungen für die Anrechnung von Rezyklat aus Drittstaaten (Art. 7 Abs. 10) muss die Kommission bis zum 31.12.2026 festlegen. Dazu laufen seit August 2026 drei Verfahren; die Sondierung endete am 16.09.2026, Rechtsaktentwürfe liegen noch nicht vor, die Annahme ist für das vierte Quartal 2026 geplant. Folge: Für die Planung Ihrer Rezyklatbeschaffung stehen heute nur die Zielwerte fest, nicht die Methode. Ob chemisches Recycling angerechnet wird und unter welchen Bedingungen Importrezyklat zählt, entscheidet sich mit diesen Rechtsakten. Quellen: Art. 7 PPWR; Initiativen 18753, 19033, 18752 (Vorstufe). Grenze: Für PET-Einweggetränkeflaschen gelten bereits die nationale Quote des § 45 VerpackDG und die SUPD-Berechnungsmethode (vgl. C10, C12).'),

('C19','Herstellerregister: Kommt ein einheitliches EU-Meldeformat?','rollen_epr','rechtsverbindlich',
 '(neu 10/2026) Entwurf Durchführungsverordnung Art. 44 Abs. 14 (Initiative 15352, Feedback 06.08.–10.09.2026, 7.667 Rückmeldungen), Annahme überfällig; AT/CZ/EE fordern Zurückstellung (Sekundärquelle). Ergänzt #31.',
 array[31], array['Art. 44 Abs. 1 und 14 PPWR (VO (EU) 2025/40)','§ 6 VerpackDG (BGBl. 2026 I Nr. 207)','Europäische Kommission, Have your say, Initiative 15352 „Packaging and packaging waste – rules on national registers of producers“, Entwurf Ares(2026)7688068 (Durchführungsverordnung, nicht erlassen)'],
 'Wir sind in mehreren EU-Ländern registrierungspflichtig. Gibt es bald ein einheitliches Formular oder sogar ein zentrales Register?',
 'Einordnung: Art. 44 Abs. 14 PPWR ermächtigt die Kommission, das Format für Registrierung und Berichterstattung in den nationalen Herstellerregistern zu harmonisieren. Der Entwurf einer Durchführungsverordnung lag vom 06.08. bis 10.09.2026 zur Rückmeldung aus; er sieht einheitliche Registrierungs- und Meldeformate sowie ein vereinfachtes Format für Hersteller unter zehn Tonnen pro Jahr und Mitgliedstaat vor. Die ursprünglich für Anfang 2026 geplante Annahme ist überfällig. Ein zentrales EU-Register ist in der Verordnung nicht vorgesehen; die Bundesregierung und mehrere Mitgliedstaaten fordern ein EU-Registrierungsportal, bevor die Registrierungspflicht im Zielland durchgesetzt wird. Folge: Bis zur Annahme gelten die nationalen Formate weiter, in Deutschland die LUCID-Registrierung nach § 6 VerpackDG (vgl. #31, B01, B02). Quellen: Art. 44 PPWR; § 6 VerpackDG; Initiative 15352 (Entwurf). Grenze: Inhalt und Zeitpunkt der endgültigen Verordnung sind offen; der PPWR Radar meldet die Veröffentlichung.')
)
insert into auslegungen (nr, code, kurztitel, kategorie, verbindlichkeit, flag, bezug_nr, quellen, frage, antwort, review_status, rechtsstand, ausspielen)
select basis.n + row_number() over (), neu.code, neu.kurztitel, neu.kategorie::kategorie, neu.verbindlichkeit::verbindlichkeit, neu.flag, neu.bezug_nr, neu.quellen, neu.frage, neu.antwort, 'entwurf', date '2026-10-17', false
from neu, basis;

-- Ergänzungen an bestehenden Auslegungen (Rechtsstand 17.10.2026)
update auslegungen set
  antwort = antwort || E'\n\nAktualisierung 17.10.2026: Nach der Behördeninformation der ZSVR (Themenseite „Bevollmächtigung“, Stand August/September 2026) wird die Benennung erst mit Bestätigung des Bevollmächtigten in LUCID wirksam; der Bevollmächtigte kann die Bevollmächtigung einseitig beenden. Zur politischen Diskussion über eine Aussetzung der Pflicht siehe A35.',
  flag = coalesce(flag || ' | ', '') || '(!) Ergänzung 10/2026 aus ZSVR-Themenseite, Normzitat für Wirksamkeit mit LUCID-Bestätigung (§ 5 Abs. 4–6 VerpackDG?) pinnen',
  rechtsstand = date '2026-10-17'
where code = 'A28';

update auslegungen set
  antwort = antwort || E'\n\nAktualisierung 17.10.2026: Nach der Behördeninformation der ZSVR sollen die elektronischen Zulassungsverfahren im Sommer 2027 für Organisationen und im Herbst 2027 für Hersteller bereitstehen; Zulassungsgebühren, Antragsinhalte und Prüfschritte sind noch nicht veröffentlicht. Für sonstige Organisationen für Herstellerverantwortung gilt die Übergangsfrist bis zum 31.10.2027 (vgl. B17).',
  rechtsstand = date '2026-10-17'
where code = 'B16';

update auslegungen set
  antwort = antwort || E'\n\nAktualisierung 17.10.2026: Die Kommission hat in der 2. Edition ihrer FAQ (Kap. X FAQ 5) klargestellt, dass sie für Lagerware von vor dem 12.08.2026 keine Vernichtung oder Umetikettierung erwartet und die Erzeugerangaben nach Art. 15 Abs. 5 und 6 per Begleitdokument zulässt (Details C15). An der stofflichen Anforderung des Art. 5 Abs. 5 für neu in Verkehr gebrachte Ware ändert das nichts.',
  rechtsstand = date '2026-10-17'
where code = 'C01';

update auslegungen set
  antwort = antwort || E'\n\nAktualisierung 17.10.2026: Die Kommission empfiehlt in ihrer FAQ (2. Ed. Kap. XVI FAQ 1) den Behörden einen unterstützenden Ansatz nach Art. 62 PPWR, also zunächst Aufforderung zur Abhilfe (Details C17). § 68 Abs. 17 VerpackDG ist unverändert; behördliche Hinweise zur Anwendung liegen nicht vor.',
  rechtsstand = date '2026-10-17'
where code = 'B04';

update auslegungen set
  antwort = antwort || E'\n\nAktualisierung 17.10.2026: Die 2. Edition der Kommissions-FAQ (Kap. II FAQ 5) bestätigt, dass unbedruckte Stretchfolie auf der Rolle Verpackung ist und ihr physischer Hersteller Erzeuger ist, nicht der Anwender. Vgl. A31 zur Divergenz mit der ZSVR-Lesart.',
  rechtsstand = date '2026-10-17'
where code = 'A23';

update auslegungen set
  antwort = antwort || E'\n\nAktualisierung 17.10.2026: Die Kommission bestätigt in der 2. Edition ihrer FAQ (Kap. XV FAQ 5), dass eine Konformitätserklärung die gesamte Verpackungseinheit abdecken kann, und lässt die Ausstellung durch einen Bevollmächtigten nach Art. 17 mit schriftlichem Mandat zu (Details C16).',
  rechtsstand = date '2026-10-17'
where code in ('C03','C04');

-- Alle übrigen Auslegungen: Delta-Check gegen Rechtsstand 17.10.2026 ohne inhaltliche Änderung
update auslegungen set rechtsstand = date '2026-10-17' where rechtsstand < date '2026-10-17';

-- Anforderungen: Ergänzungen (Trigger versioniert automatisch)
update anforderungen set
  erklaerung_fachlich = coalesce(erklaerung_fachlich,'') || E'\n\nAktualisierung 17.10.2026: Die Durchführungsrechtsakte zu den harmonisierten Kennzeichnungen (Art. 12 Abs. 6, Art. 13 Abs. 2 PPWR) sind nicht fristgerecht zum 12.08.2026 erlassen worden; die Annahme ist für das vierte Quartal 2026 geplant (Kommissions-Initiative 19243). Der genannte Termin ist daher ein Mindestdatum: Die Pflicht gilt 24 bzw. 30 Monate nach Geltungsbeginn des Durchführungsakts, wenn dieser Zeitpunkt später liegt (vgl. Praxisfrage C14).',
  uebergangsregeln = coalesce(uebergangsregeln,'') || ' Terminverschiebung möglich, Durchführungsakt ausstehend (Stand 17.10.2026).',
  rechtsstand = date '2026-10-17'
where nr in (19,20,21);

update anforderungen set
  erklaerung_fachlich = coalesce(erklaerung_fachlich,'') || E'\n\nAktualisierung 17.10.2026: Die deutsche Sprachfassung des Art. 29 Abs. 4 lit. b PPWR wurde mit Berichtigung vom 04.08.2026 (ABl. L 2026/90654) korrigiert: Die Ausnahme gilt für Transportverpackungen für große Maschinen, Ausrüstungen und „Waren“ (nicht „Rohstoffe“), die nach individuellen Anforderungen des beauftragenden Wirtschaftsakteurs konzipiert sind (vgl. Praxisfrage C13).',
  rechtsstand = date '2026-10-17'
where nr = 27;

update anforderungen set
  erklaerung_fachlich = coalesce(erklaerung_fachlich,'') || E'\n\nAktualisierung 17.10.2026: Die Pflicht gilt unverändert. Politisch wird eine Aussetzung für Kleinst- und Kleinunternehmen diskutiert (Kommissionsvorschlag COM(2025) 982, EP-Plenum 20.10.2026; Bundesregierung fordert am 08.09.2026 Ausnahme unter 10 t/Jahr). Die Kommission bittet die Mitgliedstaaten, bis zur Entscheidung auf Sanktionen zu verzichten (vgl. Praxisfrage A35).',
  rechtsstand = date '2026-10-17'
where nr = 9;

update anforderungen set
  erklaerung_fachlich = coalesce(erklaerung_fachlich,'') || E'\n\nAktualisierung 17.10.2026: Delta-Check ohne Befund. Weder die 2. Edition der Kommissions-FAQ (Kap. VIII) noch ein Rechtsakt enthalten eine neue Aussage zu Art. 12 Abs. 9; der Geltungsbeginn bleibt offen (Flag V9).',
  rechtsstand = date '2026-10-17'
where nr = 22;

update anforderungen set
  erklaerung_fachlich = coalesce(erklaerung_fachlich,'') || E'\n\nAktualisierung 17.10.2026: ZSVR und UBA haben am 31.08.2026 den Mindeststandard 2026 nach § 26 Abs. 3 VerpackDG veröffentlicht; er gilt für Verpackungen, die 2027 in Verkehr gebracht werden (vgl. Praxisfrage B19).',
  rechtsstand = date '2026-10-17'
where nr = 35;

update anforderungen set
  erklaerung_fachlich = coalesce(erklaerung_fachlich,'') || E'\n\nAktualisierung 17.10.2026: Für das Bezugsjahr 2026 ist nach den ZSVR-Hinweisen nur eine Vollständigkeitserklärung nach § 10 VerpackDG zu hinterlegen; die Prüfleitlinien 2024 gelten fort, für registrierte Prüfer gilt eine Schulungspflicht (vgl. Praxisfrage B18).',
  rechtsstand = date '2026-10-17'
where nr = 33;

update anforderungen set
  erklaerung_fachlich = coalesce(erklaerung_fachlich,'') || E'\n\nAktualisierung 17.10.2026: Das BVerwG hat am 23.07.2026 (10 C 6.25) die Systembeteiligungspflicht für Permanenttragetaschen bestätigt; der neue Katalog Allgemeiner Teil (Stand 08/2026) stellt auf eine Gesamtmarktbetrachtung ab (vgl. Praxisfragen B20, B21).',
  rechtsstand = date '2026-10-17'
where nr = 32;

update anforderungen set
  erklaerung_fachlich = coalesce(erklaerung_fachlich,'') || E'\n\nAktualisierung 17.10.2026: Nach der 2. Edition der Kommissions-FAQ (Kap. XV FAQ 5, 14) kann eine Konformitätserklärung die gesamte Verpackungseinheit abdecken und von einem Bevollmächtigten nach Art. 17 mit schriftlichem Mandat ausgestellt werden (vgl. Praxisfrage C16).',
  rechtsstand = date '2026-10-17'
where nr = 6;

update anforderungen set
  erklaerung_fachlich = coalesce(erklaerung_fachlich,'') || E'\n\nAktualisierung 17.10.2026: Die Durchführungs- und delegierten Rechtsakte nach Art. 7 Abs. 8 bis 10 befinden sich im Verfahren (Sondierung bis 16.09.2026, Annahme geplant Q4 2026; vgl. Praxisfrage C18).',
  rechtsstand = date '2026-10-17'
where nr = 14;

update anforderungen set
  erklaerung_fachlich = coalesce(erklaerung_fachlich,'') || E'\n\nAktualisierung 17.10.2026: Der Entwurf einer Durchführungsverordnung zum harmonisierten Registerformat (Art. 44 Abs. 14) lag bis zum 10.09.2026 zur Rückmeldung aus; bis zur Annahme gilt das LUCID-Format (vgl. Praxisfrage C19).',
  rechtsstand = date '2026-10-17'
where nr = 31;

update anforderungen set
  erklaerung_fachlich = coalesce(erklaerung_fachlich,'') || E'\n\nAktualisierung 17.10.2026: Für Lagerware von vor dem 12.08.2026 lässt die Kommission die Angaben nach Art. 15 Abs. 5 und 6 per Begleitdokument zu (FAQ 2. Ed. Kap. X FAQ 5; vgl. Praxisfrage C15). Das UBA hat seine FAQ zur Erzeugeridentifikation am 30.09.2026 aktualisiert.',
  rechtsstand = date '2026-10-17'
where nr = 7;

update anforderungen set rechtsstand = date '2026-10-17' where rechtsstand < date '2026-10-17';

-- Rollen-Engine: Erläuterungen ergänzen, Flags präzisieren
update rollen_regeln set
  erlaeuterung = coalesce(erlaeuterung,'') || ' | Delta 17.10.2026: Kommissions-FAQ 2. Ed. Kap. II FAQ 5 bestätigt die Finalform-Doktrin (formstabile Transportverpackung ist mit Herstellung fertig; flexible Folie: Folienhersteller ist Erzeuger). ZSVR-Themenseite Versandhandel (Fall B.2) sieht das Zusammenfügen beim Händler enger. Flag in Session auflösen (vgl. A31).',
  rechtsstand = date '2026-10-17'
where regel_id = 'B1';

update rollen_regeln set
  erlaeuterung = coalesce(erlaeuterung,'') || ' | Delta 17.10.2026: Kommissions-FAQ 2. Ed. Kap. II FAQ 6/7: Versandaufkleber ist kein Branding und löst keine Zurechnung aus; Hinzufügen zu fertiger Verpackung nach ZSVR nur bei möglicher Auswirkung auf Recyclingfähigkeit (vgl. A30). Variable veraendert_verpackung_konformitaetsrelevant entsprechend eng auslegen.',
  rechtsstand = date '2026-10-17'
where regel_id = 'A5';

update rollen_regeln set
  erlaeuterung = coalesce(erlaeuterung,'') || ' | Delta 17.10.2026: Pflicht gilt unverändert; Aussetzung für Kleinst-/Kleinunternehmen im EU-Gesetzgebungsverfahren (COM(2025) 982, EP-Plenum 20.10.2026). Watch-Item, vgl. A35.',
  rechtsstand = date '2026-10-17'
where regel_id in ('B3','C6');

update rollen_regeln set rechtsstand = date '2026-10-17' where rechtsstand < date '2026-10-17';
update rollen_definitionen set rechtsstand = date '2026-10-17' where rechtsstand < date '2026-10-17';
update generator_templates set rechtsstand = date '2026-10-17' where rechtsstand < date '2026-10-17';
update glossar_lemmata set rechtsstand = date '2026-10-17' where rechtsstand is null or rechtsstand < date '2026-10-17';

commit;
