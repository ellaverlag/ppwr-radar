-- ============================================================
-- PPWR Radar – Migration v2.4: Verpackungs-Ebene unter der Produktlinie
--
-- Zweck: Die Rollen- und Pflichtenbestimmung erfolgt je VERPACKUNG, nicht
-- nur je Produktlinie. Beispiel Verlag: Folie (flexibel, selbst angewendet)
-- und Versandumschlag (formstabil, fertig gekauft) derselben Produktlinie
-- führen zu unterschiedlichen Rollen (Erzeuger/Hersteller vs. Vertreiber)
-- und damit zu unterschiedlichen Pflichten (Konformitätserklärung, LUCID).
--
-- Drei neue Tabellen:
--   verpackungen            – Verpackungen je Produktlinie (Own-Row-RLS)
--   verpackung_ergebnisse   – Engine-Ergebnis je Verpackung (Own-Row, nur lesen)
--   entlastungs_hinweise    – redaktionelle „Ideen zur Vereinfachung“ als
--                             Wissensbasis-Inhalt mit Review-Status (wie
--                             auslegungen), keine Einzelfallempfehlung
-- Dazu Regeln D1–D5 (Block „verpackung“) in rollen_regeln (per INSERT, siehe
-- content/delta/2026-10-17_Verpackungsebene_Inhalte.sql).
-- ============================================================

-- Block „verpackung“ in rollen_regeln zulassen (Regeln D1–D5)
alter table rollen_regeln
  drop constraint rollen_regeln_block_check,
  add constraint rollen_regeln_block_check check (block in ('erzeuger','hersteller','weitere','output','verpackung'));

create type verpackung_form as enum ('formstabil', 'flexibel');
create type verpackung_bezug as enum (
  'fertig_gekauft',          -- vom Lieferanten fertig bezogen, unverändert verwendet
  'selbst_zusammengefuegt',  -- aus Teilen gefaltet/geklebt/zugeschnitten
  'selbst_hergestellt',      -- physisch selbst produziert (auch: Folie selbst angewendet)
  'lohnfertigung'            -- durch Dienstleister im Auftrag (Druckerei, Konfektionär)
);
create type lieferant_sitz as enum ('DE', 'EU', 'drittland');

create table verpackungen (
  id uuid primary key default gen_random_uuid(),
  profil_id uuid not null references profile(id) on delete cascade,
  produktlinie_id uuid not null references profil_verpackungen(id) on delete cascade,
  bezeichnung text not null,                 -- „Versandumschlag C4“, „Schrumpffolie Zeitschrift“
  art text not null check (art in ('verkauf','um','transport','ecommerce','service','primaerproduktion')),
  form verpackung_form not null,
  bezug verpackung_bezug not null,
  lieferant_sitz lieferant_sitz,             -- null bei selbst_hergestellt
  marke text not null default 'keine' check (marke in ('eigene','fremde','keine')),
  material text,                             -- Freitext/Materialart (Papier/Karton, Kunststoff, …)
  lebensmittelkontakt boolean not null default false,
  mehrweg boolean not null default false,
  menge_jahr_kg numeric,                     -- optional, für den späteren Meldebogen
  status text not null default 'aktiv' check (status in ('aktiv','stillgelegt')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index verpackungen_produktlinie_idx on verpackungen (produktlinie_id);
alter table verpackungen enable row level security;
create policy "eigene verpackungen je linie" on verpackungen
  for all using (profil_id in (select id from profile where user_id = auth.uid()))
  with check (profil_id in (select id from profile where user_id = auth.uid()));

create table verpackung_ergebnisse (
  id uuid primary key default gen_random_uuid(),
  verpackung_id uuid not null references verpackungen(id) on delete cascade,
  profil_id uuid not null references profile(id) on delete cascade,
  rollen jsonb not null default '[]',        -- ["erzeuger","hersteller",…]
  pflichten jsonb not null default '[]',     -- Pflichten-Matrix: [{key, label, anforderung_nr, gilt, grund}]
  hinweise jsonb not null default '[]',      -- codes der entlastungs_hinweise, die greifen
  herleitung jsonb not null default '[]',    -- wie rollen_ergebnisse.herleitung
  vorbehalt boolean not null default false,
  engine_version text not null,
  rechtsstand date not null,
  aktuell boolean not null default true,
  erstellt_am timestamptz not null default now()
);
create index verpackung_ergebnisse_verpackung_idx on verpackung_ergebnisse (verpackung_id, aktuell);
alter table verpackung_ergebnisse enable row level security;
create policy "eigene verpackung_ergebnisse lesen" on verpackung_ergebnisse
  for select using (profil_id in (select id from profile where user_id = auth.uid()));

create table entlastungs_hinweise (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,                 -- H01, H02, …
  bedingung_key text not null,               -- von der Engine gesetzter Schlüssel
  titel text not null,
  text text not null,
  fundstellen text[] not null default '{}',
  verweis_auslegungen text[] not null default '{}',
  flag text,
  review_status review_status not null default 'entwurf',
  rechtsstand date not null,
  ausspielen boolean not null default true,
  created_at timestamptz not null default now()
);
alter table entlastungs_hinweise enable row level security;
create policy "freigegebene hinweise" on entlastungs_hinweise
  for select to authenticated
  using (review_status in ('redaktion_geprueft', 'cattwyk_freigegeben') and ausspielen);
