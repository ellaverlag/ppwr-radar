-- ============================================================
-- PPWR Radar – Migration v2.6: EUDR-Strang (Betroffenheits-Check zur
-- EU-Entwaldungsverordnung, VO (EU) 2023/1115 i. d. F. VO (EU) 2025/2650
-- und Del. VO (EU) 2026/2102)
--
-- Inhalte (Anforderungen 41–44, Praxisfragen E01–E14, Regeln E1–E9,
-- Rollen eudr_*, Glossar L68–L79) per INSERT, siehe
-- content/delta/2026-11-13_EUDR_Strang.sql. Alle als Entwurf.
-- ============================================================
alter type kategorie add value if not exists 'eudr';
alter table rollen_regeln drop constraint rollen_regeln_block_check;
alter table rollen_regeln add constraint rollen_regeln_block_check
  check (block in ('erzeuger','hersteller','weitere','output','verpackung','eudr'));
alter table rollen_definitionen drop constraint rollen_definitionen_typ_check;
alter table rollen_definitionen add constraint rollen_definitionen_typ_check
  check (typ in ('kernrolle','sammelbegriff','hilfsbegriff','eudr'));
