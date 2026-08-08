-- v2.0 – Assistant-Verlauf
--
-- Jede beantwortete Frage wird automatisch gespeichert (Schreiben nur über
-- die Service Role der Server Action – kein „vergessen zu sichern“).
-- Lesen per own-row-RLS über den Session-Client; das Merken-Flag und alle
-- übrigen Änderungen laufen ebenfalls server-seitig (keine Update-Policy,
-- damit Nutzer gespeicherte Antworten nicht per API umschreiben können).
--
-- produktlinie_kontext: gewählter Kontext des Umschalters (NULL = alle
-- Produktlinien) – zeigt später, worauf sich eine Antwort bezog.

create table if not exists assistant_verlauf (
  id uuid primary key default gen_random_uuid(),
  profil_id uuid not null references profile(id) on delete cascade,
  frage text not null,
  antwort_markdown text not null,
  erklaertiefe text not null default 'fachlich'
    check (erklaertiefe in ('einfach', 'fachlich', 'rechtstext')),
  quellen jsonb not null default '[]'::jsonb,
  rechtsstand text,
  preview boolean not null default false,
  gemerkt boolean not null default false,
  produktlinie_kontext text,
  created_at timestamptz not null default now()
);

create index if not exists assistant_verlauf_profil_idx
  on assistant_verlauf (profil_id, created_at desc);

alter table assistant_verlauf enable row level security;

create policy "eigener assistant_verlauf lesen" on assistant_verlauf
  for select to authenticated
  using (profil_id in (select id from profile where user_id = auth.uid()));
