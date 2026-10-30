// Anhang „Volltexte“: jeder Datensatz der Wissensbasis vollständig, gleiche Codes wie im Prüfpaket.
const fs = require("fs");
const { Document, Packer, Paragraph, TextRun, HeadingLevel, BorderStyle, AlignmentType, Header, Footer, PageNumber, LevelFormat } = require("docx");

const P = JSON.parse(fs.readFileSync("prep.json", "utf8"));
const { A, U, G, R } = P.raw;
const RECHTSSTAND = "30.10.2026";
const GREEN = "24A27F", BLUE = "004494", GREY = "6B7280";
const clean = (s) => (s == null ? "" : String(s)).replace(/\*\*/g, "").replace(/<!--[\s\S]*?-->/g, "");
const run = (t, o = {}) => new TextRun({ text: clean(t), font: "Arial", size: o.size || 19, bold: o.bold, italics: o.italics, color: o.color });
const para = (t, o = {}) => new Paragraph({ spacing: { before: o.before ?? 40, after: o.after ?? 80 }, keepNext: o.keepNext, children: Array.isArray(t) ? t : [run(t, o)] });
const h1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, spacing: { before: 0, after: 160 }, children: [new TextRun({ text: t, font: "Arial", size: 30, bold: true, color: BLUE })] });
const h2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 280, after: 100 }, keepNext: true, children: [new TextRun({ text: t, font: "Arial", size: 24, bold: true, color: "111111" })] });
const kopf = (code, titel, meta) => [
  new Paragraph({ spacing: { before: 260, after: 40 }, keepNext: true, border: { top: { style: BorderStyle.SINGLE, size: 4, color: GREEN, space: 4 } }, children: [run(code + "  ", { bold: true, size: 22, color: BLUE }), run(titel, { bold: true, size: 22 })] }),
  ...(meta ? [para(meta, { size: 16, color: GREY, before: 0, after: 60 })] : []),
];
const feld = (l, t) => (t && String(t).trim() ? [new Paragraph({ spacing: { before: 60, after: 20 }, children: [run(l, { bold: true, size: 18 })] }), ...String(t).split(/\n+/).filter((x) => x.trim()).map((x) => para(x, { size: 18, before: 0, after: 40 }))] : []);
const tat = (t) => (t && typeof t === "object" ? t.text || JSON.stringify(t) : t);
const folgen = (f) => (f && typeof f === "object" ? Object.entries(f).map(([k, v]) => `${k}: ${v}`).join("\n") : f);
const arr = (a) => (Array.isArray(a) ? a.join("; ") : a || "");
const KAT = { stoffrecht: "Stoffrecht", mehrweg: "Mehrweg", konformitaet: "Konformität", kennzeichnung: "Kennzeichnung", rollen_epr: "Rollen / EPR", verbote: "Verbote", sonstiges: "Sonstiges" };
const GILT = { in_kraft: "gilt seit", kuenftig: "gilt ab", rechtsakt_ausstehend: "Rechtsakt ausstehend, geplant ab", entwurf_eu: "EU-Entwurf" };

const c = [];
c.push(
  para("PPWR Radar – by packaging journal", { size: 22, color: GREEN, bold: true, before: 1800, after: 120 }),
  para("Anhang zum Prüfpaket: Volltexte der Wissensbasis", { size: 36, bold: true, color: BLUE, after: 120 }),
  para("Rechtsstand " + RECHTSSTAND + " · Nachschlagewerk zu Teil A–C, gleiche Codes", { size: 22, after: 400 }),
  para("Dieser Anhang enthält jeden Datensatz vollständig, so wie er in der Datenbank steht und – nach Freigabe – im Produkt ausgespielt wird. Er ist zum Nachschlagen gedacht: Teil A des Prüfpakets zeigt je Datensatz nur die Kernaussage; wer einen Datensatz genauer sehen will, findet ihn hier unter demselben Code. Status aller Datensätze: Entwurf, noch nicht ausgespielt.", { after: 200 }),
  para("Inhalt", { bold: true, size: 22, after: 60 }),
  para(`1. Anforderungen #01–#${String(A.length).padStart(2, "0")} (${A.length}) · 2. Praxisfragen A/B/C (${U.length}) · 3. Rollen-Definitionen (${R.rollen_definitionen.length}) · 4. Regeln der Rollen-Engine (${R.rollen_regeln.length}) · 5. Vereinfachungs-Hinweise H01–H08 (${(R.hinweise || []).length}) · 6. Glossar (${G.length}) · 7. Onboarding-Fragebogen (${(R.wizard_fragen || []).length}). Die vier Dokumentvorlagen stehen im Prüfpaket, Teil B.5.`, { size: 19 }),
);

c.push(h1(`1. Anforderungen (${A.length})`));
for (const a of [...A].sort((x, y) => x.nr - y.nr)) {
  c.push(...kopf(`#${String(a.nr).padStart(2, "0")}`, a.titel, `${KAT[a.kategorie] || a.kategorie} · ${GILT[a.gilt_status] || a.gilt_status} ${a.gilt_ab || ""} · Rechtsquelle: ${a.rechtsquelle || "–"}${a.verpackdg_quelle ? " · VerpackDG: " + a.verpackdg_quelle : ""} · Rechtsstand ${a.rechtsstand} · Version ${a.version || "–"} · betrifft Rollen: ${arr(a.betrifft_rollen) || "–"}`));
  c.push(...feld("Kurzerklärung (einfach):", a.kurzerklaerung));
  c.push(...feld("Erklärung (fachlich):", a.erklaerung_fachlich));
  c.push(...feld("Erklärung (Rechtstext):", a.erklaerung_rechtstext));
  c.push(...feld("Tatbestand:", tat(a.tatbestand)));
  c.push(...feld("Rechtsfolgen je Rolle:", folgen(a.rechtsfolgen_je_rolle)));
  c.push(...feld("Was zu tun ist:", a.handlungsanweisung));
  c.push(...feld("Risiko bei Verstoß:", a.risiko_bei_verstoss));
  c.push(...feld("Ausnahmen:", a.ausnahmen));
  c.push(...feld("Übergangsregeln:", a.uebergangsregeln));
  c.push(...feld("VerpackDG-Ebene:", a.verpackdg_layer));
}

c.push(h1(`2. Praxisfragen (${U.length})`));
const block = { A: "Block A – Rollen-Grenzfälle", B: "Block B – PPWR × VerpackDG", C: "Block C – Konformität, Stoffe, Mehrweg, Kennzeichnung" };
let lastBlock = "";
for (const u of [...U].sort((x, y) => x.code.localeCompare(y.code))) {
  if (u.code[0] !== lastBlock) { lastBlock = u.code[0]; c.push(h2(block[lastBlock] || lastBlock)); }
  c.push(...kopf(u.code, u.kurztitel || "", `${KAT[u.kategorie] || u.kategorie} · ${u.verbindlichkeit === "rechtsverbindlich" ? "rechtsverbindlich" : "unverbindliche Auslegung"} · Rechtsstand ${u.rechtsstand}${u.bezug_nr && u.bezug_nr.length ? " · Bezug: " + u.bezug_nr.map((n) => "#" + String(n).padStart(2, "0")).join(", ") : ""}`));
  c.push(...feld("Frage:", u.frage));
  c.push(...feld("Antwort:", u.antwort));
  c.push(...feld("Quellen:", arr(u.quellen)));
  c.push(...feld("Interner Vermerk / offener Punkt:", u.flag));
}

c.push(h1(`3. Rollen-Definitionen (${R.rollen_definitionen.length})`));
for (const d of R.rollen_definitionen) {
  c.push(...kopf(d.rolle_id, `${d.begriff_de} (${d.begriff_en || "–"})`, `${d.typ} · Fundstelle: ${d.fundstelle_ppwr || "–"}`));
  c.push(...feld("Definition:", d.definition_kurz));
  c.push(...feld("Abgrenzung:", d.abgrenzung));
  c.push(...feld("Verwechslungsfälle:", d.verwechslungsfaelle));
  c.push(...feld("VerpackDG-Bezug:", d.verpackdg_bezug));
  c.push(...feld("Leitfaden-Bezug:", d.leitfaden_bezug));
  c.push(...feld("Interner Vermerk:", d.flag));
}

c.push(h1(`4. Regeln der Rollen-Engine (${R.rollen_regeln.length})`));
for (const r of [...R.rollen_regeln].sort((x, y) => x.block.localeCompare(y.block) || x.prioritaet - y.prioritaet)) {
  c.push(...kopf(`Regel ${r.regel_id}`, `Block „${r.block}“ · ${r.geltungsebene || ""}`, `Priorität ${r.prioritaet} · Fundstellen: ${[r.fundstelle_primaer, r.fundstelle_sekundaer].filter(Boolean).join("; ") || "–"}`));
  c.push(...feld("Wenn:", r.wenn_bedingung));
  c.push(...feld("Dann:", r.dann_rollen));
  c.push(...feld("Erläuterung:", r.erlaeuterung));
  c.push(...feld("Interner Vermerk:", r.flag));
}

c.push(h1(`5. Vereinfachungs-Hinweise (${(R.hinweise || []).length})`));
for (const h of R.hinweise || []) {
  c.push(...kopf(h.code, h.titel, `Bedingung: ${h.bedingung_key}${h.verweis_auslegungen && h.verweis_auslegungen.length ? " · Verweise: " + h.verweis_auslegungen.join(", ") : ""}`));
  c.push(...feld("Text:", h.text));
  c.push(...feld("Fundstellen:", arr(h.fundstellen)));
  c.push(...feld("Interner Vermerk:", h.flag));
}

c.push(h1(`6. Glossar (${G.length})`));
for (const g of [...G].sort((x, y) => (x.nr || 0) - (y.nr || 0) || x.code.localeCompare(y.code))) {
  c.push(...kopf(g.code, g.lemma, `${g.typ || ""}${g.synonyme && (Array.isArray(g.synonyme) ? g.synonyme.length : g.synonyme) ? " · Synonyme: " + arr(g.synonyme) : ""}`));
  c.push(...feld("Kurzerklärung:", g.kurzerklaerung));
  c.push(...feld("Merkmale:", g.merkmale));
  const verweise = [...(g.verweis_anforderungen || []).map((n) => "#" + String(n).padStart(2, "0")), ...(g.verweis_auslegungen || []), ...(g.verweis_rollen || [])].join(", ");
  c.push(...feld("Verweise:", verweise));
  c.push(...feld("Interner Vermerk:", g.flag));
}

c.push(h1(`7. Onboarding-Fragebogen (${(R.wizard_fragen || []).length})`));
for (const w of [...(R.wizard_fragen || [])].sort((x, y) => x.reihenfolge - y.reihenfolge)) {
  c.push(...kopf(w.frage_id, w.frage_text, `Ebene ${w.ebene} · ${w.antwort_typ} · Variable ${w.ziel_variable || "–"} · Anzeige: ${w.bedingung_anzeige || "immer"} · speist Regeln: ${w.gespeiste_regeln || "–"}`));
  c.push(...feld("Antwortoptionen:", (w.antwort_optionen || "").split("|").map((o) => o.trim()).filter(Boolean).join("\n")));
  c.push(...feld("Hinweis im UI:", w.hinweis_ui));
}

const doc = new Document({
  creator: "PPWR Radar – packaging journal",
  title: "Anhang Volltexte – Prüfpaket Cattwyk – Rechtsstand " + RECHTSSTAND,
  styles: { default: { document: { run: { font: "Arial", size: 19 } } } },
  numbering: { config: [{ reference: "bul", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 420, hanging: 280 } } } }] }] },
  sections: [{
    properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
    headers: { default: new Header({ children: [new Paragraph({ children: [run("PPWR Radar – by packaging journal · Anhang Volltexte · Rechtsstand " + RECHTSSTAND, { size: 16, color: GREY })], border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: GREEN, space: 4 } } })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [run("Seite ", { size: 16, color: GREY }), new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 16, color: GREY }), run(" von ", { size: 16, color: GREY }), new TextRun({ children: [PageNumber.TOTAL_PAGES], font: "Arial", size: 16, color: GREY })] })] }) },
    children: c,
  }],
});
Packer.toBuffer(doc).then((buf) => { fs.writeFileSync("Anhang_Volltexte_Wissensbasis_2026-10-30.docx", buf); console.log("ok", buf.length); });
