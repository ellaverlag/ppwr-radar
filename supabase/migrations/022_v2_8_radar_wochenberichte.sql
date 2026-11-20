-- ============================================================
-- PPWR Radar – Migration v2.8: Radar-Wochenberichte (Langfassung des
-- Monitorings unter /updates)
--
-- Zweck (Entscheidung 20.11.2026): Das wöchentliche Rechtsmonitoring
-- erzeugt zwei Fassungen. Die klar verständliche Kurzfassung erscheint
-- auf packaging-journal.de; die ausführliche Fassung (Format Normal,
-- 6.000–9.000 Zeichen, je Fund ein Abschnitt mit „Was gilt weiterhin“)
-- wird als Wochenbericht hier abgelegt und im PPWR Radar unter /updates
-- ausgespielt (Liste + Detailseite /updates/wochenbericht/[datum]).
-- Der Ticker (radar_meldungen) bleibt die Meldung je Fund; das Memo
-- (update_memos) bleibt die interne Arbeitsnotiz.
--
-- body_markdown: Fließtext in Markdown (## je Fund, > Kasten „Auf einen
--   Blick“, **Was gilt weiterhin:**, Quellenlinks als Markdown-Links).
--   Ohne Schlusskarte, ohne Hub-Absatz, ohne (!) und ohne Cattwyk-Interna.
-- Ausspielung: ausspielen = true genügt; review_status wird als
--   Prüfstatus-Badge mitangezeigt (entwurf = redaktionell noch nicht geprüft).
-- ============================================================

create table radar_wochenberichte (
  id uuid primary key default gen_random_uuid(),
  memo_id uuid references update_memos(id) on delete set null,
  datum date not null unique,                  -- Datum des Monitoring-Laufs (Freitag)
  zeitraum_von date not null,                  -- geprüfter Zeitraum
  zeitraum_bis date not null,
  titel text not null,                         -- eine Zeile, max. ~90 Zeichen
  teaser text not null,                        -- 1–2 Sätze für die Liste
  body_markdown text not null,                 -- Langfassung (Markdown)
  rechtsstand date not null,
  zeichen int,                                 -- body_markdown ohne Kasten, informativ
  review_status review_status not null default 'entwurf',
  ausspielen boolean not null default true,
  created_at timestamptz not null default now()
);
create index radar_wochenberichte_datum_idx on radar_wochenberichte (datum desc);
alter table radar_wochenberichte enable row level security;
create policy "ausgespielte wochenberichte" on radar_wochenberichte
  for select to authenticated using (ausspielen);
