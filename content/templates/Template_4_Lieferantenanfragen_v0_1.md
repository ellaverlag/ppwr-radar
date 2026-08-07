# Generator-Template 4 – Muster-Lieferantenanfragen

<!-- ============================================================
GENERATOR-MASTER · Säule B · PPWR Radar – by packaging journal
Status: ENTWURF v0.1 – nicht freigegeben, geht in die Cattwyk-Session (Sprintwoche 3)
Zwei kurze Muster: (a) PFAS/Stoffkonformität nach Art. 5, (b) allgemeine Konformitätsnachweise
für Anhang VII. Rechtsanker der Anfrage ist jeweils die Informationspflicht des Lieferanten aus
Art. 16 Abs. 1 PPWR. Marker: [VORBEFÜLLT] / [NUTZER-PFLICHT] / [SYSTEM] / (!) wie in Template 1.
Tonalität: sachlich-kooperativ, keine Konformitätszusicherungen, keine Fristsetzungen mit
Rechtsfolgendrohung (das wäre einzelfallbezogene Rechtsdurchsetzung → Nutzerverantwortung).
============================================================ -->

## Muster 4a – Lieferantenanfrage Stoffkonformität (Schwermetalle / PFAS nach Art. 5 PPWR)

**Betreff:** Konformitätsnachweise nach Art. 5 der Verordnung (EU) 2025/40 (PPWR) – {{verpackung.bezeichnung}} ({{verpackung.eindeutige_kennung}})

Sehr geehrte Damen und Herren, <!-- [NUTZER-PFLICHT] Ansprechpartner ergänzen -->

wir beziehen von Ihnen die oben genannte Verpackung bzw. das oben genannte Verpackungsmaterial. Als Erzeuger im Sinne des Art. 3 Abs. 1 Nr. 13 der Verordnung (EU) 2025/40 (PPWR) sind wir verpflichtet, die Einhaltung der Stoffanforderungen des Art. 5 PPWR in unserer technischen Dokumentation nach Anhang VII nachzuweisen (Art. 5 Abs. 6 PPWR). Nach **Art. 16 Abs. 1 PPWR** händigen Lieferanten dem Erzeuger alle Informationen und Unterlagen aus, die dieser für den Konformitätsnachweis benötigt.

Wir bitten Sie daher um folgende Angaben bzw. Unterlagen, jeweils bezogen auf die gelieferte Verpackung/das Material und dessen Bestandteile:

1. **Schwermetalle (Art. 5 Abs. 4 PPWR):** Bestätigung oder Prüfbericht, dass die Summe der Konzentrationen von Blei, Cadmium, Quecksilber und sechswertigem Chrom **100 mg/kg** nicht erreicht oder überschreitet.
{{#wenn verpackung.lebensmittelkontakt}}
2. **PFAS (Art. 5 Abs. 5 PPWR – Verpackungen mit Lebensmittelkontakt):** Angaben bzw. Prüfergebnisse zu den Grenzwerten
   a) 25 ppb für jedes im Rahmen einer gezielten Analyse gemessene PFAS (ohne polymere PFAS),
   b) 250 ppb für die Summe der PFAS aus der gezielten Analyse, ggf. mit vorherigem Abbau von Vorläuferverbindungen (ohne polymere PFAS),
   c) 50 ppm für PFAS einschließlich polymerer PFAS.
3. **Fluor-Herkunftsnachweis:** Übersteigt der Gesamtfluorgehalt **50 mg/kg**, bitten wir gemäß **Art. 5 Abs. 5 lit. c PPWR** um einen Nachweis der Menge des als PFAS- oder Nicht-PFAS-Gehalt gemessenen Fluors (Nachweispflicht der Akteure i. S. v. Art. 3 Nr. 9, 11 und 13 der VO (EG) Nr. 1907/2006 gegenüber Erzeuger/Importeur), damit wir die technische Dokumentation nach Anhang VII erstellen können.
{{/wenn}}
{{#wenn nicht verpackung.lebensmittelkontakt}}
2. *(PFAS-Abfrage entfällt – laut unserem Profil kein Lebensmittelkontakt. [NUTZER-PFLICHT] Bitte prüfen Sie diese Einstufung; bei Lebensmittelkontakt gilt zusätzlich Art. 5 Abs. 5 PPWR.)*
{{/wenn}}
4. **Angabe der verwendeten Analytik/Methodik** und des Prüfdatums je Bericht.

Bitte übermitteln Sie die Unterlagen in deutscher oder englischer Sprache, elektronisch oder in Papierform (Art. 16 Abs. 1 Satz 2 PPWR), bis zum [NUTZER-PFLICHT: Datum] ____________.

[SYSTEM-Hinweis an den Nutzer, nicht Teil des Schreibens:] Die dreistufige Prüfkaskade (Gesamtfluor → Pyrolyse-GC/MS → TOP-Analyse) entstammt dem Leitfaden C(2026) 3702, Abschn. 5 – **Auslegung der EU-Kommission, rechtlich nicht bindend**; sie kann als Nachweislogik mit dem Lieferanten vereinbart werden, ist aber nicht vorgeschrieben.

Mit freundlichen Grüßen
{{profil.firmenname}} · {{profil.zeichnungsberechtigter_name}} <!-- [VORBEFÜLLT] -->

---

## Muster 4b – Lieferantenanfrage allgemeine Konformitätsnachweise (technische Dokumentation nach Anhang VII)

**Betreff:** Unterlagen für die technische Dokumentation nach Anhang VII PPWR – {{verpackung.bezeichnung}} ({{verpackung.eindeutige_kennung}})

Sehr geehrte Damen und Herren, <!-- [NUTZER-PFLICHT] Ansprechpartner ergänzen -->

für die von Ihnen gelieferte Verpackung/das Verpackungsmaterial erstellen wir als Erzeuger die technische Dokumentation nach **Anhang VII i. V. m. Art. 38 der Verordnung (EU) 2025/40 (PPWR)**. Gemäß **Art. 16 Abs. 1 PPWR** bitten wir Sie um Aushändigung der Informationen und Unterlagen, die wir für den Nachweis der Konformität der Verpackung und der Verpackungsmaterialien benötigen, insbesondere:

1. **Materialzusammensetzung** je Bauteil (inkl. Beschichtungen, Druckfarben, Verschlüsse; Masseanteile je Material);
2. **Spezifikationen/Zeichnungen** der gelieferten Bauteile, soweit für die Konformitätsbewertung von Belang (Anhang VII Nr. 2 lit. b/c);
3. **Prüfberichte und Erklärungen** zu den geltenden Stoffanforderungen (Art. 5 Abs. 4{{#wenn verpackung.lebensmittelkontakt}}, Abs. 5{{/wenn}} PPWR – siehe ggf. unsere gesonderte Anfrage nach Muster 4a);
4. **Angaben zu angewandten Normen/technischen Spezifikationen** (Anhang VII Nr. 2 lit. d), einschließlich der bisher zugrunde gelegten Dokumentation nach EN 13428/13429/13430:2004;
{{#wenn verpackung.mehrweg}}
5. **Nachweise zur Wiederverwendbarkeit** (Konzeption für Mehrfachumlauf, Rekonditionierbarkeit – Art. 11 Abs. 1, Anhang VI Teil B PPWR);
{{/wenn}}
{{#wenn verpackung.lebensmittelkontakt}}
6. **Unterlagen nach den für Lebensmittelkontaktmaterialien geltenden Rechtsakten der Union** (Art. 16 Abs. 2 PPWR, u. a. VO (EG) Nr. 1935/2004);
{{/wenn}}
7. bei Rezyklateinsatz: **Angaben zu Rezyklatanteilen und deren Herkunft** (relevant u. a. für § 45 VerpackDG bei Einweggetränkeflaschen und künftig Art. 7 PPWR).

Bitte übermitteln Sie die Unterlagen in deutscher oder englischer Sprache, elektronisch oder in Papierform (Art. 16 Abs. 1 PPWR), bis zum [NUTZER-PFLICHT: Datum] ____________. Für Rückfragen zur benötigten Detailtiefe stehen wir gern zur Verfügung.

Mit freundlichen Grüßen
{{profil.firmenname}} · {{profil.zeichnungsberechtigter_name}} <!-- [VORBEFÜLLT] -->

<!-- [SYSTEM-Hinweis an den Nutzer, nicht Teil des Schreibens:]
Kleinstunternehmen-Konstellation (Rollen-Engine A3 (!)): Sind SIE Kleinstunternehmen (Stand 11.02.2025) und ist Ihr
Verpackungslieferant im selben Mitgliedstaat ansässig, gilt der Lieferant selbst als Erzeuger (Art. 3 Abs. 1 Nr. 13
lit. b; Art. 15 Abs. 12 PPWR) – die Anfrage wäre dann sinngemäß umgekehrt zu adressieren (Erzeuger-Pflichten liegen
beim Lieferanten). Der Generator blendet in diesem Fall einen Eskalationshinweis ein. -->

---

*Dokument erzeugt mit PPWR Radar – by packaging journal · Version {{dokument.version}} · Rechtsstand {{dokument.rechtsstand}}*
*Dieses Dokument ist eine strukturierte Arbeitsgrundlage, keine Rechtsberatung; die Verantwortung für die Angaben liegt beim Verwender.*
