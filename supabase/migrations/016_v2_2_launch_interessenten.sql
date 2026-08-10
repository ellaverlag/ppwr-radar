-- v2.2 – Coming-Soon: Benachrichtigungsliste zum Start
--
-- Bewusst ohne Policies: anon/authenticated haben keinen Zugriff, die
-- Eintragung läuft serverseitig über die Service-Role (Landing-Action).

create table launch_interessenten (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  created_at timestamptz not null default now()
);

alter table launch_interessenten enable row level security;
