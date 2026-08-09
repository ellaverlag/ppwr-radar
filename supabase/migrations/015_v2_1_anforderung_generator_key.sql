-- v2.1 – Handlungs-Link: empfohlener Generator-Dokumenttyp je Anforderung
--
-- generator_key verweist optional auf einen Template-Key des Dokumenten-
-- Generators (siehe TEMPLATE_TYPEN in src/lib/dokumente/service.ts). Ist er
-- gesetzt, zeigt die App an der Anforderung einen „Dokument erstellen“-Link
-- auf /dokumente/neu?typ={key}. NULL = kein passendes Dokument, kein Button.
--
-- Die konkrete Zuordnung je Anforderung liefert die Redaktion per Update-SQL
-- (hier NICHT geraten). Der CHECK hält das Feld auf die real existierenden
-- Template-Keys begrenzt; die Pflichtenübersicht ist anforderungsübergreifend
-- und wird bewusst nicht automatisch zugeordnet.

alter table anforderungen
  add column if not exists generator_key text;

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'chk_anforderung_generator_key'
  ) then
    alter table anforderungen add constraint chk_anforderung_generator_key
      check (generator_key is null or generator_key in (
        'konformitaetserklaerung', 'techdoku',
        'pflichtenuebersicht', 'lieferantenanfragen'
      ));
  end if;
end $$;
