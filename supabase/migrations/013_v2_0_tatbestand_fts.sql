-- v2.0.1 – assistant_suche: tatbestand liegt in der Live-DB teils als
-- jsonb-Objekt {"text": "…"} vor (39 von 40 Zeilen), teils als String.
-- ->>'text' extrahiert den Objekt-Text, #>> '{}' deckt die String-Form ab –
-- so fließt der eigentliche Tatbestandstext (statt des serialisierten
-- JSON) in die Volltextsuche ein. Rest der Funktion unverändert (011).

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
               coalesce(a.tatbestand->>'text', a.tatbestand #>> '{}', '') || ' ' ||
               coalesce(a.handlungsanweisung, '')),
             q.tsq) as rang
    from anforderungen a, q
    where to_tsvector('german',
            coalesce(a.titel, '') || ' ' ||
            coalesce(a.kurzerklaerung, '') || ' ' ||
            coalesce(a.erklaerung_fachlich, '') || ' ' ||
            coalesce(a.tatbestand->>'text', a.tatbestand #>> '{}', '') || ' ' ||
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
