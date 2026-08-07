# Generator-Template 3 – Pflichtenübersicht je Produktlinie (internes Briefing)

<!-- ============================================================
GENERATOR-MASTER · Säule B · PPWR Radar – by packaging journal
Status: ENTWURF v0.1 – nicht freigegeben, geht in die Cattwyk-Session (Sprintwoche 3)
Rendering: je Produktlinie (Wizard F04) EIN internes Briefing.
Quellen: rollen_ergebnisse (Schicht 1, Rollen-Engine v0.91 – Terminologie verbindlich),
Anforderungs-Datensätze v0.2 (Schicht 2), § 68 VerpackDG (BGBl. 2026 I Nr. 207 – Fristen verifiziert).
Marker: [VORBEFÜLLT] / [NUTZER-PFLICHT] / [SYSTEM] / (!) wie in Template 1.
Zweck: internes Arbeitsdokument („Was muss ich am Montag tun?") – KEIN Behördendokument.
============================================================ -->

## Pflichtenübersicht – Produktlinie „{{verpackung.produktlinie}}"

**Unternehmen:** {{profil.firmenname}} · Sitz: {{profil.sitz_label}} · LUCID-Registrierungsnummer: {{#wenn profil.lucid_nummer}}{{profil.lucid_nummer}}{{/wenn}}{{#wenn nicht profil.lucid_nummer}}[NUTZER-PFLICHT: prüfen, ob Registrierungspflicht besteht – siehe Abschnitt 3]{{/wenn}}
**Erstellt:** {{dokument.erstellt_am}} · Rechtsstand: {{dokument.rechtsstand}}

---

### 1. Ihr Rollen-Set für diese Produktlinie (mit Herleitung)

[SYSTEM] Die PPWR trennt zwei Verantwortungsschienen, die das VerpackG in einer Rolle bündelte – und vertauscht dabei die deutschen Begriffe gegenüber der englischen Fassung: **„Erzeuger" (EN: manufacturer, Art. 3 Abs. 1 Nr. 13)** trägt die Produktkonformität; **„Hersteller" (EN: producer, Art. 3 Abs. 1 Nr. 15)** trägt die erweiterte Herstellerverantwortung je Mitgliedstaat. Rollen gelten **je Produktlinie als Set** – Doppelrollen sind der Normalfall (Rollen-Engine v0.91, Abschn. 1).

| Rolle | Trifft zu? | Herleitung (ausgelöste Regel) | Fundstelle |
|---|---|---|---|
| Erzeuger (manufacturer) | {{rollen.ist_erzeuger_label}} | {{rollen.herleitung_erzeuger}} | {{rollen.fundstelle_erzeuger}} |
| Hersteller (producer, EPR) | {{rollen.ist_hersteller_label}} | {{rollen.herleitung_hersteller}} | {{rollen.fundstelle_hersteller}} |
| Importeur | {{rollen.ist_importeur_label}} | {{rollen.herleitung_importeur}} | {{rollen.fundstelle_importeur}} |
| Vertreiber | {{rollen.ist_vertreiber_label}} | {{rollen.herleitung_vertreiber}} | {{rollen.fundstelle_vertreiber}} |
| Endvertreiber | {{rollen.ist_endvertreiber_label}} | {{rollen.herleitung_endvertreiber}} | {{rollen.fundstelle_endvertreiber}} |
| Lieferant | {{rollen.ist_lieferant_label}} | {{rollen.herleitung_lieferant}} | {{rollen.fundstelle_lieferant}} |
| Fulfillment-Dienstleister | {{rollen.ist_fulfillment_label}} | {{rollen.herleitung_fulfillment}} | {{rollen.fundstelle_fulfillment}} |
| EHV-Bevollmächtigter erforderlich? | {{rollen.braucht_ehv_bevollmaechtigten_label}} | {{rollen.herleitung_ehv}} | Art. 45 Abs. 3 PPWR; § 5 Abs. 2–6 VerpackDG |

<!-- [VORBEFÜLLT] vollständig aus rollen_ergebnisse (Regeln A1–A5, B1–B6, C1–C6, Z1 der Rollen-Engine v0.91).
Offene Rollen-Pins (A3, B1, B3–B6, C1, C4) tragen ihr (!) aus dem Rollen-Paket; bei Eskalation („unklar" in F09)
zeigt der Generator statt der Zeile den Ebene-3-Disclaimer + Cattwyk-Hinweis. -->

{{#wenn rollen.hat_leitfaden_bezug}}
> [SYSTEM] Teile dieser Herleitung stützen sich auf den Leitfaden C(2026) 3702 – **Auslegung der EU-Kommission, rechtlich nicht bindend** ((!) U7: Standard-Formulierung von Cattwyk freizugeben).
{{/wenn}}

---

### 2. Ihre Pflichten: „gilt seit 12.08.2026" vs. „kommt später"

#### 2a. Gilt seit 12.08.2026 (jetzt handeln)

| Pflicht | Ihre Rolle | Fundstelle | Datensatz | Handlungsstatus |
|---|---|---|---|---|
{{#wenn rollen.ist_erzeuger}}| Nur konforme Verpackungen in Verkehr bringen | Erzeuger | Art. 15 Abs. 1 PPWR | #1/#2 | ☐ |
| Konformitätsbewertung je Verpackungsart (Modul A) | Erzeuger | Art. 38, Anhang VII | #4 | ☐ |
| Technische Dokumentation erstellen (→ Template 2) | Erzeuger | Anhang VII, Art. 15 Abs. 2 | #5 | ☐ |
| EU-Konformitätserklärung ausstellen (→ Template 1) | Erzeuger | Art. 39, Anhang VIII; § 62 VerpackDG (Sprache) | #6 | ☐ |
| Identifikations-/Kontaktkennzeichnung | Erzeuger | Art. 15 Abs. 5 u. 6 | #7 | ☐ |{{/wenn}}
{{#wenn verpackung.lebensmittelkontakt}}| PFAS-Grenzwerte einhalten (LMK) | Erzeuger/Importeur | Art. 5 Abs. 5 | #2 | ☐ |{{/wenn}}
{{#wenn rollen.ist_importeur}}| Importeurs-Prüfpflichten (Bewertung/Doku/Kennzeichnung des Erzeugers) + eigene Angaben | Importeur | Art. 18 Abs. 1–3 | #37 | ☐ |{{/wenn}}
{{#wenn rollen.ist_hersteller}}| Registrierung ZSVR/LUCID vor erster Bereitstellung (bzw. vor dem Auspacken) | Hersteller | § 6 VerpackDG i. V. m. Art. 44 PPWR | #31 | ☐ |
| Systembeteiligung (soweit systembeteiligungspflichtig, § 3 Abs. 6) | Hersteller | § 7 VerpackDG i. V. m. Art. 45 Abs. 1 PPWR | #32 | ☐ |
| Datenmeldung / ggf. Vollständigkeitserklärung | Hersteller | §§ 9, 10 VerpackDG | #33 | ☐ |{{/wenn}}
{{#wenn rollen.braucht_ehv_bevollmaechtigten}}| EHV-Bevollmächtigten benennen (je Zielland, VOR erster Bereitstellung) | Hersteller | Art. 45 Abs. 3; § 5 Abs. 2–6 VerpackDG | #9 | ☐ |{{/wenn}}
{{#wenn rollen.ist_vertreiber}}| Sorgfaltspflichten: Kennzeichnung + Registereintrag des Herstellers prüfen | Vertreiber | Art. 19 PPWR | #38 | ☐ |{{/wenn}}
{{#wenn rollen.ist_endvertreiber}}| Pfand-/Rücknahme-/Hinweispflichten (EINWEG/MEHRWEG) | Endvertreiber | §§ 46, 47 VerpackDG | #36 | ☐ |
| Mehrwegangebotspflicht Take-away (sofern einschlägig) | Endvertreiber | §§ 60, 61 VerpackDG | #29 | ☐ |{{/wenn}}
{{#wenn rollen.ist_fulfillment}}| Nur für registrierte Hersteller tätig werden (ZSVR-Abgleich) | Fulfillment | Art. 20 PPWR; § 13 Abs. 4 VerpackDG | #39 | ☐ |{{/wenn}}
{{#wenn rollen.ist_lieferant}}| Informations-/Unterlagenpflicht gegenüber Erzeugern | Lieferant | Art. 16 Abs. 1 PPWR | #40 | ☐ |{{/wenn}}
{{#wenn verpackung.mehrweg}}| Mehrweg-Kriterien + Wiederverwendungssystem | Erzeuger/Hersteller/Endvertreiber | Art. 11, Anhang VI; §§ 39, 47 VerpackDG | #3/#30 | ☐ |{{/wenn}}

#### 2b. Kommt 2027 / 2028 / 2030 (vormerken, Radar meldet)

| Ab | Pflicht | Fundstelle | Datensatz |
|---|---|---|---|
| 12.02.2027 | Bußgeldtatbestände für PPWR-Verstöße werden anwendbar (§ 66 Abs. 2) – **keine „Schonfrist": nationale Bußgelder (§ 66 Abs. 1) und Vertriebsverbote gelten bereits jetzt** | § 68 Abs. 17 VerpackDG (verifiziert BGBl S. 43) | #8, Q3 |
| 01.01.2027 | Flüssigkeitskarton-Regel § 42 Abs. 2/3 VerpackDG | § 68 Abs. 8 Satz 2; Mantelgesetz Art. 4 | R10 |
| 12.02.2028 | Kompostierbarkeit der Formate des Art. 9 Abs. 1 | Art. 9 PPWR | #16 |
| 12.02.2028 | § 60 VerpackDG neu gefasst („Einwegkunststoffgetränkebecher") | Mantelgesetz Art. 4 | #29/R10 |
| 12.08.2028* | Harmonisiertes Sortierlabel (*oder 24 Mon. nach Durchführungsrechtsakt) | Art. 12 Abs. 1/6 PPWR | #19 |
| 12.02.2029* | Mehrweg-Label + QR (*oder 30 Mon. nach Rechtsakt) | Art. 12 Abs. 2 PPWR | #20 |
| 01.01.2030 | DfR-Recyclingfähigkeit (Klassen), EU-Rezyklatquoten, Minimierung, Leerraum 50 %, Anhang-V-Verbote, Mehrwegquoten | Art. 6, 7, 10, 24, 25, 29 PPWR | #12, #14, #17, #18, #24, #27, #28 |

<!-- [SYSTEM] Tabelle 2b wird aus Schicht 2 gefiltert auf die Rollen/Typen dieser Produktlinie; Sternchen-Fristen hängen an ausstehenden Rechtsakten (Radar-Liste Teil E, v0.2). -->

---

### 3. DE-Rechtsfolgen-Kaskade (Registrierung / Systembeteiligung / Fristen aus § 68 VerpackDG)

[SYSTEM – Fristen gegen BGBl. 2026 I Nr. 207 verifiziert:]

{{#wenn rollen.ist_hersteller}}
**Schritt 1 – Registrierung (§ 6 VerpackDG):**
- {{#wenn profil.war_verpackg_registriert}}Sie sind nach § 9 VerpackG a. F. registriert → Registrierung gilt fort (§ 68 Abs. 2 Satz 1). **Änderungsmitteilungen nach § 6 Abs. 1 Satz 2 bis 12.11.2026** (§ 68 Abs. 2 Satz 2). ☐ erledigt{{/wenn}}
- {{#wenn nicht profil.war_verpackg_registriert}}Sie sind erstmals nach § 6 Abs. 1 Satz 1 registrierungspflichtig (z. B. neuer Auspacker-Fall, Nr. 15 lit. e) → **Registrierung bis 12.09.2026** (§ 68 Abs. 2 Satz 3); beim Auspacker-Tatbestand VOR dem Auspacken (§ 6 Abs. 1). ☐ erledigt{{/wenn}}
- Rechtsfolge bei Verstoß: Tätigkeits-/Vertriebsverbot (§ 13 Abs. 1), Bußgeld § 66 Abs. 1 Nr. 1/2 (verifiziert BGBl S. 38) – **ab 12.08.2026**.

**Schritt 2 – Systembeteiligung (§ 7 VerpackDG),** soweit systembeteiligungspflichtige Verpackungen (§ 3 Abs. 6):
- Alt-Systembeteiligungen nach § 7 VerpackG a. F. gelten fort, **längstens bis 31.12.2026** (§ 68 Abs. 1) → Neuabschluss unter VerpackDG rechtzeitig terminieren. ☐ geplant
- Serviceverpackungen: Übertragung auf Vorvertreiber möglich (§ 7 Abs. 2 – Anwendungsbereich (!) U2, in Session).
- Rechtsfolge bei Verstoß: Bereitstellungs-/Auspackverbot (§ 13 Abs. 1 Satz 2), Bußgeld § 66 Abs. 1 Nr. 3.

**Schritt 3 – Datenmeldung/Vollständigkeitserklärung (§§ 9, 10):** nicht delegierbar (§ 5 Abs. 1 Satz 2); Übergangsregeln für das Meldejahr 2026 in § 68 Abs. 5 ((!) V15: Schwellenwerte § 10 und § 66-Nummern in Session pinnen).
{{/wenn}}
{{#wenn nicht rollen.ist_hersteller}}
Für diese Produktlinie ergibt die Rollen-Herleitung **keine Herstellerrolle** – Registrierungs-/Systembeteiligungspflichten treffen Sie hier nicht ([NUTZER-PFLICHT] andere Produktlinien separat prüfen; Vertreiber beachten Art. 19: Registereintrag ihrer Lieferanten-Hersteller prüfen, #38).
{{/wenn}}

**Weitere § 68-Fristen (sofern einschlägig):** Branchenlösungen ohne neue Zulassung längstens bis **31.10.2027** (§ 68 Abs. 6/7); sonstige Organisationen für Herstellerverantwortung bis **31.10.2027** (§ 68 Abs. 12); Hersteller nicht systembeteiligungspflichtiger Verpackungen ohne Zulassung nach § 19 bis **31.12.2027** (§ 68 Abs. 9).

---

### 4. Priorisierte nächste Schritte

[VORBEFÜLLT] aus Status-Analyse (Gap-Liste, Säule A): {{rollen.gap_liste}}
[NUTZER-PFLICHT] Verantwortliche und Termine ergänzen: ____________________

{{#wenn rollen.risiko_hoch}}
> [SYSTEM · Ebene-3-Disclaimer] Ihre Konstellation enthält Punkte, die eine einzelfallbezogene rechtliche Prüfung nahelegen. Dieses Briefing ordnet ein und priorisiert; es ersetzt keine Rechtsberatung. {{cattwyk.erstgespraech_hinweis}} <!-- Formulierung von Cattwyk freigegeben einsetzen (Briefing v7, Abschn. 4.2/5) -->
{{/wenn}}

---

*Dokument erzeugt mit PPWR Radar – by packaging journal · Version {{dokument.version}} · Rechtsstand {{dokument.rechtsstand}}*
*Dieses Dokument ist eine strukturierte Arbeitsgrundlage, keine Rechtsberatung; die Verantwortung für die Angaben liegt beim Verwender.*
