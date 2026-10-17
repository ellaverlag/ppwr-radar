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
-- glossar_lemmata: Die Tabelle wird von der App gelesen, ist aber in keiner
-- versionierten Migration (001–016) angelegt – Name und Form ihrer
-- bestehenden Policy sind hier nicht bekannt. Da permissive Policies per OR
-- kombiniert werden, reicht eine ZUSÄTZLICHE Policy, um die Zwischenstufe
-- freizuschalten; die bestehende Policy bleibt unangetastet. Der Block läuft
-- nur, wenn die Tabelle existiert.
-- ============================================================

-- ---------- anforderungen ----------
drop policy if exists "freigegebene anforderungen" on anforderungen;
create policy "freigegebene anforderungen" on anforderungen
  for select to authenticated
  using (
    review_status in ('redaktion_geprueft', 'cattwyk_freigegeben')
    and ausspielen = true
  );

-- ---------- auslegungen ----------
drop policy if exists "freigegebene auslegungen" on auslegungen;
create policy "freigegebene auslegungen" on auslegungen
  for select to authenticated
  using (
    review_status in ('redaktion_geprueft', 'cattwyk_freigegeben')
    and ausspielen
  );

-- ---------- rollen_definitionen ----------
drop policy if exists "freigegebene rollen" on rollen_definitionen;
drop policy if exists "freigegebene rollen_definitionen" on rollen_definitionen;
create policy "freigegebene rollen_definitionen" on rollen_definitionen
  for select to authenticated
  using (
    review_status in ('redaktion_geprueft', 'cattwyk_freigegeben')
    and aktiv
  );

-- ---------- rollen_regeln ----------
drop policy if exists "freigegebene regeln" on rollen_regeln;
drop policy if exists "freigegebene rollen_regeln" on rollen_regeln;
create policy "freigegebene rollen_regeln" on rollen_regeln
  for select to authenticated
  using (
    review_status in ('redaktion_geprueft', 'cattwyk_freigegeben')
    and aktiv
  );

-- ---------- generator_templates ----------
drop policy if exists "freigegebene templates" on generator_templates;
create policy "freigegebene templates" on generator_templates
  for select to authenticated
  using (
    review_status in ('redaktion_geprueft', 'cattwyk_freigegeben')
    and aktiv
  );

-- ---------- glossar_lemmata (nur wenn vorhanden) ----------
do $$
begin
  if to_regclass('public.glossar_lemmata') is not null then
    execute 'alter table glossar_lemmata enable row level security';
    execute 'drop policy if exists "ausspielbare glossar_lemmata" on glossar_lemmata';
    execute $p$
      create policy "ausspielbare glossar_lemmata" on glossar_lemmata
        for select to authenticated
        using (
          review_status in ('redaktion_geprueft', 'cattwyk_freigegeben')
          and ausspielen = true
        )
    $p$;
  end if;
end $$;
