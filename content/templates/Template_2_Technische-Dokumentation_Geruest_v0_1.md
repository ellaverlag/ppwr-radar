# Generator-Template 2 – Gerüst der technischen Dokumentation (Anhang VII i. V. m. Art. 38 PPWR, Modul A)

<!-- ============================================================
GENERATOR-MASTER · Säule B · PPWR Radar – by packaging journal
Status: ENTWURF v0.1 – nicht freigegeben, geht in die Cattwyk-Session (Sprintwoche 3)
Rendering: je Datensatz aus `profil_verpackungen` EIN Doku-Gerüst („für jede Verpackungsart", Anhang VII Nr. 4).
Kapitelstruktur folgt Anhang VII Nr. 2 lit. a–f; Checklisten verknüpfen auf die Anforderungs-Nummern
aus Paket v0.2 (#1–#40). Marker: [VORBEFÜLLT] / [NUTZER-PFLICHT] / [SYSTEM] / (!) wie in Template 1.
============================================================ -->

## Technische Dokumentation – {{verpackung.bezeichnung}} ({{verpackung.eindeutige_kennung}})

**Erzeuger:** {{profil.firmenname}}, {{profil.strasse}} {{profil.hausnummer}}, {{profil.plz}} {{profil.ort}}, {{profil.land}} <!-- [VORBEFÜLLT] -->
**Verpackungsart:** {{verpackung.typ_label}} · Material: {{verpackung.material_label}} · Lebensmittelkontakt: {{verpackung.lebensmittelkontakt_label}} · Mehrweg: {{verpackung.mehrweg_label}} <!-- [VORBEFÜLLT] -->
**Zugehörige EU-Konformitätserklärung:** Nr. {{verpackung.doc_nummer}} (Template 1) <!-- [VORBEFÜLLT] -->
**Produktlinie:** {{verpackung.produktlinie}} · **Rollen-Set:** {{rollen.rollen_set_label}} <!-- [VORBEFÜLLT] aus rollen_ergebnisse -->

> **Rechtsgrundlage und Zweck (wird dem Nutzer angezeigt):** Vor dem Inverkehrbringen führt der Erzeuger das Konformitätsbewertungsverfahren nach **Art. 38 i. V. m. Anhang VII PPWR (Modul A – interne Fertigungskontrolle)** durch oder lässt es durchführen und erstellt diese technische Dokumentation (Art. 15 Abs. 2 PPWR). Anhand der Dokumentation muss die Konformität der Verpackung mit den geltenden Anforderungen bewertet werden können; sie muss eine angemessene **Analyse und Bewertung der Risiken der Nichtkonformität** enthalten (Anhang VII Nr. 2). Delegation an Labore/Dienstleister ist zulässig, die Verantwortung bleibt beim Erzeuger (Art. 15 Abs. 2; Leitfaden C(2026) 3702 Abschn. 2 – Auslegung der EU-Kommission, rechtlich nicht bindend).

> **Aufbewahrung und Vorlage:** Technische Dokumentation und EU-Konformitätserklärung sind aufzubewahren: **5 Jahre** (Einwegverpackungen) bzw. **10 Jahre** (wiederverwendbare Verpackungen) ab Inverkehrbringen – **Art. 15 Abs. 3 lit. a/b PPWR** (Volltext-Fund; bestätigt durch Anhang VII Nr. 4; Importeurs-Parallele Art. 18 Abs. 7). **(!) V1:** Fundstelle in der Session final pinnen – v0.2 nannte als Kandidat noch Art. 15 Abs. 8 (das ist die Korrekturmaßnahmen-Norm). Vorlage an die nationale Behörde auf begründetes Verlangen **binnen 10 Tagen** (Art. 15 Abs. 10 (!) V1 – Wortlaut im Volltext verifiziert, Session-Bestätigung ausstehend).

---

### Kapitel 0 – Geltende Anforderungen (Prüfmatrix dieser Verpackungsart)

[SYSTEM] In der technischen Dokumentation sind die geltenden Anforderungen aufzuführen (Anhang VII Nr. 2 Satz 3). Für diese Verpackung zum Rechtsstand {{dokument.rechtsstand}}:

| Anforderung | Fundstelle | Datensatz | Status | Nachweis liegt vor? |
|---|---|---|---|---|
| Schwermetall-Summengrenzwert 100 mg/kg | Art. 5 Abs. 4 PPWR | #1 | gilt seit 12.08.2026 | ☐ |
{{#wenn verpackung.lebensmittelkontakt}}| PFAS-Grenzwerte (25 ppb / 250 ppb / 50 ppm) | Art. 5 Abs. 5 PPWR | #2 | gilt seit 12.08.2026 | ☐ |{{/wenn}}
{{#wenn verpackung.mehrweg}}| Mehrweg-Kriterien lit. a–i + Systemzugehörigkeit | Art. 11 Abs. 1, Anhang VI PPWR | #3, #30 | gilt (materiell ab 11.02.2025) | ☐ |{{/wenn}}
| Recyclingfähigkeit – Grundpflicht (Übergangsmaßstab RL 94/62/EG / EN 13430) | Art. 6 Abs. 1 PPWR | #11 | gilt; Maßstab Alt-Recht (Leitfaden Abschn. 6, unverbindlich) (!) T3 | ☐ |
| Identifikations-/Kontaktkennzeichnung | Art. 15 Abs. 5 u. 6 PPWR | #7 | gilt seit 12.08.2026 | ☐ |
<!-- Bedingungslogik aus profil_verpackungen. NICHT aufnehmen (noch nicht geltend, Datensatz #10): Art. 6 Abs. 2–5, Art. 7, Art. 10 (ab 2030), Art. 12, Art. 24, Art. 25. Der Radar ergänzt Zeilen automatisch, sobald Pflichten geltend werden (Dokumenten-Aktualität, Briefing v7 Säule C). -->

### Kapitel 1 – Allgemeine Beschreibung der Verpackung und ihres vorgesehenen Verwendungszwecks *(Anhang VII Nr. 2 lit. a)*

[VORBEFÜLLT] Grunddaten: {{verpackung.bezeichnung}}, {{verpackung.typ_label}}, {{verpackung.material_label}}, Füllgut/Verwendung: {{verpackung.fuellgut}}
[NUTZER-PFLICHT] Beschreibung vervollständigen (Funktion, Zielmarkt, Einweg/Mehrweg-Einsatzszenario): ____________________

**Checkliste Nachweise:** ☐ Produktdatenblatt · ☐ Foto/Abbildung · ☐ Zuordnung zur Verkaufs-/Um-/Transport-/Service-/Primärproduktionsverpackung (Definitionen Art. 3 Abs. 1 Nr. 4–7 PPWR)

### Kapitel 2 – Entwürfe, Fertigungszeichnungen und Materialien von Bauteilen *(Anhang VII Nr. 2 lit. b)*

[NUTZER-PFLICHT] Zeichnungen/Spezifikationen je Bauteil (Körper, Verschluss, Etikett, Barriere/Beschichtung, Druckfarben) beifügen.

**Checkliste Nachweise:** ☐ technische Zeichnung/CAD · ☐ Stückliste mit Materialangabe je Bauteil · ☐ Masseanteile je Material (relevant für 5-%-Schwellen, vgl. #24; künftig Art. 7 Abs. 5 lit. b)

### Kapitel 3 – Beschreibungen und Erläuterungen zu Zeichnungen, Plänen und Funktionsweise *(Anhang VII Nr. 2 lit. c)*

[NUTZER-PFLICHT] Erläuterungstext, soweit für die Bewertung von Belang (z. B. Barrierefunktion, Wiederverschluss, Entleerbarkeit bei Mehrweg).

### Kapitel 4 – Liste der angewandten Normen und technischen Spezifikationen *(Anhang VII Nr. 2 lit. d i–v)*

[NUTZER-PFLICHT] je Zeile ausfüllen; wo keine harmonisierten Normen/gemeinsamen Spezifikationen angewendet werden, ist die gewählte Lösung zu beschreiben (lit. d v):

| lit. | Inhalt | Eintrag |
|---|---|---|
| i | Harmonisierte Normen gemäß Art. 36 (ganz/teilweise) | [SYSTEM-Hinweis: zum Rechtsstand keine PPWR-harmonisierten Normen gelistet] ____________ |
| ii | Gemeinsame Spezifikationen gemäß Art. 37 | [SYSTEM-Hinweis: keine erlassen] ____________ |
| iii | Sonstige technische Spezifikationen (Mess-/Berechnungszwecke) | z. B. Analytik-Methoden Schwermetalle/PFAS ____________ |
| iv | Teilweise angewandte Normen/Spezifikationen: angewandte Teile | ____________ |
| v | Ohne Normen/Spezifikationen: Beschreibung der gewählten Lösungen | z. B. EN 13428/13429/13430:2004 als Alt-Maßstab ____________ |

### Kapitel 5 – Qualitative Beschreibung der Bewertungen nach Art. 6, 10 und 11 *(Anhang VII Nr. 2 lit. e)*

[SYSTEM-Vorbelegung nach Rechtsstand {{dokument.rechtsstand}}:]
- **Art. 6 (Recyclingfähigkeit):** Bewertung nach Alt-Maßstab (RL 94/62/EG, EN 13430) dokumentiert; keine Konformitätsbewertungspflicht für Recyclingfähigkeit vor Geltung der DfR-Rechtsakte *(Leitfaden Abschn. 6, unverbindlich; Datensatz #11)* (!) T3.
- **Art. 10 (Minimierung):** anwendbar ab 01.01.2030; bis dahin Alt-Anforderungen + EN 13428:2004 (Art. 70 Abs. 1 lit. b; Datensatz #17). Freiwilliges Minimierungs-Assessment kann hier abgelegt werden. Hinweis DE-Layer: § 12 Abs. 3 VerpackDG gilt bereits (Divergenz (!) V7).
{{#wenn verpackung.mehrweg}}- **Art. 11 (Mehrweg):** [NUTZER-PFLICHT] Bewertung je Kriterium lit. a–i beschreiben + Nachweis Wiederverwendungssystem (Anhang VI, Datensatz #3/#30): ____________________{{/wenn}}
{{#wenn nicht verpackung.mehrweg}}- **Art. 11:** nicht einschlägig (Einwegverpackung laut Profil – [NUTZER-PFLICHT] Einstufung prüfen; Falsch-Einstufung siehe Risiko-Hinweis Datensatz #3).{{/wenn}}

### Kapitel 6 – Prüfberichte *(Anhang VII Nr. 2 lit. f)*

**Checkliste Nachweise (verknüpft mit Datensätzen):**
- ☐ Schwermetall-Prüfbericht oder Lieferantenbestätigung je Bauteil (Art. 5 Abs. 4/6; #1) – Muster: Template 4a/4b
{{#wenn verpackung.lebensmittelkontakt}}- ☐ PFAS-Nachweis (Prüfkaskade Gesamtfluor → ggf. Pyrolyse-GC/MS → TOP-Analyse als Nachweislogik; Leitfaden Abschn. 5, unverbindlich) oder Lieferantenerklärung (Art. 5 Abs. 5/6; #2) – Muster: Template 4a
- ☐ bei Gesamtfluor > 50 mg/kg: Fluor-Herkunftsnachweis der Lieferkette (Art. 5 Abs. 5 lit. c; #2)
- ☐ Konformitätsarbeit Lebensmittelkontakt (VO (EG) Nr. 1935/2004 – Verweis, eigenes Regime){{/wenn}}
{{#wenn verpackung.mehrweg}}- ☐ Rotations-/Rekonditionierungs-Nachweise (Art. 11 Abs. 1 lit. b/f, Anhang VI Teil B; #3){{/wenn}}
- ☐ EN-13430-/13428-Dokumentation (Alt-Maßstab; #11/#17)

### Kapitel 7 – Analyse und Bewertung der Risiken der Nichtkonformität *(Anhang VII Nr. 2 Satz 2)*

[NUTZER-PFLICHT] je geltender Anforderung aus Kapitel 0 bewerten:

| Anforderung (Datensatz) | Risikoquelle (z. B. Rezyklateinsatz, Beschichtung, Lieferantenwechsel) | Eintrittswahrscheinlichkeit | Maßnahme/Kontrolle | Restrisiko |
|---|---|---|---|---|
| #1 Schwermetalle | ____________ | ____________ | ____________ | ____________ |
{{#wenn verpackung.lebensmittelkontakt}}| #2 PFAS | ____________ | ____________ | ____________ | ____________ |{{/wenn}}
| #7 Kennzeichnung | ____________ | ____________ | ____________ | ____________ |
| … | | | | |

### Kapitel 8 – Herstellung und Serienkonformität *(Anhang VII Nr. 3; Art. 15 Abs. 4)*

[NUTZER-PFLICHT] Beschreiben, wie Herstellungsprozess und Überwachung die Übereinstimmung mit dieser Dokumentation gewährleisten (QS-Prozess, Wareneingangsprüfung, Änderungsmanagement). [SYSTEM-Hinweis] Bei Änderungen an Gestaltung/Merkmalen oder an referenzierten Normen: erneute Bewertung nach Art. 38 (Art. 15 Abs. 4) – der Radar setzt bei relevanten Rechtsänderungen ein „Update verfügbar"-Flag auf dieses Dokument.

### Kapitel 9 – Lieferanten-Informationen *(Art. 16 Abs. 1 PPWR)*

[SYSTEM] Lieferanten händigen dem Erzeuger alle Informationen und Unterlagen aus, die er benötigt, um die Konformität von Verpackung und Verpackungsmaterialien nachzuweisen – einschließlich der für diese technische Dokumentation erforderlichen Unterlagen, in einer für den Erzeuger leicht verständlichen Sprache, auf Papier oder elektronisch (Art. 16 Abs. 1). Bei kontaktempfindlichen Verpackungen gehören die Unterlagen der einschlägigen Unions-Rechtsakte dazu (Art. 16 Abs. 2).

| Lieferant | Bauteil/Material | Angefordert am (Template 4) | Erhalten am | Dokument-Referenz |
|---|---|---|---|---|
| {{verpackung.lieferant_1}} | ____________ | ____________ | ____________ | ____________ |
| … | | | | |

<!-- [VORBEFÜLLT] Lieferantenliste aus Profil, sofern erfasst; Rest Nutzerpflicht.
Rollen-Hinweis (Rollen-Engine A3 (!)): Ist der Auftraggeber ein Kleinstunternehmen (Stand 11.02.2025) und der Verpackungslieferant in demselben Mitgliedstaat ansässig, gilt der LIEFERANT als Erzeuger (Art. 3 Abs. 1 Nr. 13 lit. b; Art. 15 Abs. 12) – dann kehrt sich die Doku-Verantwortung um. -->

### Kapitel 10 – Konformitätserklärung und Ablage *(Anhang VII Nr. 4 u. 5)*

- ☐ EU-Konformitätserklärung (Template 1) ausgestellt am ____________, Referenz {{verpackung.doc_nummer}}
- ☐ Ablage mit dieser Dokumentation, Aufbewahrung {{#wenn verpackung.mehrweg}}10 Jahre{{/wenn}}{{#wenn nicht verpackung.mehrweg}}5 Jahre{{/wenn}} ab Inverkehrbringen (Art. 15 Abs. 3 (!) V1)
- ☐ ggf. Führung der Dokumentation durch Bevollmächtigten nach Art. 17 (Anhang VII Nr. 5; Aufgabenumfang laut schriftlichem Auftrag – Art. 15 Abs. 1-Pflichten und die Doku-ERSTELLUNG sind nicht delegierbar, Art. 17 letzter Satz)

---

*Dokument erzeugt mit PPWR Radar – by packaging journal · Version {{dokument.version}} · Rechtsstand {{dokument.rechtsstand}}*
*Dieses Dokument ist eine strukturierte Arbeitsgrundlage, keine Rechtsberatung; die Verantwortung für die Angaben liegt beim Verwender.*
