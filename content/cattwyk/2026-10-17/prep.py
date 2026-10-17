import json, re

A = json.load(open('data/anforderungen.json', encoding='utf-8'))
U = json.load(open('data/auslegungen.json', encoding='utf-8'))
G = json.load(open('data/glossar.json', encoding='utf-8'))
R = json.load(open('data/rollen.json', encoding='utf-8'))

KAT = {'stoffrecht': 'Stoffrecht', 'mehrweg': 'Mehrweg', 'konformitaet': 'Konformität', 'kennzeichnung': 'Kennzeichnung',
       'rollen_epr': 'Rollen / EPR', 'verbote': 'Verbote', 'sonstiges': 'Sonstiges'}
GILT = {'in_kraft': 'gilt seit', 'kuenftig': 'gilt ab', 'rechtsakt_ausstehend': 'Rechtsakt ausstehend, geplant ab', 'entwurf_eu': 'EU-Entwurf'}


def first_sentence(t, maxlen=260):
    if not t:
        return ''
    t = re.sub(r'\s+', ' ', t).strip()
    m = re.match(r'(.+?[.!?])(\s|$)', t)
    s = m.group(1) if m else t
    if len(s) > maxlen:
        s = s[:maxlen].rsplit(' ', 1)[0] + ' …'
    return s


def trim(t, maxlen):
    if not t:
        return ''
    t = re.sub(r'\s+', ' ', t).strip()
    if len(t) <= maxlen:
        return t
    cut = t[:maxlen]
    i = max(cut.rfind('. '), cut.rfind('; '))
    return (cut[:i + 1] if i > maxlen * 0.6 else cut.rsplit(' ', 1)[0] + ' …')


SPLIT = re.compile(r'(?<=[a-zäöüß\)»“"\]0-9])\. (?=[A-ZÄÖÜ„(\[*])|\n+|(?<=[a-zäöüß\)])\; (?=[A-ZÄÖÜ„(])')


def pins(txt):
    if not txt:
        return []
    out = []
    for s in SPLIT.split(txt):
        if s and '(!)' in s:
            s = re.sub(r'\s+', ' ', s).strip(' -*#>|')
            s = re.sub(r'<!--.*?-->', '', s).strip()
            if s.startswith('(!) = offener Punkt') or s.startswith('(!) ='):
                continue
            if len(s) > 420:
                i = s.find('(!)')
                s = ('… ' if i > 200 else '') + s[max(0, i - 200): i + 220] + (' …' if i + 220 < len(s) else '')
            if s and s not in out:
                out.append(s)
    # je Pin-Kennung (V1, T2, U9 …) nur die ausführlichste Fassung behalten
    best = {}
    order = []
    for s in out:
        m = re.search(r'\(!\)\s*([A-Z]{1,2}\d{1,2})', s)
        key = m.group(1) if m else s
        if key not in best or len(s) > len(best[key]):
            if key not in best:
                order.append(key)
            best[key] = s
    return [best[k] for k in order]


def tatbestand(a):
    t = a.get('tatbestand')
    if isinstance(t, dict):
        return t.get('text') or ''
    return t or ''


# ---------------- Anforderungen ----------------
anf_s1, anf_s2 = [], []
for a in sorted(A, key=lambda x: x['nr']):
    felder = {k: (a.get(k) or '') for k in ('kurzerklaerung', 'erklaerung_fachlich', 'erklaerung_rechtstext', 'ausnahmen', 'uebergangsregeln', 'handlungsanweisung', 'verpackdg_layer')}
    felder['tatbestand'] = tatbestand(a)
    folgen = a.get('rechtsfolgen_je_rolle') or {}
    folgen_txt = ' · '.join(f'{k}: {v}' for k, v in folgen.items()) if isinstance(folgen, dict) else str(folgen)
    allpins = []
    for k, v in felder.items():
        for p in pins(v):
            allpins.append(p)
    for p in pins(folgen_txt):
        allpins.append(p)
    row = {
        'code': f"#{a['nr']:02d}", 'titel': a['titel'], 'kategorie': KAT.get(a['kategorie'], a['kategorie']),
        'gilt': f"{GILT.get(a['gilt_status'], a['gilt_status'])} {a['gilt_ab'] or ''}".strip(),
        'fundstellen': '; '.join(x for x in [a.get('rechtsquelle'), a.get('verpackdg_quelle')] if x),
        'kern': trim(a.get('kurzerklaerung') or felder['tatbestand'], 320),
        'kurz': trim(a.get('kurzerklaerung'), 700),
        'fachlich': trim(a.get('erklaerung_fachlich'), 900),
        'pins': allpins, 'ausspielen': a['ausspielen'], 'version': a.get('version'),
    }
    if (not a['ausspielen']) or allpins:
        anf_s2.append(row)
    else:
        anf_s1.append(row)

# ---------------- Auslegungen ----------------
def block_of(code):
    return {'A': 'Block A – Rollen-Grenzfälle', 'B': 'Block B – PPWR × VerpackDG', 'C': 'Block C – Konformität, Stoffe, Mehrweg'}[code[0]]

aus_s1, aus_neu, aus_pins = [], [], []
for u in sorted(U, key=lambda x: x['code']):
    row = {
        'code': u['code'], 'titel': u['kurztitel'] or trim(u['frage'], 90), 'kategorie': KAT.get(u['kategorie'], u['kategorie']),
        'block': block_of(u['code']), 'frage': u['frage'], 'antwort': u['antwort'],
        'antwort_kurz': trim(u['antwort'], 1100), 'kern': trim(re.sub(r'^Einordnung:\s*', '', u['antwort']), 320),
        'fundstellen': '; '.join(u.get('quellen') or []), 'verbindlichkeit': 'rechtsverbindlich' if u['verbindlichkeit'] == 'rechtsverbindlich' else 'unverbindliche Auslegung',
        'flag': u.get('flag') or '', 'ausspielen': u['ausspielen'], 'bezug': ', '.join(f'#{n:02d}' for n in (u.get('bezug_nr') or [])),
    }
    if (u.get('flag') or '').startswith('(neu 10/2026)'):
        aus_neu.append(row)
    elif u.get('flag') or not u['ausspielen']:
        aus_pins.append(row)
    else:
        aus_s1.append(row)

# ---------------- Glossar ----------------
glo_s1, glo_s2 = [], []
for g in sorted(G, key=lambda x: (x.get('nr') or 0, x['code'])):
    row = {'code': g['code'], 'lemma': g['lemma'], 'typ': g.get('typ') or '', 'kern': trim(g.get('kurzerklaerung'), 260),
           'kurz': trim(g.get('kurzerklaerung'), 500), 'merkmale': trim(g.get('merkmale'), 200),
           'verweise': ', '.join([f'#{n:02d}' for n in (g.get('verweis_anforderungen') or [])] + (g.get('verweis_auslegungen') or []) + (g.get('verweis_rollen') or [])),
           'flag': g.get('flag') or '', 'ausspielen': g['ausspielen']}
    (glo_s2 if (g.get('flag') or not g['ausspielen']) else glo_s1).append(row)

# ---------------- Rollen ----------------
def_s1, def_s2 = [], []
for d in R['rollen_definitionen']:
    row = {'code': d['rolle_id'], 'titel': f"{d['begriff_de']} ({d.get('begriff_en') or '–'})", 'typ': d['typ'],
           'kern': trim(d['definition_kurz'], 320), 'definition': trim(d['definition_kurz'], 700),
           'abgrenzung': trim(d.get('abgrenzung'), 700), 'fundstellen': d['fundstelle_ppwr'], 'flag': d.get('flag') or '',
           'verpackdg': trim(d.get('verpackdg_bezug'), 400)}
    (def_s2 if d.get('flag') else def_s1).append(row)

reg_s1, reg_s2 = [], []
for r in sorted(R['rollen_regeln'], key=lambda x: (x['block'], x['prioritaet'])):
    row = {'code': r['regel_id'], 'block': r['block'], 'wenn': r['wenn_bedingung'], 'dann': r['dann_rollen'],
           'fundstellen': '; '.join(x for x in [r.get('fundstelle_primaer'), r.get('fundstelle_sekundaer')] if x),
           'erlaeuterung': trim(r.get('erlaeuterung'), 900), 'flag': r.get('flag') or '', 'ebene': r.get('geltungsebene') or ''}
    (reg_s2 if r.get('flag') else reg_s1).append(row)

# ---------------- Templates ----------------
TNAME = {'konformitaetserklaerung': 'Template 1 – EU-Konformitätserklärung (Anhang VIII)', 'techdoku': 'Template 2 – Technische Dokumentation (Anhang VII, Gerüst)',
         'pflichtenuebersicht': 'Template 3 – Pflichtenübersicht je Produktlinie', 'lieferantenanfragen': 'Template 4 – Lieferantenanfragen (Art. 16)'}
tpl = []
for t in R['templates']:
    tpl.append({'key': t['key'], 'titel': TNAME.get(t['key'], t['key']), 'version': t['version'], 'pins': pins(t['inhalt'])})

out = {
    'anf_s1': anf_s1, 'anf_s2': anf_s2, 'aus_s1': aus_s1, 'aus_neu': aus_neu, 'aus_pins': aus_pins,
    'glo_s1': glo_s1, 'glo_s2': glo_s2, 'def_s1': def_s1, 'def_s2': def_s2, 'reg_s1': reg_s1, 'reg_s2': reg_s2, 'tpl': tpl,
    'stats': {'anf': len(A), 'aus': len(U), 'glo': len(G), 'def': len(R['rollen_definitionen']), 'reg': len(R['rollen_regeln']), 'tpl': len(R['templates'])},
}
json.dump(out, open('prep.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print({k: len(v) for k, v in out.items() if isinstance(v, list)})
print('Template-Pins:', sum(len(t['pins']) for t in tpl))
