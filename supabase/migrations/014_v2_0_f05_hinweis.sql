-- v2.0.2 – F05 (Verpackungsarten) entwechseln: Faustregel als Hinweis
-- unter der Frage. Die abgrenzenden Beispiel-Zweitzeilen je Option liegen
-- als Override-Texte in src/lib/wizard-erklaerungen.ts (mit „?“-Link je
-- Option auf das passende Glossar-Lemma).

update wizard_fragen
set hinweis_ui = 'Im Zweifel: Es zählt, wie die Verpackung beim Endkunden ankommt, nicht wie sie im Lager transportiert wird.'
where frage_id = 'F05';
