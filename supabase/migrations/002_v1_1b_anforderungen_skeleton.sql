-- ============================================================
-- PPWR Radar – Migration v1.1b + Skeleton-Import (final)\n-- Fix 2: kurzerklaerung darf im Entwurfsstadium leer sein; Freigabe ohne\n-- Texte wird stattdessen per Check-Constraint blockiert.
-- Fix: leere gilt_ab-Werte werden als NULL importiert
-- (betrifft Datensätze ohne festes Datum, z. B. 'Rechtsakt ausstehend').
-- Falls Abschnitt 1 (Schema-Anpassungen) beim ersten Versuch schon
-- durchgelaufen ist: kein Problem – die Statements sind wiederholbar,
-- nur das rename schlägt dann fehl. In dem Fall Abschnitt 1 überspringen
-- und nur ab Abschnitt 2 ausführen.
-- ============================================================

-- ---------- 0. Constraint-Fix ----------
-- Schema v1.0 verlangte kurzerklaerung NOT NULL. Der Skeleton-Import kommt
-- aber bewusst ohne Langtexte (Teil F Nr. 4: Texte folgen nach Freigabe).
-- Daher: NOT NULL aufheben und stattdessen erzwingen, dass ein Datensatz
-- nur DANN freigegeben werden kann, wenn die Kurzerklärung vorliegt.
alter table anforderungen alter column kurzerklaerung drop not null;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'chk_freigabe_braucht_text') then
    alter table anforderungen add constraint chk_freigabe_braucht_text
      check (review_status <> 'cattwyk_freigegeben'
             or (kurzerklaerung is not null and handlungsanweisung is not null));
  end if;
end $$;

-- ---------- 1. Schema-Anpassungen ----------
do $$ begin
  if exists (select 1 from information_schema.columns
             where table_name = 'anforderungen' and column_name = 'nummer') then
    alter table anforderungen rename column nummer to nr;
  end if;
end $$;

alter table anforderungen add column if not exists verpackdg_layer text;
alter table anforderungen drop column if exists doppel_layer;
alter table anforderungen add column if not exists ausspielen boolean not null default true;

drop policy if exists "freigegebene anforderungen" on anforderungen;
create policy "freigegebene anforderungen" on anforderungen
  for select to authenticated
  using (review_status = 'cattwyk_freigegeben' and ausspielen = true);

-- ---------- 2. Skeleton-Import: 40 Anforderungs-Datensätze ----------
insert into anforderungen
  (nr, titel, kategorie, rechtsquelle, gilt_ab, gilt_status,
   betrifft_rollen, betrifft_verpackungstypen, betrifft_materialien,
   lebensmittelkontakt, review_status, rechtsstand, version, ausspielen)
values
(1, 'Summengrenzwert Schwermetalle (100 mg/kg)', 'stoffrecht', 'Art. 5 Abs. 4 PPWR; §§ 14–18 VerpackDG', '2026-08-12', 'in_kraft', '{erzeuger,importeur}'::text[], '{alle}'::text[], '{alle}'::text[], 'egal', 'entwurf', '2026-07-17', 2, true),
(2, 'PFAS-Grenzwerte bei Lebensmittelkontakt', 'stoffrecht', 'Art. 5 Abs. 5 PPWR', '2026-08-12', 'in_kraft', '{erzeuger,importeur}'::text[], '{alle}'::text[], '{alle}'::text[], 'nur_lmk', 'entwurf', '2026-07-17', 2, true),
(3, 'Anforderungen an wiederverwendbare Verpackungen', 'mehrweg', 'Art. 11 Abs. 1 i. V. m. Anhang VI PPWR; Art. 15 Abs. 9', '2026-08-12', 'in_kraft', '{erzeuger,hersteller}'::text[], '{mehrweg}'::text[], '{alle}'::text[], 'egal', 'entwurf', '2026-07-17', 2, true),
(4, 'Konformitätsbewertung (Pflichtverfahren je Verpackungstyp)', 'konformitaet', 'Art. 38 PPWR i. V. m. Art. 15 Abs. 1/2', '2026-08-12', 'in_kraft', '{erzeuger}'::text[], '{alle}'::text[], '{alle}'::text[], 'egal', 'entwurf', '2026-07-17', 2, true),
(5, 'Technische Dokumentation', 'konformitaet', 'Anhang VII PPWR; Art. 15 Abs. 8', '2026-08-12', 'in_kraft', '{erzeuger}'::text[], '{alle}'::text[], '{alle}'::text[], 'egal', 'entwurf', '2026-07-17', 2, true),
(6, 'EU-Konformitätserklärung', 'konformitaet', 'Art. 39 i. V. m. Anhang VIII PPWR; § 62 VerpackDG', '2026-08-12', 'in_kraft', '{erzeuger,importeur}'::text[], '{alle}'::text[], '{alle}'::text[], 'egal', 'entwurf', '2026-07-17', 2, true),
(7, 'Identifikations- und Kontaktkennzeichnung', 'kennzeichnung', 'Art. 15 Abs. 5/6 PPWR; Art. 18 Abs. 3', '2026-08-12', 'in_kraft', '{erzeuger,importeur}'::text[], '{alle}'::text[], '{alle}'::text[], 'egal', 'entwurf', '2026-07-17', 2, true),
(8, 'Rollenzuordnung & erweiterte Herstellerpflichten', 'rollen_epr', 'Art. 3 Nr. 13/15 & Art. 21 PPWR; §§ 6/7/13 VerpackDG', '2026-08-12', 'in_kraft', '{erzeuger,hersteller,importeur,vertreiber,fulfillment}'::text[], '{alle}'::text[], '{alle}'::text[], 'egal', 'entwurf', '2026-07-17', 2, true),
(9, 'Bevollmächtigter für die EHV (grenzüberschreitender Direktvertrieb)', 'rollen_epr', 'Art. 45 Abs. 3 & Art. 3 Nr. 20 PPWR; § 5 Abs. 2–6 VerpackDG', '2026-08-12', 'in_kraft', '{hersteller,bevollmaechtigter_ehv}'::text[], '{alle}'::text[], '{alle}'::text[], 'egal', 'entwurf', '2026-07-17', 2, true),
(10, 'Was JETZT NICHT gilt (Entwarnung mit Frist)', 'sonstiges', 'Art. 6/7/10/12/24/25/29 PPWR', null, 'kuenftig', '{erzeuger,hersteller,importeur,vertreiber,endvertreiber}'::text[], '{alle}'::text[], '{alle}'::text[], 'egal', 'entwurf', '2026-07-17', 2, true),
(11, 'Recyclingfähigkeit: Grundpflicht Art. 6 Abs. 1 (Übergangsverständnis)', 'konformitaet', 'Art. 6 Abs. 1/2 PPWR; Art. 70; EN 13430', '2026-08-12', 'in_kraft', '{erzeuger,importeur}'::text[], '{alle}'::text[], '{alle}'::text[], 'egal', 'entwurf', '2026-07-17', 2, true),
(12, 'Design-for-Recycling-Einstufung (Klassen A/B/C)', 'konformitaet', 'Art. 6 Abs. 4 PPWR (delegierte Rechtsakte bis 01.01.2028)', '2030-01-01', 'rechtsakt_ausstehend', '{erzeuger,importeur}'::text[], '{alle}'::text[], '{alle}'::text[], 'egal', 'entwurf', '2026-07-17', 2, true),
(13, 'Recycled at scale', 'konformitaet', 'Art. 6 Abs. 2 lit. b & Abs. 5 PPWR', '2035-01-01', 'rechtsakt_ausstehend', '{erzeuger,importeur}'::text[], '{alle}'::text[], '{alle}'::text[], 'egal', 'entwurf', '2026-07-17', 2, true),
(14, 'Mindestrezyklatanteile Kunststoff (EU)', 'stoffrecht', 'Art. 7 PPWR', '2030-01-01', 'rechtsakt_ausstehend', '{erzeuger,importeur}'::text[], '{alle}'::text[], '{kunststoff}'::text[], 'egal', 'entwurf', '2026-07-17', 2, true),
(15, 'Rezyklatanteil Einweggetränkeflaschen (DE)', 'stoffrecht', '§ 45 VerpackDG', '2026-08-12', 'in_kraft', '{hersteller}'::text[], '{verkauf}'::text[], '{kunststoff}'::text[], 'egal', 'entwurf', '2026-07-17', 2, true),
(16, 'Kompostierbare Verpackungen', 'stoffrecht', 'Art. 9 PPWR', '2028-02-12', 'kuenftig', '{erzeuger,importeur}'::text[], '{verkauf}'::text[], '{kunststoff,papier_karton}'::text[], 'egal', 'entwurf', '2026-07-17', 2, true),
(17, 'Verpackungsminimierung', 'konformitaet', 'Art. 10 PPWR; § 12 Abs. 3 VerpackDG; EN 13428', '2030-01-01', 'kuenftig', '{erzeuger,importeur}'::text[], '{alle}'::text[], '{alle}'::text[], 'egal', 'entwurf', '2026-07-17', 2, true),
(18, 'Leerraumquote 50 %', 'konformitaet', 'Art. 24 PPWR (Rechtsakt bis 12.02.2028)', '2030-01-01', 'rechtsakt_ausstehend', '{hersteller,vertreiber,fulfillment}'::text[], '{umverpackung,transport,ecommerce_versand}'::text[], '{alle}'::text[], 'egal', 'entwurf', '2026-07-17', 2, true),
(19, 'Harmonisiertes Sortierlabel', 'kennzeichnung', 'Art. 12 Abs. 1/6 PPWR; § 4 VerpackDG', '2028-08-12', 'rechtsakt_ausstehend', '{erzeuger,importeur}'::text[], '{alle}'::text[], '{alle}'::text[], 'egal', 'entwurf', '2026-07-17', 2, true),
(20, 'Mehrweg-Kennzeichnung + QR-Datenträger', 'kennzeichnung', 'Art. 12 Abs. 2/6 PPWR', '2029-02-12', 'rechtsakt_ausstehend', '{erzeuger,hersteller}'::text[], '{mehrweg}'::text[], '{alle}'::text[], 'egal', 'entwurf', '2026-07-17', 2, true),
(21, 'Freiwillige Labels Rezyklat-/Bioanteil', 'kennzeichnung', 'Art. 12 Abs. 4 PPWR', '2028-08-12', 'rechtsakt_ausstehend', '{erzeuger,hersteller}'::text[], '{alle}'::text[], '{alle}'::text[], 'egal', 'entwurf', '2026-07-17', 2, true),
(22, 'EPR-Kennzeichnung nur digital', 'kennzeichnung', 'Art. 12 Abs. 9 PPWR', '2026-08-12', 'in_kraft', '{hersteller}'::text[], '{alle}'::text[], '{alle}'::text[], 'egal', 'entwurf', '2026-07-17', 2, false),
(23, 'Umweltaussagen auf Verpackungen (Green Claims)', 'kennzeichnung', 'Art. 14 & Art. 12 Abs. 8 PPWR', '2026-08-12', 'in_kraft', '{erzeuger,hersteller,vertreiber}'::text[], '{alle}'::text[], '{alle}'::text[], 'egal', 'entwurf', '2026-07-17', 2, true),
(24, 'Verpackungsverbote ab 2030 (Anhang V)', 'verbote', 'Art. 25 i. V. m. Anhang V PPWR', '2030-01-01', 'kuenftig', '{erzeuger,hersteller,importeur,vertreiber,endvertreiber}'::text[], '{verkauf,umverpackung}'::text[], '{kunststoff,verbund}'::text[], 'egal', 'entwurf', '2026-07-17', 2, true),
(25, 'Leichte Kunststofftragetaschen (DE-Verbot)', 'verbote', '§ 12 Abs. 1 VerpackDG', '2026-08-12', 'in_kraft', '{endvertreiber,vertreiber}'::text[], '{verkauf}'::text[], '{kunststoff}'::text[], 'egal', 'entwurf', '2026-07-17', 2, true),
(26, 'SUPD-Schnittstelle: EPS-/XPS-Verbote & EWKVerbotsV', 'verbote', 'EWKVerbotsV; Art. 67 Abs. 5 PPWR (XPS ab 2030)', '2026-08-12', 'in_kraft', '{erzeuger,hersteller,importeur}'::text[], '{verkauf}'::text[], '{kunststoff}'::text[], 'egal', 'entwurf', '2026-07-17', 2, true),
(27, 'Mehrwegquoten Transportverpackung 2030', 'mehrweg', 'Art. 29 Abs. 1–4 PPWR', '2030-01-01', 'kuenftig', '{hersteller,importeur,vertreiber,fulfillment}'::text[], '{transport,umverpackung,ecommerce_versand}'::text[], '{alle}'::text[], 'egal', 'entwurf', '2026-07-17', 2, true),
(28, 'Mehrwegquote Getränke (10 % ab 2030)', 'mehrweg', 'Art. 29 Abs. 6 PPWR', '2030-01-01', 'kuenftig', '{endvertreiber}'::text[], '{verkauf,mehrweg}'::text[], '{alle}'::text[], 'egal', 'entwurf', '2026-07-17', 2, true),
(29, 'Take-away: Mehrwegangebotspflicht (DE) & EU-Ziel', 'mehrweg', '§§ 60/61 VerpackDG; Art. 32/33 PPWR', '2026-08-12', 'in_kraft', '{endvertreiber}'::text[], '{verkauf}'::text[], '{kunststoff}'::text[], 'nur_lmk', 'entwurf', '2026-07-17', 2, true),
(30, 'Wiederverwendungssysteme & Wiederbefüllungs-Info', 'mehrweg', 'Art. 27/28 i. V. m. Anhang VI PPWR', '2026-08-12', 'in_kraft', '{hersteller,endvertreiber}'::text[], '{mehrweg}'::text[], '{alle}'::text[], 'egal', 'entwurf', '2026-07-17', 2, true),
(31, 'Registrierung im Herstellerregister (LUCID)', 'rollen_epr', '§ 6 VerpackDG; Art. 44 PPWR', '2026-08-12', 'in_kraft', '{hersteller}'::text[], '{alle}'::text[], '{alle}'::text[], 'egal', 'entwurf', '2026-07-17', 2, true),
(32, 'Systembeteiligungspflicht', 'rollen_epr', '§ 7 VerpackDG', '2026-08-12', 'in_kraft', '{hersteller}'::text[], '{verkauf,umverpackung,ecommerce_versand}'::text[], '{alle}'::text[], 'egal', 'entwurf', '2026-07-17', 2, true),
(33, 'Datenmeldungen & Vollständigkeitserklärung', 'rollen_epr', '§§ 9/10 VerpackDG', '2026-08-12', 'in_kraft', '{hersteller}'::text[], '{alle}'::text[], '{alle}'::text[], 'egal', 'entwurf', '2026-07-17', 2, true),
(34, 'Rücknahme & Verwertung nicht systembeteiligungspflichtiger Verpackungen', 'rollen_epr', '§§ 39–43 & § 19 VerpackDG', '2026-08-12', 'in_kraft', '{hersteller,vertreiber,endvertreiber}'::text[], '{transport,umverpackung}'::text[], '{alle}'::text[], 'egal', 'entwurf', '2026-07-17', 2, true),
(35, 'Ökomodulation der Beteiligungsentgelte', 'rollen_epr', '§§ 26/26a VerpackDG', '2026-08-12', 'in_kraft', '{hersteller}'::text[], '{verkauf,umverpackung}'::text[], '{alle}'::text[], 'egal', 'entwurf', '2026-07-17', 2, true),
(36, 'Pfandpflicht Einweggetränke & EINWEG/MEHRWEG-Hinweise', 'rollen_epr', '§§ 46/47 VerpackDG; Art. 50 PPWR', '2026-08-12', 'in_kraft', '{hersteller,vertreiber,endvertreiber}'::text[], '{verkauf}'::text[], '{kunststoff,metall,glas}'::text[], 'egal', 'entwurf', '2026-07-17', 2, true),
(37, 'Importeurspflichten', 'konformitaet', 'Art. 18 PPWR', '2026-08-12', 'in_kraft', '{importeur}'::text[], '{alle}'::text[], '{alle}'::text[], 'egal', 'entwurf', '2026-07-17', 2, true),
(38, 'Vertreiber-Sorgfaltspflichten', 'konformitaet', 'Art. 19 PPWR; Art. 44', '2026-08-12', 'in_kraft', '{vertreiber,endvertreiber}'::text[], '{alle}'::text[], '{alle}'::text[], 'egal', 'entwurf', '2026-07-17', 2, true),
(39, 'Fulfillment-Dienstleister', 'rollen_epr', 'Art. 20 PPWR; § 13 Abs. 4 VerpackDG', '2026-08-12', 'in_kraft', '{fulfillment,hersteller}'::text[], '{alle}'::text[], '{alle}'::text[], 'egal', 'entwurf', '2026-07-17', 2, true),
(40, 'Lieferanten-Informationspflichten', 'konformitaet', 'Art. 16 Abs. 1 PPWR', '2026-08-12', 'in_kraft', '{lieferant}'::text[], '{alle}'::text[], '{alle}'::text[], 'egal', 'entwurf', '2026-07-17', 2, true)
on conflict (nr) do nothing;

-- ---------- 3. Kontrolle ----------
-- Erwartung: gesamt=40, ausspielbar=39, im_entwurf=40, ohne_datum=1
select count(*) as gesamt,
       count(*) filter (where ausspielen) as ausspielbar,
       count(*) filter (where review_status = 'entwurf') as im_entwurf,
       count(*) filter (where gilt_ab is null) as ohne_datum
from anforderungen;
