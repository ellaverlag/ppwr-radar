-- v1.9 – Assistant (RAG mit Guardrails) + Praxisfragen-Aufrufe
--
-- 1. frage_kandidaten: anonymisierte Frage-Vorschläge aus dem Assistant für
--    die redaktionelle Prüfung. Kontext enthält NUR Rollen/Verpackungstypen
--    (jsonb), nie Firmen- oder Personendaten. Schreiben ausschließlich über
--    den Service-Role-Client der Server Action – RLS bleibt ohne Policies
--    (deny-all für authenticated/anon).
--
-- 2. assistant_nutzung: eine Zeile je gestellter Frage als Rate-Limit-Zähler
--    (20 Fragen/Stunde je Nutzer). Ebenfalls nur Service-Role.
--
-- 3. auslegungen.aufrufe: Zähler fürs Aufklappen einer Praxisfrage – Basis
--    für spätere echte „Meistgelesen“-Auswahl. Atomares Inkrement über eine
--    Funktion, ausführbar nur für service_role (fire-and-forget aus einer
--    Server Action, kein Personenbezug).
--
-- 4. assistant_suche: Postgres-Volltextsuche (websearch_to_tsquery, german)
--    über anforderungen, auslegungen und rollen_definitionen. SECURITY
--    INVOKER: für eingeloggte Nutzer greifen die bestehenden RLS-Policies
--    (nur Freigegebenes), der Service-Role-Client im PREVIEW_MODE sieht
--    alles – exakt der Datenpfad der Wissensbasis.

-- ---------- 1. frage_kandidaten -------------------------------------------
-- Hinweis: In der Live-DB existierte die Tabelle bereits (Redaktions-Anlage)
-- mit eigenem Status-Vokabular (neu/in_bearbeitung/veroeffentlicht/abgelehnt),
-- Spalte veroeffentlicht_als und einer INSERT-Policy für authenticated –
-- create if not exists lässt sie unangetastet; es gilt deren Vokabular.

create table if not exists frage_kandidaten (
  id uuid primary key default gen_random_uuid(),
  frage_text text not null,
  kontext jsonb,
  quelle text not null default 'assistant'
    check (quelle in ('assistant', 'formular', 'redaktion')),
  status text not null default 'neu'
    check (status in ('neu', 'in_bearbeitung', 'veroeffentlicht', 'abgelehnt')),
  veroeffentlicht_als text,
  created_at timestamptz not null default now()
);

alter table frage_kandidaten enable row level security;
-- Schreiben aus dem Assistant läuft über die Service Role; die bestehende
-- INSERT-Policy für authenticated bleibt für das Redaktions-Formular.

-- ---------- 2. assistant_nutzung ------------------------------------------

create table if not exists assistant_nutzung (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  gefragt_am timestamptz not null default now()
);

create index if not exists assistant_nutzung_fenster_idx
  on assistant_nutzung (user_id, gefragt_am desc);

alter table assistant_nutzung enable row level security;
-- keine Policies: Zähler wird nur server-seitig (Service Role) geführt

-- ---------- 3. auslegungen.aufrufe ----------------------------------------

alter table auslegungen
  add column if not exists aufrufe int not null default 0;

create or replace function zaehle_auslegung_aufruf(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update auslegungen set aufrufe = aufrufe + 1 where id = p_id;
$$;

revoke all on function zaehle_auslegung_aufruf(uuid) from public, anon, authenticated;
grant execute on function zaehle_auslegung_aufruf(uuid) to service_role;

-- ---------- 4. assistant_suche (FTS german) -------------------------------

-- ref ist text: UUID bei anforderungen/auslegungen, rolle_id bei Rollen.
create or replace function assistant_suche(p_query text, p_limit int default 8)
returns table (typ text, ref text, rang real)
language sql
stable
security invoker
set search_path = public
as $$
  with q as (select websearch_to_tsquery('german', p_query) as tsq)
  select t.typ, t.ref, t.rang
  from (
    select 'anforderung'::text as typ,
           a.id::text as ref,
           ts_rank(
             to_tsvector('german',
               coalesce(a.titel, '') || ' ' ||
               coalesce(a.kurzerklaerung, '') || ' ' ||
               coalesce(a.erklaerung_fachlich, '') || ' ' ||
               coalesce(a.tatbestand #>> '{}', '') || ' ' ||
               coalesce(a.handlungsanweisung, '')),
             q.tsq) as rang
    from anforderungen a, q
    where to_tsvector('german',
            coalesce(a.titel, '') || ' ' ||
            coalesce(a.kurzerklaerung, '') || ' ' ||
            coalesce(a.erklaerung_fachlich, '') || ' ' ||
            coalesce(a.tatbestand #>> '{}', '') || ' ' ||
            coalesce(a.handlungsanweisung, '')) @@ q.tsq

    union all

    select 'auslegung', u.id::text,
           ts_rank(
             to_tsvector('german',
               coalesce(u.kurztitel, '') || ' ' ||
               coalesce(u.frage, '') || ' ' ||
               coalesce(u.antwort, '')),
             q.tsq)
    from auslegungen u, q
    where to_tsvector('german',
            coalesce(u.kurztitel, '') || ' ' ||
            coalesce(u.frage, '') || ' ' ||
            coalesce(u.antwort, '')) @@ q.tsq

    union all

    select 'rolle', r.rolle_id,
           ts_rank(
             to_tsvector('german',
               coalesce(r.begriff_de, '') || ' ' ||
               coalesce(r.definition_kurz, '') || ' ' ||
               coalesce(r.abgrenzung, '') || ' ' ||
               coalesce(r.verwechslungsfaelle, '')),
             q.tsq)
    from rollen_definitionen r, q
    where to_tsvector('german',
            coalesce(r.begriff_de, '') || ' ' ||
            coalesce(r.definition_kurz, '') || ' ' ||
            coalesce(r.abgrenzung, '') || ' ' ||
            coalesce(r.verwechslungsfaelle, '')) @@ q.tsq
  ) t
  order by t.rang desc
  limit p_limit;
$$;

grant execute on function assistant_suche(text, int) to authenticated, service_role;
