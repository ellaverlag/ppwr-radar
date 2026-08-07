# Generator-Template 1 – EU-Konformitätserklärung (Struktur nach Anhang VIII i. V. m. Art. 39 PPWR)

<!-- ============================================================
GENERATOR-MASTER · Säule B · PPWR Radar – by packaging journal
Status: ENTWURF v0.1 – nicht freigegeben, geht in die Cattwyk-Session (Sprintwoche 3)
Rendering: je Datensatz aus `profil_verpackungen` wird EINE Erklärung erzeugt
(Sammelerklärung „alle Verpackungen" genügt nicht – eindeutige Typ-Identifikation, vgl. Datensatz #6).
Legende der Marker:
  [VORBEFÜLLT]     = wird aus Profil/Portfolio automatisch gesetzt; Nutzer prüft nur.
  [NUTZER-PFLICHT] = muss der Nutzer zwingend selbst ergänzen und inhaltlich verantworten.
  [SYSTEM]         = feststehender Text aus dem Rechtstext bzw. der freigegebenen Wissensbasis.
  (!)              = offener Punkt, Cattwyk-Session (siehe Review-Paket, Teil D).
Alle Ziffern-Überschriften und Formulierungen der Ziffern 1–8 folgen wörtlich dem Muster
in Anhang VIII PPWR (ABl. L, 2025/40, 22.01.2025, S. 108). Nichts umformulieren.
============================================================ -->

> **Hinweis vor dem Ausfüllen (wird dem Nutzer angezeigt, nicht Teil der Erklärung):**
> - Diese Erklärung ist der Entwurf einer **EU-Konformitätserklärung nach Art. 39 i. V. m. Anhang VIII PPWR**. Mit ihrer Ausstellung übernimmt der Erzeuger die Verantwortung dafür, dass die Verpackung den Anforderungen der Verordnung genügt (Art. 39 Abs. 4 PPWR).
> - **Keine CE-Kennzeichnung:** Die PPWR sieht keine CE-Kennzeichnung für Verpackungen vor. Bringen Sie kein CE-Zeichen auf Verpackung oder Erklärung an.
> - **Adressat:** Die Erklärung wird **für die Behörden bereitgehalten** (Aufbewahrung mit der technischen Dokumentation, Vorlage auf Verlangen – Anhang VII Nr. 4; Art. 15 Abs. 10 PPWR: Vorlage binnen 10 Tagen nach behördlicher Anforderung (!) V1). Ein Anspruch von Kunden auf Herausgabe besteht nach der PPWR nicht; eine freiwillige Weitergabe im B2B ist möglich, aber keine Pflicht.
> - **Sprachregel (DE-Markt):** Nach **§ 62 VerpackDG** muss eine unterzeichnete Version nach Wahl **in deutscher oder englischer Sprache** vorgehalten werden; auf Verlangen der zuständigen Behörde ist sie ins Deutsche zu übersetzen. (!) T2: § 62 spricht vom „Hersteller" – gemeint ist nach Systematik der aussteller-verantwortliche **Erzeuger** i. S. d. Art. 39; Terminologie in Session klären. Für andere Vertriebsländer gilt Art. 39 Abs. 2 PPWR: Sprache(n) nach Vorgabe des jeweiligen Mitgliedstaats.
> - Werden für dieselbe Verpackung mehrere EU-Konformitätserklärungen nach verschiedenen Unionsrechtsakten verlangt, ist **eine einzige Erklärung** für alle betreffenden Rechtsakte auszustellen (Art. 39 Abs. 3 PPWR) – ggf. als Dossier. (!) T4: Standard-Formulierung für diesen Fall in Session freigeben.

---

## EU-Konformitätserklärung Nr. (*) {{verpackung.doc_nummer}}
<!-- [VORBEFÜLLT] doc_nummer: vom System vergebene Kennnummer der Erklärung, Fußnote (*) des Musters: „(Kennnummer der Erklärung)" -->

**1. Nr. … (eindeutige Kennung der Verpackung):**
{{verpackung.eindeutige_kennung}}
<!-- [VORBEFÜLLT] aus profil_verpackungen (z. B. interne Typ-/Artikelnummer oder GTIN).
[NUTZER-PFLICHT] Prüfen: Kennung muss die Verpackungsart eindeutig identifizieren; „alle Verpackungen des Unternehmens" ist unzulässig. Fundstelle Ziffer: Anhang VIII Nr. 1. -->

**2. Name und Anschrift des Erzeugers und gegebenenfalls des Bevollmächtigten des Erzeugers:**
{{profil.firmenname}}, {{profil.strasse}} {{profil.hausnummer}}, {{profil.plz}} {{profil.ort}}, {{profil.land}}
{{#wenn profil.bevollmaechtigter_art17_vorhanden}}
Bevollmächtigter (Art. 17 PPWR): {{profil.bevollmaechtigter_art17_name}}, {{profil.bevollmaechtigter_art17_anschrift}}
{{/wenn}}
<!-- [VORBEFÜLLT] aus profile. Fundstelle Ziffer: Anhang VIII Nr. 2.
Achtung Rollen-Terminologie (Rollen-Engine v0.91): Erzeuger = EN manufacturer (Art. 3 Abs. 1 Nr. 13) – NICHT der EPR-„Hersteller". Der Bevollmächtigte hier ist der Konformitäts-Bevollmächtigte nach Art. 17, NICHT der EHV-Bevollmächtigte nach Art. 3 Abs. 1 Nr. 20 / § 5 VerpackDG. -->

**3.** [SYSTEM] Die alleinige Verantwortung für die Ausstellung dieser Konformitätserklärung trägt der Erzeuger.
<!-- Wortlaut Anhang VIII Nr. 3 – unverändert übernehmen. -->

**4. Gegenstand der Erklärung (Kennung der Verpackung zwecks Rückverfolgbarkeit): Beschreibung der Verpackung:**
{{verpackung.bezeichnung}} – {{verpackung.typ_label}}, Material: {{verpackung.material_label}}{{#wenn verpackung.mehrweg}}, wiederverwendbare Verpackung{{/wenn}}{{#wenn verpackung.lebensmittelkontakt}}, mit Lebensmittelkontakt{{/wenn}}
[NUTZER-PFLICHT] Ergänzen Sie hier Format/Abmessungen, ggf. Chargen-/Serienbezug und weitere zur Rückverfolgbarkeit nötige Merkmale: ____________________
<!-- [VORBEFÜLLT] Grunddaten aus profil_verpackungen; Detailbeschreibung ist Nutzerpflicht. Fundstelle Ziffer: Anhang VIII Nr. 4; Rückverfolgbarkeits-Anker: Art. 15 Abs. 5 PPWR (Typen-/Chargen-/Seriennummer). -->

**5.** [SYSTEM] Der unter Nummer 4 genannte Gegenstand der Erklärung erfüllt die einschlägigen Rechtsvorschriften der Union in Bezug auf die Harmonisierung: … (Verweis auf die anderen angewandten Rechtsakte der Union).
<!-- Wortlaut Anhang VIII Nr. 5 – dies ist die EINZIGE Stelle, an der eine Erfüllungs-Zusage formuliert wird, weil der Anhang sie wörtlich vorgibt. Der Generator ergänzt darunter die Liste der einschlägigen Anforderungen (Bedingungslogik): -->

Für diese Verpackung sind zum Rechtsstand {{dokument.rechtsstand}} insbesondere folgende Anforderungen der Verordnung (EU) 2025/40 einschlägig:

- **Art. 5 Abs. 4 PPWR** – Summengrenzwert Blei, Cadmium, Quecksilber, Chrom VI (100 mg/kg). *(gilt für alle Verpackungen; Nachweis: technische Dokumentation, Art. 5 Abs. 6; Datensatz #1)*
{{#wenn verpackung.lebensmittelkontakt}}
- **Art. 5 Abs. 5 PPWR** – PFAS-Grenzwerte für Verpackungen mit Lebensmittelkontakt (25 ppb / 250 ppb / 50 ppm). *(Nachweis: technische Dokumentation, Art. 5 Abs. 6; Datensatz #2)*
{{/wenn}}
{{#wenn verpackung.mehrweg}}
- **Art. 11 Abs. 1 lit. a–i i. V. m. Anhang VI PPWR** – Anforderungen an wiederverwendbare Verpackungen. *(Datensatz #3)*
{{/wenn}}
- **Art. 6 Abs. 1 PPWR** – Recyclingfähigkeit (Grundpflicht). Im Übergang bis zum Geltungsbeginn der Design-for-Recycling-Rechtsakte wird die Erfüllung nach dem Maßstab der bisherigen wesentlichen Anforderungen (RL 94/62/EG, EN 13430:2004) dokumentiert; eine Konformitätsbewertungspflicht für die Recyclingfähigkeit besteht bis dahin nicht *(Auslegung der EU-Kommission, rechtlich nicht bindend – Leitfaden C(2026) 3702, Abschn. 6; Datensatz #11)*. (!) T3: Ob Art. 6 Abs. 1 in der Erklärung bereits gelistet wird oder bis zu den DfR-Rechtsakten entfällt, in Session entscheiden.
{{#wenn verpackung.weitere_rechtsakte_vorhanden}}
- Weitere angewandte Rechtsakte der Union (z. B. VO (EG) Nr. 1935/2004 bei Lebensmittelkontaktmaterial): [NUTZER-PFLICHT] ____________________
{{/wenn}}
<!-- Bedingungslogik-Referenz: Felder lebensmittelkontakt, mehrweg aus profil_verpackungen; Wizard F13 (LMK) und F05 (Typ).
Nicht gelistet, weil noch nicht anwendbar (Datensatz #10): Art. 6 Abs. 2–5 (DfR-Klassen), Art. 7 (EU-Rezyklatquoten), Art. 10 (Minimierung, ab 2030 – bis dahin Alt-Anforderungen), Art. 12 (harmonisierte Label). Diese Ziffer NICHT um künftige Pflichten erweitern. -->

**6. Angabe der einschlägigen harmonisierten Normen oder gemeinsamen Spezifikationen, die zugrunde gelegt wurden, oder Angabe anderer technischer Spezifikationen, für die die Konformität erklärt wird:**
[NUTZER-PFLICHT] z. B. EN 13428:2004, EN 13430:2004, EN 13429:2004 (Mehrweg), Prüfnormen der Materialanalytik: ____________________
<!-- Fundstelle Ziffer: Anhang VIII Nr. 6. Der Generator schlägt je nach Typ/Material eine Normen-Auswahlliste vor (aus der Wissensbasis), setzt aber nichts automatisch ein – die Auswahl ist Nutzerverantwortung. Hinweis Wissensbasis: Zum Rechtsstand liegen noch keine unter der PPWR harmonisierten Normen mit Konformitätsvermutung vor (Art. 36 PPWR; vgl. Datensatz #11/#17). -->

**7.** [SYSTEM] Die notifizierte Stelle … (Name, Anschrift, Kennnummer) … hat, falls anwendbar, … (Beschreibung ihrer Maßnahme) durchgeführt und die folgende(n) Bescheinigung(en) ausgestellt: … (Einzelheiten, einschließlich des Datums der Bescheinigung(en), und gegebenenfalls Angaben zur Dauer und zu den Gültigkeitsbedingungen).
Voreintrag des Generators: **Entfällt – Konformitätsbewertung nach Anhang VII Modul A (interne Fertigungskontrolle) ohne Beteiligung einer notifizierten Stelle.**
<!-- Wortlaut Anhang VIII Nr. 7 bleibt stehen („falls anwendbar"); Voreintrag [VORBEFÜLLT], da Art. 38 i. V. m. Anhang VII nur Modul A vorsieht (Datensatz #4). [NUTZER-PFLICHT] nur ändern, falls freiwillig eine Stelle beauftragt wurde. -->

**8. Zusätzliche Angaben:**
{{#wenn verpackung.zusatzangaben}}{{verpackung.zusatzangaben}}{{/wenn}}
[NUTZER-PFLICHT] optional (z. B. interne Dokumenten-Referenz der technischen Dokumentation: {{verpackung.techdoku_referenz}})

Unterzeichnet für und im Namen von: {{profil.firmenname}}
(Ort und Datum der Ausstellung): {{profil.ort}}, [NUTZER-PFLICHT: Datum] ____________________
(Name, Funktion) (Unterschrift): {{profil.zeichnungsberechtigter_name}}, {{profil.zeichnungsberechtigter_funktion}} ____________________
<!-- [VORBEFÜLLT] Name/Funktion aus profile; Datum und Unterschrift zwingend Nutzer. Fundstelle: Anhang VIII Nr. 8 inkl. Signaturblock.
(!) T1: Anhang VIII enthält im ABl. die Ziffern 1–8 (Signaturblock innerhalb Nr. 8). Datensatz #6 v0.2 spricht von „10 Pflichtelementen" – in Session korrigieren/klären (mögliche Verwechslung mit Zählweise inkl. Kennnummer/Fußnote). -->

---

*Dokument erzeugt mit PPWR Radar – by packaging journal · Version {{dokument.version}} · Rechtsstand {{dokument.rechtsstand}}*
*Dieses Dokument ist eine strukturierte Arbeitsgrundlage, keine Rechtsberatung; die Verantwortung für die Angaben liegt beim Verwender.*
