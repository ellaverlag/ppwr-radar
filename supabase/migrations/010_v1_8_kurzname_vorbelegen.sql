-- v1.8 – Kurzname vs. Beschreibung: Kurznamen vorbelegen
--
-- bezeichnung ist das knappe Anzeige-Etikett, zusatzangaben der lange
-- Freitext (KI-Kontext). Wo bezeichnung leer ist, aber ein alter Freitext
-- existiert (zusatzangaben oder frühere produktlinie), wird ein Kurzname
-- vorbelegt: erste ~50 Zeichen bis zum ersten Satzzeichen, „…" angehängt.
-- Bestehende Linien stehen damit nicht ohne Label da; der Nutzer kann den
-- Kurznamen beim nächsten Bearbeiten überschreiben.
--
update profil_verpackungen v
set bezeichnung = case
      when length(q.text) <= 50 then q.text
      else coalesce(
             nullif(rtrim(substring(q.text from '^[^.,;:!?\n]{1,50}')), ''),
             left(q.text, 50)
           ) || '…'
    end
from (
  select id,
         coalesce(
           nullif(trim(zusatzangaben), ''),
           nullif(trim(produktlinie), '')
         ) as text
  from profil_verpackungen
  where coalesce(trim(bezeichnung), '') = ''
) q
where v.id = q.id and q.text is not null;

-- Teil 2: Über-lange Alt-Bezeichnungen (> 60 Zeichen, Freitext als Label)
-- bekommen ebenfalls einen Kurznamen; der volle Text wandert – falls die
-- Beschreibung leer ist – nach zusatzangaben. Der Name ist der
-- Verknüpfungsschlüssel, daher werden rollen_ergebnisse und der
-- Wizard-Zustand (profile.taetigkeiten.produktlinien) mit umbenannt.

do $$
declare
  zeile record;
  kurz text;
begin
  for zeile in
    select id, profil_id, bezeichnung
    from profil_verpackungen
    where length(bezeichnung) > 60
  loop
    kurz := coalesce(
      nullif(rtrim(substring(zeile.bezeichnung from '^[^.,;:!?\n]{1,50}')), ''),
      left(zeile.bezeichnung, 50)
    ) || '…';

    -- Namenskollision innerhalb des Profils: lieber unverändert lassen
    if exists (
      select 1 from profil_verpackungen
      where profil_id = zeile.profil_id and bezeichnung = kurz
    ) then
      continue;
    end if;

    update profil_verpackungen
    set bezeichnung = kurz,
        produktlinie = kurz,
        zusatzangaben = coalesce(nullif(trim(zusatzangaben), ''), bezeichnung)
    where id = zeile.id;

    update rollen_ergebnisse
    set produktlinie = kurz
    where profil_id = zeile.profil_id
      and produktlinie = zeile.bezeichnung;

    update profile
    set taetigkeiten = jsonb_set(
      taetigkeiten,
      '{produktlinien}',
      (
        select coalesce(
          jsonb_agg(
            case when elem = zeile.bezeichnung then to_jsonb(kurz)
                 else to_jsonb(elem) end
          ),
          '[]'::jsonb
        )
        from jsonb_array_elements_text(
          coalesce(taetigkeiten->'produktlinien', '[]'::jsonb)
        ) elem
      )
    )
    where id = zeile.profil_id
      and taetigkeiten ? 'produktlinien';
  end loop;
end $$;
