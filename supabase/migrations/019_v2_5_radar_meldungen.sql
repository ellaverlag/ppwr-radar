-- ============================================================
-- PPWR Radar – Migration v2.5: Radar-Meldungen (Update-Ticker)
--
-- Zweck: Das wöchentliche Rechtsmonitoring schreibt je Fund EINE
-- nutzerseitig formulierte Meldung. Dashboard (letzte fünf) und die Seite
-- /updates (Historie) lesen daraus. update_memos bleibt die interne
-- Arbeitsnotiz je Lauf (Cattwyk-Hinweise, (!)-Marken) und wird nicht
-- mehr direkt ausgespielt.
--
-- Einordnung (einordnung): rechtsverbindlich | unverbindliche_auslegung |
--   behoerdeninformation | verfahren | gericht | verbandsmeinung | stand
--   („stand“ = Wochenlauf ohne Neuerung: „geprüft, nichts Neues“).
-- Ausspielung: ausspielen = true genügt; der review_status wird als
-- Prüfstatus-Badge mit angezeigt (entwurf = „Monitoring, redaktionell
-- noch nicht geprüft“). Meldungen sind Fakten mit Fundstelle, keine
-- Auslegung – Auslegung steht in den verlinkten Praxisfragen.
-- ============================================================

create table radar_meldungen (
  id uuid primary key default gen_random_uuid(),
  memo_id uuid references update_memos(id) on delete set null,
  datum date not null,                         -- Datum des Ereignisses (nicht des Laufs)
  titel text not null,                         -- eine Zeile, max. ~90 Zeichen
  text text not null,                          -- 2–4 Sätze, nutzerseitig, ohne (!)
  quelle text not null,                        -- „EU-Parlament“, „Rat der EU“, „EU-Kommission“, „ZSVR“, „BMUKN“, „EUR-Lex“, „Monitoring“ …
  quelle_url text,
  einordnung text not null check (einordnung in (
    'rechtsverbindlich','unverbindliche_auslegung','behoerdeninformation',
    'verfahren','gericht','verbandsmeinung','stand')),
  fundstellen text[] not null default '{}',    -- „Art. 45 Abs. 3 VO (EU) 2025/40“, „§ 5 Abs. 2 VerpackDG“
  bezug_nr int[] not null default '{}',        -- betroffene Anforderungen (anforderungen.nr)
  verweis_auslegungen text[] not null default '{}', -- Praxisfragen-Codes (A35, C14 …)
  rechtslage_unveraendert boolean not null default true, -- „Rechtslage unverändert“-Hinweis
  review_status review_status not null default 'entwurf',
  ausspielen boolean not null default true,
  created_at timestamptz not null default now()
);
create index radar_meldungen_datum_idx on radar_meldungen (datum desc, created_at desc);
alter table radar_meldungen enable row level security;
create policy "ausgespielte meldungen" on radar_meldungen
  for select to authenticated using (ausspielen);
