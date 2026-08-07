-- v1.5 – Status-Analyse: Bearbeitungsstatus je zutreffender Anforderung
--
-- Nutzer verwalten pro Profil und Anforderung (anforderungen.nr), wie weit
-- die Umsetzung ist. Die Zutreffens-Logik selbst liegt in der Anwendung
-- (lib/status-analyse.ts); hier liegt nur der Bearbeitungsstand.

create type bearbeitungsstatus as enum ('offen', 'in_bearbeitung', 'erledigt');

create table anforderungs_status (
  id             uuid primary key default gen_random_uuid(),
  profil_id      uuid not null references profile(id) on delete cascade,
  anforderung_nr integer not null,
  status         bearbeitungsstatus not null default 'offen',
  notiz          text,
  updated_at     timestamptz not null default now(),
  unique (profil_id, anforderung_nr)
);

alter table anforderungs_status enable row level security;

-- Own-row-Zugriff wie bei rollen_ergebnisse: Zuordnung über das eigene Profil
create policy "eigener anforderungs_status lesen" on anforderungs_status
  for select to authenticated
  using (profil_id in (select id from profile where user_id = auth.uid()));

create policy "eigener anforderungs_status anlegen" on anforderungs_status
  for insert to authenticated
  with check (profil_id in (select id from profile where user_id = auth.uid()));

create policy "eigener anforderungs_status aendern" on anforderungs_status
  for update to authenticated
  using (profil_id in (select id from profile where user_id = auth.uid()))
  with check (profil_id in (select id from profile where user_id = auth.uid()));

create policy "eigener anforderungs_status loeschen" on anforderungs_status
  for delete to authenticated
  using (profil_id in (select id from profile where user_id = auth.uid()));
