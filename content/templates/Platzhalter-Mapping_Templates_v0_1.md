# PPWR Radar – Platzhalter-Mapping Generator-Templates v0.1 ↔ Supabase-Schema

**Stand: 17.07.2026 · Bezug: Templates v0.1 (Chat 3), Schema nach Migration v1.3**
*Ergebnis des Abgleichs aller 53 Platzhalter und 17 Bedingungsfelder gegen die Datenbank. Alle Templates können unverändert bleiben – fehlende Felder wurden per Migration v1.3 ergänzt; der Rest wird zur Laufzeit berechnet.*

## A. Direkte Spalten (nach Migration v1.3 vorhanden)

| Platzhalter | Tabelle.Spalte | Quelle |
|---|---|---|
| profil.firmenname | profile.firmenname | Wizard/Profil |
| profil.strasse / hausnummer / plz / ort / land | profile.* | **neu in v1.3** – Onboarding erweitern |
| profil.lucid_nummer | profile.lucid_nummer | **neu in v1.3** |
| profil.war_verpackg_registriert (Bedingung) | profile.war_verpackg_registriert | **neu in v1.3** – Wizard-Zusatzfrage |
| profil.zeichnungsberechtigter_name / _funktion | profile.* | **neu in v1.3** |
| profil.bevollmaechtigter_art17_name / _anschrift | profile.* | **neu in v1.3** (optional) |
| verpackung.bezeichnung | profil_verpackungen.bezeichnung | vorhanden |
| verpackung.produktlinie | profil_verpackungen.produktlinie | **neu in v1.3** (Wizard F04) |
| verpackung.eindeutige_kennung | profil_verpackungen.eindeutige_kennung | **neu in v1.3** |
| verpackung.fuellgut / zusatzangaben / techdoku_referenz | profil_verpackungen.* | **neu in v1.3** |
| verpackung.weitere_rechtsakte (Bedingung: _vorhanden) | profil_verpackungen.weitere_rechtsakte | **neu in v1.3**; Bedingung = Feld nicht leer |
| verpackung.lebensmittelkontakt / mehrweg (Bedingungen) | profil_verpackungen.* (boolean) | vorhanden |

## B. Berechnete Felder (Renderer-Funktionen, keine Spalten)

| Platzhalter | Berechnung |
|---|---|
| verpackung.typ_label / material_label / lebensmittelkontakt_label / mehrweg_label | Label-Mapping aus verpackungstyp, materialien[], booleans |
| verpackung.doc_nummer | bei Dokument-Erzeugung generiert (Muster `KE-{JJJJ}-{lfd}`), gespeichert in dokumente.doc_nummer (**neu in v1.3**) |
| verpackung.lieferant_1 | lieferanten[0] aus profil_verpackungen.lieferanten (jsonb, **neu in v1.3**) |
| rollen.rollen_set_label, rollen.ist_*_label, rollen.ist_* (Bedingungen) | aus rollen_ergebnisse.rollen_set (jsonb) |
| rollen.herleitung_*, rollen.fundstelle_* | aus rollen_ergebnisse.herleitung (jsonb: regel_id → erlaeuterung, fundstellen) |
| rollen.braucht_ehv_bevollmaechtigten(_label) | Regel C6/B3 im rollen_set/herleitung |
| rollen.hat_leitfaden_bezug (Bedingung) | true, wenn eine Herleitungs-Fundstelle „Leitfaden" enthält |
| rollen.risiko_hoch (Bedingung) | Eskalations-Flag der Engine (z. B. F09 = „unklar" oder (!)-Regel ausgelöst) |
| rollen.gap_liste | Ergebnis der Status-Analyse (Säule A) |
| dokument.version / rechtsstand / erstellt_am | aus dokumente-Datensatz (version, rechtsstand_bei_erstellung, created_at) |

## C. Konfiguration (nach Cattwyk-Freigabe befüllen)

| Platzhalter | Ablage |
|---|---|
| cattwyk.erstgespraech_hinweis | app_config, key `cattwyk_erstgespraech_hinweis` (**Tabelle neu in v1.3**; Wortlaut kommt aus der Session, bis dahin leer → Renderer lässt Block weg) |

## D. Konsequenzen für andere Arbeitspakete

1. **Onboarding-Wizard (App-Grundgerüst):** erhebt zusätzlich Anschrift, Zeichnungsberechtigten, LUCID-Nummer/Alt-Registrierung (ja/nein), je Verpackung Kennung + Produktlinie + optional Füllgut/Lieferanten. Wizard-Fragenkatalog (F01–F13) bleibt unverändert; das sind Stammdaten-Felder, keine Rollen-Fragen.
2. **Template-Import:** Tabelle `generator_templates` steht (versioniert, RLS nach Freigabe-Prinzip). Die v0.1-Entwürfe werden **erst nach der Cattwyk-Session** als freigegebene Fassung importiert – vorher wären es tote Drafts, die nach der Session ohnehin ersetzt würden. Bis dahin: Git-Repo/Review-Dokumente sind die Quelle.
3. **Renderer (App-Arbeitspaket):** Mustache-Syntax `{{feld}}` + `{{#wenn}}/{{#wenn nicht}}`-Blöcke; Funktionstabelle aus Abschnitt B implementieren.
