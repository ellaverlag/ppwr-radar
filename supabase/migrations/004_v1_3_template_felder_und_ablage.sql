-- v1.3: Schema-Erweiterungen aus dem Platzhalter-Abgleich der Generator-Templates v0.1
-- plus versionierte Template-Ablage (bereits am 17.07.2026 direkt eingespielt)

alter table profile
  add column if not exists strasse text,
  add column if not exists hausnummer text,
  add column if not exists plz text,
  add column if not exists ort text,
  add column if not exists land text default 'Deutschland',
  add column if not exists sitz text,
  add column if not exists lucid_nummer text,
  add column if not exists war_verpackg_registriert boolean,
  add column if not exists zeichnungsberechtigter_name text,
  add column if not exists zeichnungsberechtigter_funktion text,
  add column if not exists bevollmaechtigter_art17_name text,
  add column if not exists bevollmaechtigter_art17_anschrift text;

alter table profil_verpackungen
  add column if not exists produktlinie text,
  add column if not exists eindeutige_kennung text,
  add column if not exists fuellgut text,
  add column if not exists zusatzangaben text,
  add column if not exists techdoku_referenz text,
  add column if not exists weitere_rechtsakte text,
  add column if not exists lieferanten jsonb;

alter table dokumente add column if not exists doc_nummer text;

create table if not exists app_config (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);
alter table app_config enable row level security;
create policy "config lesen" on app_config for select to authenticated using (true);

create table if not exists generator_templates (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  version text not null,
  inhalt text not null,
  review_status review_status not null default 'entwurf',
  rechtsstand date not null,
  aktiv boolean not null default true,
  cattwyk_review_am date,
  created_at timestamptz not null default now(),
  unique (key, version)
);
alter table generator_templates enable row level security;
create policy "freigegebene templates" on generator_templates
  for select to authenticated
  using (review_status = 'cattwyk_freigegeben' and aktiv);
