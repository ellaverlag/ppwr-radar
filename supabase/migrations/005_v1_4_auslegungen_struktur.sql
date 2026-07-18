-- v1.4: auslegungen an das Chat-4-Paket angleichen (bereits am 17.07.2026 direkt eingespielt)

alter table auslegungen
  add column if not exists nr int unique,
  add column if not exists code text,
  add column if not exists flag text,
  add column if not exists ausspielen boolean not null default true,
  add column if not exists bezug_nr int[];

alter table auslegungen drop column if exists bezug_anforderungen;

drop policy if exists "freigegebene auslegungen" on auslegungen;
create policy "freigegebene auslegungen" on auslegungen
  for select to authenticated
  using (review_status = 'cattwyk_freigegeben' and ausspielen);
