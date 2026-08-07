-- v1.6 – Dokumente: Online-Ausfüllen und revisionssichere Nummernvergabe
--
-- nutzer_eingaben: Antworten des Nutzers auf die NUTZER-PFLICHT-Felder des
-- Templates (jsonb, Schlüssel = Feldkatalog in lib/dokumente/nutzer-felder.ts).
--
-- doc_nummern: eigener Zähler je Nutzer/Kürzel/Jahr. Die Vergabe basiert
-- damit auf der je höchsten vergebenen Nummer – gelöschte Dokumente geben
-- ihre Nummer nie wieder frei (Revisionslogik).

alter table dokumente add column nutzer_eingaben jsonb;

create table doc_nummern (
  user_id   uuid not null references auth.users(id) on delete cascade,
  kuerzel   text not null,
  jahr      integer not null,
  letzte_nr integer not null default 0,
  primary key (user_id, kuerzel, jahr)
);

alter table doc_nummern enable row level security;

create policy "eigene doc_nummern lesen" on doc_nummern
  for select to authenticated using (user_id = auth.uid());

create policy "eigene doc_nummern anlegen" on doc_nummern
  for insert to authenticated with check (user_id = auth.uid());

create policy "eigene doc_nummern aendern" on doc_nummern
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
