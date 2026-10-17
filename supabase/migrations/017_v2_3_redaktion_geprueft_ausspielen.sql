-- ============================================================
-- PPWR Radar – Migration v2.3: Zwischenstufe „redaktion_geprueft“ ausspielen
--
-- Zweck: Die Redaktion hat entschieden, dass Wissensbasis-Inhalte mit
-- review_status = 'redaktion_geprueft' live ausgespielt werden dürfen –
-- als Zwischenstufe, bis die Kanzlei Cattwyk sie freigibt
-- ('cattwyk_freigegeben'). Für Nutzer bleibt der jeweilige Status in der
-- App sichtbar (Statuskennzeichnung je Datensatz, siehe App-Code).
--
-- Bisher erlaubten die SELECT-Policies für `authenticated` ausschließlich
-- 'cattwyk_freigegeben'. Diese Migration ersetzt die Policies so, dass
--   review_status in ('redaktion_geprueft', 'cattwyk_freigegeben')
-- gilt; die übrigen Bedingungen (ausspielen bzw. aktiv, Rolle
-- `authenticated`) bleiben unverändert. 'entwurf' bleibt weiterhin
-- unsichtbar; `anon` liest weiterhin nichts.
--
-- Herkunft der ersetzten Policies:
--   anforderungen        → 002 ("freigegebene anforderungen", ausspielen = true)
--   auslegungen          → 005 ("freigegebene auslegungen", ausspielen)
--   rollen_definitionen  → 003 ("freigegebene rollen_definitionen", aktiv)
--   rollen_regeln        → 003 ("freigegebene rollen_regeln", aktiv)
--   generator_templates  → 004 ("freigegebene templates", aktiv)
--
-- Die Policies "freigegebene rollen"/"freigegebene regeln" aus 001 sind mit
-- dem DROP TABLE in 003 entfallen; sie werden hier nur vorsorglich gelöscht.
--
-- Nicht betroffen:
--   update_memos         → Policy prüft veroeffentlicht_am, nicht review_status
--   assistant_suche()    → SECURITY INVOKER ohne eigenen Statusfilter (011/013);
--                          die Sichtbarkeit ergibt sich allein aus den
--                          Policies oben – keine Änderung nötig.
--   chk_freigabe_braucht_text (002) → Constraint bindet nur die Freigabe
--                          durch Cattwyk an vorhandene Texte, kein Lesefilter.
--
-- glossar_lemmata: Die Tabelle ist in keiner versionierten Migration (001–016)
-- angelegt (direkt in Supabase erstellt). Ihre Policy "freigegebene lemmata"
-- wurde am 17.10.2026 in pg_policies verifiziert und wird hier ersetzt.
--
-- Eingespielt am 17.10.2026 über die Supabase-MCP-Schnittstelle (tabellenweise).
-- ============================================================

-- Umsetzung per ALTER POLICY (idempotent, kein DROP nötig – die Policy-Namen
-- wurden am 17.10.2026 in pg_policies verifiziert).

alter policy "freigegebene anforderungen" on anforderungen
  using (review_status in ('redaktion_geprueft', 'cattwyk_freigegeben') and ausspielen = true);

alter policy "freigegebene auslegungen" on auslegungen
  using (review_status in ('redaktion_geprueft', 'cattwyk_freigegeben') and ausspielen);

alter policy "freigegebene rollen_definitionen" on rollen_definitionen
  using (review_status in ('redaktion_geprueft', 'cattwyk_freigegeben') and aktiv);

alter policy "freigegebene rollen_regeln" on rollen_regeln
  using (review_status in ('redaktion_geprueft', 'cattwyk_freigegeben') and aktiv);

alter policy "freigegebene templates" on generator_templates
  using (review_status in ('redaktion_geprueft', 'cattwyk_freigegeben') and aktiv);

alter policy "freigegebene lemmata" on glossar_lemmata
  using (review_status in ('redaktion_geprueft', 'cattwyk_freigegeben') and ausspielen);
