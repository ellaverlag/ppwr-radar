-- ============================================================
-- PPWR Radar – Supabase Schema v1.0
-- Ausführen im Supabase SQL Editor (neues Projekt, Schema public)
-- Grundlage: Master-Briefing v7, Regelwerk & Datenmodell v0.1
-- ============================================================

-- Erweiterungen
create extension if not exists vector;        -- pgvector für RAG-Zitatbelege
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- ENUMS
-- ------------------------------------------------------------
create type gilt_status as enum ('in_kraft', 'kuenftig', 'rechtsakt_ausstehend', 'entwurf_eu');
create type review_status as enum ('entwurf', 'redaktion_geprueft', 'cattwyk_freigegeben');
create type kategorie as enum ('stoffrecht', 'mehrweg', 'konformitaet', 'kennzeichnung', 'rollen_epr', 'verbote', 'sonstiges');
create type dokument_typ as enum ('konformitaetserklaerung', 'doku_geruest', 'pflichtenuebersicht', 'lieferantenanfrage', 'handout', 'gf_briefing');
create type dokument_status as enum ('aktuell', 'update_verfuegbar');
create type verbindlichkeit as enum ('rechtsverbindlich', 'unverbindliche_auslegung');

-- ------------------------------------------------------------
-- SCHICHT 1: ROLLEN-ENGINE
-- ------------------------------------------------------------
create table rollen_definitionen (
  rolle text primary key,                      -- 'erzeuger', 'hersteller', ...
  en_begriff text not null,                    -- 'manufacturer', 'producer', ...
  ppwr_definition text not null,               -- Wortlaut
  ppwr_fundstelle text not null,               -- z. B. 'Art. 3 Abs. 1 Nr. 13'
  verpackdg_fundstelle text,                   -- § der BGBl-Fassung, falls relevant
  alt_bedeutung_verpackg text,                 -- Alt-Bedeutung nach VerpackG
  abgrenzung text,                             -- typische Verwechslungsfälle
  review_status review_status not null default 'entwurf',
  rechtsstand date not null default current_date,
  cattwyk_review_am date
);

create table rollen_regeln (
  id uuid primary key default uuid_generate_v4(),
  prioritaet int not null default 100,         -- Auswertungsreihenfolge
  bedingung jsonb not null,                    -- Tätigkeits-Bedingungen aus dem Wizard
  ergebnis_rolle text not null references rollen_definitionen(rolle),
  begruendung_template text not null,          -- 'Sie gelten als …, weil …'
  fundstellen text[] not null,                 -- ['Art. 3 Abs. 1 Nr. 15 PPWR', '§ 5 VerpackDG']
  review_status review_status not null default 'entwurf',
  rechtsstand date not null default current_date,
  cattwyk_review_am date
);

-- ------------------------------------------------------------
-- SCHICHT 2: ANFORDERUNGEN
-- ------------------------------------------------------------
create table anforderungen (
  id uuid primary key default uuid_generate_v4(),
  nummer int unique,                           -- #1–40 aus dem Arbeitspaket
  titel text not null,
  kategorie kategorie not null,
  rechtsquelle text not null,                  -- 'Art. 5 Abs. 4 PPWR'
  rechtsquelle_link text,
  verpackdg_quelle text,                       -- '§ 12 VerpackDG' (Doppel-Layer)
  doppel_layer boolean not null default false,
  gilt_ab date,
  gilt_status gilt_status not null,
  betrifft_rollen text[] not null,
  betrifft_verpackungstypen text[] not null default '{alle}',
  betrifft_materialien text[] not null default '{alle}',
  lebensmittelkontakt text not null default 'egal',  -- 'nur_lmk' | 'nicht_lmk' | 'egal'
  tatbestand jsonb,                            -- strukturierte Bedingungen
  rechtsfolgen_je_rolle jsonb,                 -- {"erzeuger": "...", "hersteller": "..."}
  ausnahmen text,
  uebergangsregeln text,
  verweise text[],
  kurzerklaerung text not null,                -- Fassung 'Einfach erklärt'
  erklaerung_fachlich text,                    -- Erklär-Tiefen-Schalter
  erklaerung_rechtstext text,
  handlungsanweisung text,
  risiko_bei_verstoss text,
  audio_url text,                              -- vorproduziertes ElevenLabs-Audio
  review_status review_status not null default 'entwurf',
  rechtsstand date not null default current_date,
  cattwyk_review_am date,
  version int not null default 1,
  updated_at timestamptz not null default now()
);

create table anforderung_versionen (
  id uuid primary key default uuid_generate_v4(),
  anforderung_id uuid not null references anforderungen(id) on delete cascade,
  version int not null,
  snapshot jsonb not null,                     -- kompletter Datensatz vor Änderung
  geaendert_am timestamptz not null default now(),
  aenderungsgrund text
);

-- Versionierungs-Trigger: jede Änderung archiviert den Vorzustand
create or replace function fn_versioniere_anforderung()
returns trigger language plpgsql as $$
begin
  insert into anforderung_versionen (anforderung_id, version, snapshot)
  values (old.id, old.version, to_jsonb(old));
  new.version := old.version + 1;
  new.updated_at := now();
  return new;
end $$;

create trigger trg_anforderung_version
  before update on anforderungen
  for each row execute function fn_versioniere_anforderung();

-- ------------------------------------------------------------
-- SCHICHT 3: AUSLEGUNGEN (Q&A)
-- ------------------------------------------------------------
create table auslegungen (
  id uuid primary key default uuid_generate_v4(),
  frage text not null,
  antwort text not null,
  kategorie kategorie not null,
  quellen text[] not null,
  verbindlichkeit verbindlichkeit not null default 'unverbindliche_auslegung',
  bezug_anforderungen uuid[],                  -- verknüpfte Anforderungs-IDs
  audio_url text,
  review_status review_status not null default 'entwurf',
  rechtsstand date not null default current_date,
  cattwyk_review_am date
);

-- ------------------------------------------------------------
-- RAG-QUELLENBASIS (nur Zitatbelege, nie alleinige Antwortquelle)
-- ------------------------------------------------------------
create table rechtstexte (
  id uuid primary key default uuid_generate_v4(),
  quelle text not null,                        -- 'PPWR (EU) 2025/40', 'VerpackDG (BGBl ...)'
  typ text not null,                           -- 'verordnung' | 'durchfuehrungsrechtsakt' | 'guideline' | 'national'
  verbindlichkeit verbindlichkeit not null,
  stand date not null,
  url text
);

create table rechtstext_chunks (
  id uuid primary key default uuid_generate_v4(),
  rechtstext_id uuid not null references rechtstexte(id) on delete cascade,
  fundstelle text not null,                    -- 'Art. 11 Abs. 1' / '§ 5 Abs. 2'
  inhalt text not null,
  embedding vector(1536)                       -- Dimension an Embedding-Modell anpassen
);
create index on rechtstext_chunks using ivfflat (embedding vector_cosine_ops);

-- ------------------------------------------------------------
-- NUTZER: PROFILE & PORTFOLIO
-- ------------------------------------------------------------
create table profile (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  firmenname text,
  maerkte text[] not null default '{DE}',
  vertriebswege text[],
  grenzueberschreitender_direktvertrieb boolean not null default false,
  taetigkeiten jsonb,                          -- Roh-Antworten aus dem Wizard
  onboarding_abgeschlossen boolean not null default false,
  erklaertiefe_praeferenz text default 'einfach',
  created_at timestamptz not null default now()
);

create table profil_verpackungen (
  id uuid primary key default uuid_generate_v4(),
  profil_id uuid not null references profile(id) on delete cascade,
  bezeichnung text not null,                   -- 'PP-Schale Feinkost'
  verpackungstyp text not null,
  materialien text[] not null,
  lebensmittelkontakt boolean not null default false,
  mehrweg boolean not null default false,
  rollen_set jsonb,                            -- Ergebnis der Rollen-Engine + Begründungen
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- DOKUMENTE, RADAR, ABO
-- ------------------------------------------------------------
create table dokumente (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  verpackung_id uuid references profil_verpackungen(id) on delete set null,
  typ dokument_typ not null,
  status dokument_status not null default 'aktuell',
  rechtsstand_bei_erstellung date not null,
  storage_path text not null,
  version int not null default 1,
  created_at timestamptz not null default now()
);

create table update_memos (
  id uuid primary key default uuid_generate_v4(),
  titel text not null,
  memo_text text not null,
  betroffene_anforderungen uuid[] not null,
  audio_url text,
  review_status review_status not null default 'entwurf',
  veroeffentlicht_am timestamptz,
  cattwyk_review_am date
);

create table benachrichtigungen (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  memo_id uuid references update_memos(id) on delete cascade,
  betroffene_verpackungen uuid[],
  gelesen boolean not null default false,
  created_at timestamptz not null default now()
);

create table subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text,
  status text not null default 'inactive',     -- Sync via Stripe-Webhook
  paket text,                                  -- 'ppwr_ready' | 'radar' | 'team'
  laufzeit_ende date,
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ------------------------------------------------------------
-- Nutzerdaten: nur eigener Zugriff
alter table profile enable row level security;
alter table profil_verpackungen enable row level security;
alter table dokumente enable row level security;
alter table benachrichtigungen enable row level security;
alter table subscriptions enable row level security;

create policy "eigenes profil" on profile
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "eigene verpackungen" on profil_verpackungen
  for all using (profil_id in (select id from profile where user_id = auth.uid()))
  with check (profil_id in (select id from profile where user_id = auth.uid()));

create policy "eigene dokumente" on dokumente
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "eigene benachrichtigungen" on benachrichtigungen
  for select using (auth.uid() = user_id);

create policy "eigenes abo lesen" on subscriptions
  for select using (auth.uid() = user_id);

-- Wissensbasis: eingeloggte Nutzer lesen NUR freigegebene Inhalte;
-- Schreiben ausschließlich über Service Role (Redaktions-/Freigabe-Workflow)
alter table anforderungen enable row level security;
alter table auslegungen enable row level security;
alter table rollen_definitionen enable row level security;
alter table rollen_regeln enable row level security;
alter table update_memos enable row level security;
alter table rechtstexte enable row level security;
alter table rechtstext_chunks enable row level security;

create policy "freigegebene anforderungen" on anforderungen
  for select to authenticated using (review_status = 'cattwyk_freigegeben');
create policy "freigegebene auslegungen" on auslegungen
  for select to authenticated using (review_status = 'cattwyk_freigegeben');
create policy "freigegebene rollen" on rollen_definitionen
  for select to authenticated using (review_status = 'cattwyk_freigegeben');
create policy "freigegebene regeln" on rollen_regeln
  for select to authenticated using (review_status = 'cattwyk_freigegeben');
create policy "veroeffentlichte memos" on update_memos
  for select to authenticated using (veroeffentlicht_am is not null);
create policy "rechtstexte lesen" on rechtstexte for select to authenticated using (true);
create policy "chunks lesen" on rechtstext_chunks for select to authenticated using (true);

-- Versionshistorie: nur Service Role (keine Policy für authenticated)
alter table anforderung_versionen enable row level security;

-- ------------------------------------------------------------
-- STORAGE-BUCKETS (im Dashboard anlegen oder per API):
--   'dokumente'  (privat)  – generierte Word/PDF je Nutzer
--   'audio'      (public)  – vorproduzierte MP3 je Datensatz
-- ------------------------------------------------------------
