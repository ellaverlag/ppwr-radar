-- v1.7 – Produktlinien-Verwaltung („Meine Verpackungen")
--
-- profil_verpackungen.status: Linien mit erzeugten Dokumenten werden nicht
-- gelöscht, sondern stillgelegt (raus aus Generator-Auswahl und
-- Status-Analyse; Dokumente bleiben einsehbar).
--
-- rollen_ergebnisse.aktuell: Neuberechnung einer Linie überschreibt das
-- alte Ergebnis nicht, sondern markiert es als überholt (aktuell = false)
-- und legt eine neue Zeile an – bestehende Dokumente behalten ihren
-- Erstellungs-Bezug.

alter table profil_verpackungen
  add column if not exists status text not null default 'aktiv';

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'chk_verpackung_status'
  ) then
    alter table profil_verpackungen add constraint chk_verpackung_status
      check (status in ('aktiv', 'stillgelegt'));
  end if;
end $$;

alter table rollen_ergebnisse
  add column if not exists aktuell boolean not null default true;

create index if not exists rollen_ergebnisse_aktuell_idx
  on rollen_ergebnisse (profil_id, produktlinie) where aktuell;
