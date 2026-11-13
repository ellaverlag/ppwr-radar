-- ============================================================
-- PPWR Radar – Migration v2.7: Eingaben für den EUDR-Betroffenheits-Check
-- (EUDR-Strang Schritt 2; Regeln E1–E9 aus Migration 020 /
-- content/delta/2026-11-13_EUDR_Strang.sql)
--
-- verpackungen: vier neue Eingaben je Verpackung, alle optional (null =
-- nicht beantwortet; die Engine leitet Defaults ab oder fragt nach):
--   eudr_verwendung  nur_genutzt | leer_verkauft
--   eudr_bezug       import_drittland | selbst_hergestellt_aus_eu_vormaterial
--                    | fertig_gekauft_eu   (nur bei leer_verkauft relevant)
--   eudr_rezyklat    keins | teilweise | vollstaendig | unbekannt
--   eudr_erzeugnis   neu | gebraucht_oder_mehrweg_nach_erstnutzung
-- profile: groesse_2024 (Stichtag 31.12.2024, Art. 38 Abs. 3 VO (EU)
--   2023/1115 i. d. F. VO (EU) 2025/2650; Schwellen RL 2013/34/EU i. d. F.
--   Del. RL (EU) 2023/2775)
-- verpackung_ergebnisse: eudr (jsonb) – Ergebnis des Engine-Strangs
--   evaluiereEudr je Verpackung (null bei Ergebnissen vor v2.7)
-- ============================================================

alter table verpackungen
  add column if not exists eudr_verwendung text
    check (eudr_verwendung in ('nur_genutzt', 'leer_verkauft')),
  add column if not exists eudr_bezug text
    check (eudr_bezug in ('import_drittland', 'selbst_hergestellt_aus_eu_vormaterial', 'fertig_gekauft_eu')),
  add column if not exists eudr_rezyklat text
    check (eudr_rezyklat in ('keins', 'teilweise', 'vollstaendig', 'unbekannt')),
  add column if not exists eudr_erzeugnis text
    check (eudr_erzeugnis in ('neu', 'gebraucht_oder_mehrweg_nach_erstnutzung'));

alter table profile
  add column if not exists groesse_2024 text
    check (groesse_2024 in ('kleinst', 'klein', 'mittel', 'gross'));

alter table verpackung_ergebnisse
  add column if not exists eudr jsonb;
