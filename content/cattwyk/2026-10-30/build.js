const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType,
  HeadingLevel, BorderStyle, ShadingType, PageBreak, Header, Footer, PageNumber, LevelFormat,
  TableLayoutType, VerticalAlign,
} = require("docx");

const P = JSON.parse(fs.readFileSync("prep.json", "utf8"));
const DATUM = "30. Oktober 2026";
const RECHTSSTAND = "30.10.2026";
const GREEN = "24A27F", BLUE = "004494", GREY = "6B7280", LIGHT = "F3F4F6", TINT = "E9F6F1";
const CONTENT = 9638; // A4 minus 2 cm margins, DXA

const clean = (s) => (s || "").replace(/\*\*/g, "").replace(/<!--.*?-->/g, "");

// ---------- helpers ----------
const run = (text, o = {}) => new TextRun({ text: clean(text), font: "Arial", size: o.size || 20, bold: o.bold, italics: o.italics, color: o.color });
const para = (text, o = {}) => new Paragraph({
  children: Array.isArray(text) ? text : [run(text, o)],
  spacing: { before: o.before ?? 60, after: o.after ?? 60, line: o.line },
  alignment: o.align, heading: o.heading, keepNext: o.keepNext, pageBreakBefore: o.pageBreakBefore,
  shading: o.shade ? { type: ShadingType.CLEAR, fill: o.shade, color: "auto" } : undefined,
  border: o.topBorder ? { top: { style: BorderStyle.SINGLE, size: 6, color: GREEN, space: 4 } } : undefined,
  indent: o.indent,
});
const h1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, spacing: { before: 0, after: 160 }, children: [new TextRun({ text: t, font: "Arial", size: 32, bold: true, color: BLUE })] });
const h2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 280, after: 120 }, keepNext: true, children: [new TextRun({ text: t, font: "Arial", size: 26, bold: true, color: "111111" })] });
const h3 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 80 }, keepNext: true, children: [new TextRun({ text: t, font: "Arial", size: 22, bold: true, color: BLUE })] });
const small = (t, o = {}) => para(t, { size: 17, color: GREY, ...o });
const label = (l, t) => new Paragraph({ spacing: { before: 40, after: 40 }, children: [run(l + " ", { bold: true, size: 19 }), run(t, { size: 19 })] });
const bullets = (items) => items.map((t) => new Paragraph({ numbering: { reference: "bul", level: 0 }, spacing: { before: 30, after: 30 }, children: [run(t)] }));
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const thin = { style: BorderStyle.SINGLE, size: 4, color: "C7CBD1" };

function cell(children, width, o = {}) {
  return new TableCell({
    children: Array.isArray(children) ? children : [children],
    width: { size: width, type: WidthType.DXA },
    shading: o.fill ? { type: ShadingType.CLEAR, fill: o.fill, color: "auto" } : undefined,
    margins: { top: 60, bottom: 60, left: 90, right: 90 },
    verticalAlign: o.valign || VerticalAlign.TOP,
    borders: o.borders,
  });
}
function table(widths, rows, o = {}) {
  return new Table({
    width: { size: CONTENT, type: WidthType.DXA }, columnWidths: widths, layout: TableLayoutType.FIXED,
    rows: rows.map((r, i) => new TableRow({ children: r, tableHeader: i === 0 && o.header !== false, cantSplit: true })),
  });
}
const headCell = (t, w) => cell(para(t, { bold: true, size: 18, color: "FFFFFF", before: 0, after: 0 }), w, { fill: BLUE });
const txt = (t, o = {}) => para(t, { size: 18, before: 0, after: 0, ...o });
const check = (t) => para("☐ " + t, { size: 18, before: 0, after: 20 });

// ---------- Teil A: Sammelfreigabe table ----------
function sammelTabelle(rows, opts) {
  // rows: [{code,titel,kern,fundstellen}]
  const w = [1250, 2250, 3400, 1738, 1000];
  const out = [[headCell("Nr.", w[0]), headCell(opts.titelLabel || "Titel", w[1]), headCell("Kernaussage", w[2]), headCell("Fundstelle(n)", w[3]), headCell("Prüfung", w[4])]];
  for (const r of rows) {
    out.push([
      cell(txt(r.code, { bold: true }), w[0]),
      cell(txt(r.titel), w[1]),
      cell(txt(r.kern), w[2]),
      cell(txt(r.fundstellen, { size: 16 }), w[3]),
      cell([check("ok"), check("Anm.")], w[4]),
    ]);
  }
  return table(w, out);
}
function blockFreigabe(name, anzahl) {
  return [
    para("", { after: 40 }),
    new Table({
      width: { size: CONTENT, type: WidthType.DXA }, columnWidths: [CONTENT], layout: TableLayoutType.FIXED,
      rows: [new TableRow({ children: [cell([
        para(`Sammelfreigabe ${name} (${anzahl} Datensätze)`, { bold: true, size: 20, before: 0 }),
        para("☐  Freigegeben wie vorgelegt, mit Ausnahme der oben mit „Anm.“ markierten Nummern (Anmerkungen bitte am Rand oder in Teil D).", { size: 19 }),
        para("☐  Nicht freigegeben, Gesamtbesprechung erforderlich.", { size: 19 }),
        para("Datum / Kürzel: ______________________________", { size: 19, before: 120, after: 0 }),
      ], CONTENT, { fill: TINT })] })],
    }),
  ];
}

// ---------- Teil B: Karten ----------
function entscheidung() {
  const w = [3212, 3213, 3213];
  return table(w, [[
    cell(check("Freigeben wie vorgelegt"), w[0], { fill: LIGHT }),
    cell(check("Ändern (Hinweis unten)"), w[1], { fill: LIGHT }),
    cell(check("Streichen / nicht ausspielen"), w[2], { fill: LIGHT }),
  ]], { header: false });
}
const anmerkung = () => [para("Anmerkung der Kanzlei:", { size: 18, bold: true, before: 80, after: 20 }), para("", { after: 0 }), para("______________________________________________________________________________________", { size: 18, color: GREY, before: 0, after: 160 })];

function karteAuslegung(u, i) {
  return [
    para([run(`${u.code}  `, { bold: true, size: 22, color: BLUE }), run(u.titel, { bold: true, size: 22 })], { before: 240, after: 40, keepNext: true, topBorder: true }),
    small(`${u.block} · ${u.kategorie} · ${u.verbindlichkeit}${u.bezug ? " · Bezug: " + u.bezug : ""}`),
    label("Frage aus der Praxis:", u.frage),
    label("Unsere Antwort (Entwurf):", u.antwort_kurz),
    label("Fundstellen:", u.fundstellen),
    new Paragraph({ spacing: { before: 60, after: 60 }, shading: { type: ShadingType.CLEAR, fill: "FFF7E0", color: "auto" }, children: [run("Offener Punkt für die Kanzlei: ", { bold: true, size: 19 }), run(u.flag.replace(/^\(neu 10\/2026\)\s*/, "") || "Freigabe der Aussage und der Fundstellen.", { size: 19 })] }),
    entscheidung(), ...anmerkung(),
  ];
}
function karteRegel(r) {
  return [
    para([run(`Regel ${r.code}  `, { bold: true, size: 22, color: BLUE }), run(`Block „${r.block}“ · ${r.ebene}`, { size: 20 })], { before: 240, after: 40, keepNext: true, topBorder: true }),
    label("Wenn:", r.wenn), label("Dann:", r.dann), label("Fundstellen:", r.fundstellen), label("Erläuterung:", r.erlaeuterung),
    new Paragraph({ spacing: { before: 60, after: 60 }, shading: { type: ShadingType.CLEAR, fill: "FFF7E0", color: "auto" }, children: [run("Offener Punkt für die Kanzlei: ", { bold: true, size: 19 }), run(r.flag === "!" ? "Regel ist als unsicher markiert (!). Bitte Tatbestand, Rechtsfolge und Fundstellen bestätigen oder korrigieren." : r.flag, { size: 19 })] }),
    entscheidung(), ...anmerkung(),
  ];
}
function karteDefinition(d) {
  return [
    para([run(`${d.titel}  `, { bold: true, size: 22, color: BLUE }), run(`(${d.code}, ${d.typ})`, { size: 20 })], { before: 240, after: 40, keepNext: true, topBorder: true }),
    label("Definition:", d.definition), label("Abgrenzung:", d.abgrenzung), label("Fundstelle:", d.fundstellen), label("VerpackDG-Bezug:", d.verpackdg),
    new Paragraph({ spacing: { before: 60, after: 60 }, shading: { type: ShadingType.CLEAR, fill: "FFF7E0", color: "auto" }, children: [run("Offener Punkt für die Kanzlei: ", { bold: true, size: 19 }), run("Definition ist als unsicher markiert (!). Bitte Wortlautnähe und Abgrenzung bestätigen.", { size: 19 })] }),
    entscheidung(), ...anmerkung(),
  ];
}
function pinTabelle(rows) {
  // rows: [{code,titel,pin}]
  const w = [1700, 5338, 2600];
  const out = [[headCell("Datensatz", w[0]), headCell("Offener Punkt (unsere Lesart, Markierung (!))", w[1]), headCell("Entscheidung", w[2])]];
  for (const r of rows) {
    out.push([
      cell([txt(r.code, { bold: true }), txt(r.titel, { size: 16, color: GREY })], w[0]),
      cell(txt(r.pin), w[1]),
      cell([check("bestätigt"), check("korrigieren:"), para("", { after: 0 }), para("________________", { size: 16, color: GREY, before: 0, after: 0 })], w[2]),
    ]);
  }
  return table(w, out);
}

function karteHinweis(h) {
  return [
    para([run(`${h.code}  `, { bold: true, size: 22, color: BLUE }), run(h.titel, { bold: true, size: 22 })], { before: 240, after: 40, keepNext: true, topBorder: true }),
    small(`Vereinfachungs-Hinweis · wird dem Nutzer angezeigt, wenn Bedingung „${h.key}“ greift${h.verweise ? " · Verweise: " + h.verweise : ""}`),
    label("Text (Entwurf):", h.text),
    label("Fundstellen:", h.fundstellen),
    new Paragraph({ spacing: { before: 60, after: 60 }, shading: { type: ShadingType.CLEAR, fill: "FFF7E0", color: "auto" }, children: [run("Offener Punkt für die Kanzlei: ", { bold: true, size: 19 }), run((h.flag || "").replace(/^\(neu 10\/2026\)\s*/, "") || "Freigabe des Hinweises.", { size: 19 })] }),
    entscheidung(), ...anmerkung(),
  ];
}

// ---------- build ----------
const S = P.stats;
const stufe2Anz = P.aus_neu.length + P.aus_pins.length + P.reg_s2.length + P.def_s2.length + P.hin.length;
const pinsAnz = P.anf_s2.reduce((n, a) => n + a.pins.length, 0) + P.tpl.reduce((n, t) => n + t.pins.length, 0);
const stufe1Anz = P.def_s1.length + P.reg_s1.length + P.anf_s1.length + P.aus_s1.length + P.glo_s1.length;

const children = [];

// Titel
children.push(
  para("PPWR Radar – by packaging journal", { size: 22, color: GREEN, bold: true, before: 1800, after: 120 }),
  para("Prüfpaket für Cattwyk Rechtsanwaltsgesellschaft", { size: 40, bold: true, color: BLUE, after: 120 }),
  para("Verifikation der Wissensbasis · Rechtsstand " + RECHTSSTAND, { size: 24, after: 600 }),
  para("Für: Dr. Julia Hörnig und Franziska Kaiser", { size: 22 }),
  para("Von: Jan Malte Andresen, packaging journal (ella Verlag und Medien GmbH)", { size: 22 }),
  para("Datum: " + DATUM, { size: 22, after: 600 }),
  para("Inhalt", { bold: true, size: 22, after: 80 }),
  ...bullets([
    `Prioritäten – Leseanleitung: die sieben Punkte, an denen wir Ihre Einordnung zuerst brauchen (Session-Pflicht), danach Priorität 2 und 3.`,
    `Teil A – Sammelfreigabe: ${stufe1Anz} Datensätze ohne offenen Punkt, als Tabellen zum Querlesen (Zeitbedarf etwa 60 bis 90 Minuten).`,
    `Teil B – Einzelprüfung: ${stufe2Anz} Datensätze mit konkreter Frage an die Kanzlei, je eine Karte mit drei Kästchen, darunter ${P.aus_neu.length} neue Praxisfragen zur Rechtsentwicklung seit Juli 2026.`,
    `Teil C – Fundstellen-Bestätigungen: ${pinsAnz} markierte Stellen (!) in Anforderungen und Dokumentvorlagen, als Tabelle zum Abhaken.`,
    `Teil D – Gesamtfreigabe und Rückgabe.`,
  ]),
  para("", { after: 200 }),
  small("Vertraulich. Dieses Paket ist aus der Datenbank von PPWR Radar generiert (Stand " + RECHTSSTAND + "). Jeder Datensatz trägt seinen Code, mit dem die Entscheidung der Kanzlei direkt in das System übernommen wird."),
);

// Anleitung
children.push(
  h1("So funktioniert dieses Paket"),
  para("Liebe Frau Dr. Hörnig, liebe Frau Kaiser,", { after: 120 }),
  para("das Projekt lag seit August auf Eis, jetzt gehen wir an den Start. Die Wissensbasis von PPWR Radar erklärt Unternehmen, welche Rolle sie nach der PPWR haben und welche Pflichten daraus folgen, mit Fundstelle an jeder Aussage. Nichts davon ist Rechtsberatung; das Produkt „erklärt, ordnet ein, priorisiert, erstellt Entwürfe“. Ihre Aufgabe ist die juristische Plausibilisierung: Stimmt die Aussage, stimmt die Fundstelle, ist die Grenze richtig gezogen."),
  para("Wir haben alle Inhalte am 17.10.2026 gegen die Rechtsentwicklung seit Juli abgeglichen (Kommissions-FAQ 2. Edition vom 3. August, Berichtigung der deutschen PPWR-Fassung vom 4. August, ZSVR-Veröffentlichungen, Mindeststandard 2026, Rechtsprechung, laufende EU-Verfahren). Seitdem läuft ein wöchentliches Rechtsmonitoring; die Läufe vom 19.10. und 26.10.2026 sind eingearbeitet, insbesondere die Position des Europäischen Parlaments (20.10.) und das Ratsmandat (21.10.) zum Bevollmächtigten, die Verschiebung des Kennzeichnungs-Durchführungsakts auf das zweite Quartal 2027 und der neue KMU-Leitfaden der Kommission „PPWR and small businesses“ vom 19.10.2026 (liegt bei). Die drei Delta-Listen mit allen Quellen liegen als Beilage bei."),
  para("Vor Teil A finden Sie eine Prioritätenliste: sieben Punkte, an denen die Rechtslage, die Behördenpraxis oder unsere Daten so auseinanderliegen, dass wir Ihre Einordnung in der Session brauchen. Wer wenig Zeit hat, liest diese Liste und Teil B.1; der Rest kann folgen."),
  h2("Drei Stufen, drei Aufwände"),
  ...bullets([
    "Teil A ist zum Querlesen gedacht: eine Zeile je Datensatz, Kernaussage und Fundstelle. Was Ihnen auffällt, markieren Sie mit „Anm.“ und notieren den Hinweis am Rand. Alles andere geben Sie je Block mit einem Haken frei.",
    "Teil B enthält die Stellen, an denen wir Ihre Einordnung wirklich brauchen: Grenzfälle, Divergenzen zwischen Kommission und ZSVR, Regeln der Rollen-Engine, Neues seit Juli. Je Karte drei Kästchen: freigeben, ändern, streichen.",
    "Teil C sind reine Fundstellen-Bestätigungen: Stellen, an denen wir im Text eine Norm oder einen Absatz als unsicher (!) markiert haben. Bestätigen oder korrigieren.",
  ]),
  h2("Was für Sie am einfachsten ist"),
  ...bullets([
    "Word: Kästchen anklicken oder ein X setzen, Anmerkungen direkt in die Zeilen schreiben, Datei zurückschicken.",
    "PDF: Ausdrucken oder im Reader kommentieren, Scan oder Datei zurückschicken.",
    "Gemeinsam: Wir bieten eine Videosession von 90 Minuten an, in der wir Teil B zusammen durchgehen; die Entscheidungen werden dabei live im System gesetzt. Teil A und C können Sie vorab oder danach erledigen.",
  ]),
  h2("Legende"),
  ...bullets([
    "Fundstellen: PPWR = VO (EU) 2025/40 (rechtsverbindlich); VerpackDG = BGBl. 2026 I Nr. 207 (rechtsverbindlich); Leitfaden C(2026) 3702 und Kommissions-FAQ = unverbindliche Auslegung der EU-Kommission; ZSVR, UBA = Behördeninformation, keine Rechtsnorm.",
    "Codes: #01–#40 Anforderungen (Pflichten), A/B/C Praxisfragen (Auslegungen), A1–C6 Regeln der Rollen-Engine, L01–L67 Glossar, T/V/U/E/Q-Pins aus früheren Paketen.",
    "(!) markiert eine Stelle, an der wir uns nicht sicher waren und bewusst nicht stillschweigend interpretiert haben.",
    "Datensätze, die Sie freigeben, erscheinen im Produkt mit dem Hinweis „juristisch plausibilisiert durch Cattwyk“. Bis dahin tragen redaktionell geprüfte Inhalte den Hinweis „juristische Prüfung läuft“.",
  ]),
);

// Prioritäten (aus der konsolidierten Liste vom 26.10.2026, Markdown)
function mdToParas(md) {
  const out = [];
  const lines = md.split("\n");
  for (let line of lines) {
    if (!line.trim()) continue;
    if (line.startsWith("# ")) continue; // Dokumenttitel entfällt
    if (line.startsWith("## ")) { out.push(h2(line.slice(3).trim())); continue; }
    if (line.startsWith("### ")) { out.push(h3(line.slice(4).trim())); continue; }
    if (line.trim() === "---") continue;
    if (/^\s*[-*] /.test(line)) {
      const t = line.replace(/^\s*[-*] /, "");
      const m = t.match(/^\*\*([^*]+)\*\*:?\s*(.*)$/);
      if (m) out.push(new Paragraph({ numbering: { reference: "bul", level: 0 }, spacing: { before: 30, after: 30 }, children: [run(m[1].replace(/:$/, "") + ": ", { bold: true, size: 19 }), run(m[2], { size: 19 })] }));
      else out.push(new Paragraph({ numbering: { reference: "bul", level: 0 }, spacing: { before: 30, after: 30 }, children: [run(t, { size: 19 })] }));
      continue;
    }
    if (/^\d+\. /.test(line)) { out.push(para(line, { size: 19, before: 30, after: 30 })); continue; }
    out.push(para(line, { size: 19, after: 100 }));
  }
  return out;
}
children.push(h1("Prioritäten – wo wir Ihre Einordnung zuerst brauchen"));
children.push(para("Stand 30.10.2026, zusammengeführt aus den Flag-Feldern der Datenbank und den Delta-Recherchen vom 17.10., 19.10. und 26.10.2026. Die Codes verweisen auf die Karten in Teil B und die Zeilen in Teil A. Priorität 1 ist Gegenstand der Videosession; Priorität 2 bitte vor Freigabe der betroffenen Datensätze; Priorität 3 ist Hintergrund.", { size: 19, after: 160 }));
children.push(...mdToParas(fs.readFileSync("prioritaeten.md", "utf8")));

// Teil A
children.push(h1("Teil A – Sammelfreigabe"));
children.push(para("Je Zeile ein Datensatz. Kernaussage ist der erste Satz der Kurzerklärung; die vollständigen Texte liegen im System und können jederzeit nachgereicht werden. Prüfen Sie Kernaussage und Fundstelle; markieren Sie Auffälliges mit „Anm.“. Am Ende jedes Blocks die Sammelfreigabe.", { after: 160 }));

children.push(h2(`A.1 Rollen-Definitionen (${P.def_s1.length})`));
children.push(sammelTabelle(P.def_s1.map((d) => ({ code: d.code, titel: d.titel, kern: d.kern, fundstellen: d.fundstellen })), { titelLabel: "Begriff" }));
children.push(...blockFreigabe("Rollen-Definitionen", P.def_s1.length));

children.push(h2(`A.2 Regeln der Rollen-Engine ohne offenen Punkt (${P.reg_s1.length})`));
children.push(sammelTabelle(P.reg_s1.map((r) => ({ code: r.code, titel: "Dann: " + r.dann, kern: r.erlaeuterung.length > 320 ? r.erlaeuterung.slice(0, 320).replace(/\s\S*$/, "") + " …" : r.erlaeuterung, fundstellen: r.fundstellen })), { titelLabel: "Rechtsfolge" }));
children.push(...blockFreigabe("Rollen-Regeln", P.reg_s1.length));

children.push(h2(`A.3 Anforderungen ohne offenen Punkt (${P.anf_s1.length})`));
children.push(sammelTabelle(P.anf_s1.map((a) => ({ code: a.code, titel: `${a.titel} · ${a.gilt}`, kern: a.kern, fundstellen: a.fundstellen })), {}));
children.push(...blockFreigabe("Anforderungen", P.anf_s1.length));

children.push(h2(`A.4 Praxisfragen ohne offenen Punkt (${P.aus_s1.length})`));
children.push(sammelTabelle(P.aus_s1.map((u) => ({ code: u.code, titel: u.titel, kern: u.kern, fundstellen: u.fundstellen })), { titelLabel: "Praxisfrage" }));
children.push(...blockFreigabe("Praxisfragen", P.aus_s1.length));

children.push(h2(`A.5 Glossar ohne offenen Punkt (${P.glo_s1.length})`));
children.push(para("Das Glossar enthält keine eigenständigen Rechtsaussagen, nur beschreibende Einordnung und Verweise auf die geprüften Datensätze. Prüfbitte: Ist ein Begriff falsch einsortiert oder ein Verweis irreführend?", { size: 19 }));
children.push(sammelTabelle(P.glo_s1.map((g) => ({ code: g.code, titel: `${g.lemma} (${g.typ})`, kern: g.kern, fundstellen: g.verweise ? "Verweise: " + g.verweise : "–" })), { titelLabel: "Lemma" }));
children.push(...blockFreigabe("Glossar", P.glo_s1.length));

// Teil B
children.push(h1("Teil B – Einzelprüfung"));
children.push(para(`${stufe2Anz} Datensätze mit einer konkreten Frage an die Kanzlei. Je Karte: unsere Aussage, die Fundstellen, der offene Punkt, drei Kästchen. Wenn Sie „Ändern“ wählen, genügt ein Satz in der Anmerkungszeile; wir formulieren den Datensatz um und legen ihn Ihnen erneut vor.`, { after: 160 }));

children.push(h2(`B.1 Neu seit Juli 2026 (${P.aus_neu.length} Praxisfragen)`));
children.push(para("Diese Datensätze sind aus der Rechtsentwicklung seit dem 17.07.2026 entstanden und waren noch in keinem Paket. Die wichtigsten Konflikte: Versandetikett und Zusammenfügen von Versandverpackungen (Kommission vs. ZSVR, A30/A31), Lagerware per Begleitdokument (C15, Spannung zu #10), Kennzeichnungstermine als Mindestdaten (C14), Bevollmächtigter zwischen Rechtslage und Politik (A35).", { size: 19, after: 120 }));
P.aus_neu.forEach((u, i) => children.push(...karteAuslegung(u, i)));

children.push(h2(`B.2 Rollen-Engine: Regeln und Definitionen mit Vorbehalt (${P.reg_s2.length + P.def_s2.length})`));
children.push(para("Die Rollen-Engine ist das sensibelste Modul: Aus diesen Regeln leitet das System je Produktlinie ab, ob ein Unternehmen Erzeuger, Hersteller, Importeur oder Vertreiber ist. Regeln mit Vorbehalt (!) werden dem Nutzer heute mit einem Hinweis ausgespielt; nach Ihrer Freigabe entfällt der Hinweis.", { size: 19, after: 120 }));
P.reg_s2.forEach((r) => children.push(...karteRegel(r)));
P.def_s2.forEach((d) => children.push(...karteDefinition(d)));

children.push(h2(`B.3 Vereinfachungs-Hinweise der Verpackungs-Ebene (${P.hin.length})`));
children.push(para("Neu seit 17.10.2026: Das System bestimmt Rollen und Pflichten je Verpackung (Regeln D1–D5 in B.2) und zeigt dem Nutzer dazu Hinweise, wie er Pflichten durch Beschaffung oder Verpackungswahl vereinfachen kann, etwa Umschlag statt selbst angewendeter Folie oder Bezug beim deutschen Lieferanten. Jeder Hinweis trägt den festen Satz, dass es sich um einen Hinweis zur Vereinfachung und nicht um eine Empfehlung im Einzelfall handelt. Bitte prüfen: Ist die Aussage so tragfähig, und ist die Abgrenzung zur Rechtsberatung gewahrt?", { size: 19, after: 120 }));
P.hin.forEach((h) => children.push(...karteHinweis(h)));

children.push(h2(`B.4 Praxisfragen mit offenem Punkt aus früheren Paketen (${P.aus_pins.length})`));
P.aus_pins.forEach((u, i) => children.push(...karteAuslegung(u, i)));

// Teil C
children.push(h1("Teil C – Fundstellen-Bestätigungen"));
children.push(para(`${pinsAnz} Stellen, an denen wir eine Fundstelle oder einen Absatz als unsicher (!) markiert haben. Es geht nur um die Markierung, nicht um den gesamten Datensatz. Bestätigen Sie, oder tragen Sie die richtige Fundstelle ein.`, { after: 160 }));
children.push(h2(`C.1 Anforderungen (${P.anf_s2.length} Datensätze)`));
const anfPins = [];
for (const a of P.anf_s2) {
  if (a.pins.length === 0) anfPins.push({ code: a.code, titel: a.titel, pin: "Datensatz ist nicht zur Ausspielung freigegeben (ausspielen = false). Bitte entscheiden, ob er mit dem heutigen Stand ausgespielt werden kann." });
  for (const p of a.pins) anfPins.push({ code: a.code, titel: a.titel, pin: p });
}
children.push(pinTabelle(anfPins));
children.push(h2(`C.2 Dokumentvorlagen des Generators (${P.tpl.length})`));
children.push(para("Die vier Vorlagen folgen wörtlich Anhang VII und VIII PPWR bzw. den freigegebenen Anforderungen. Markiert sind nur die Stellen, an denen Formulierung oder Fundstelle zu bestätigen sind.", { size: 19 }));
const tplPins = [];
for (const t of P.tpl) for (const p of t.pins) tplPins.push({ code: t.titel.split(" – ")[0], titel: t.titel.split(" – ")[1] || "", pin: p });
children.push(pinTabelle(tplPins));
children.push(h2(`C.3 Glossar: strittige Einordnungen (${P.glo_s2.length})`));
children.push(pinTabelle(P.glo_s2.map((g) => ({ code: g.code, titel: g.lemma, pin: (g.flag || "Nicht zur Ausspielung freigegeben.") + (g.kurz ? " — Unsere Einordnung: " + g.kurz : "") }))));

// Teil D
children.push(h1("Teil D – Gesamtfreigabe und Rückgabe"));
children.push(para("Mit der Gesamtfreigabe bestätigen Sie, dass die in Teil A freigegebenen Blöcke und die in Teil B und C mit „freigeben“ bzw. „bestätigt“ markierten Datensätze im Produkt als „juristisch plausibilisiert durch Cattwyk Rechtsanwaltsgesellschaft“ ausgespielt werden dürfen. Datensätze mit „Ändern“ legen wir Ihnen nach Überarbeitung erneut vor; Datensätze mit „Streichen“ werden nicht ausgespielt.", { after: 200 }));
children.push(table([4819, 4819], [
  [cell([para("Dr. Julia Hörnig", { bold: true }), para("", { after: 400 }), para("______________________________", { color: GREY }), small("Datum, Unterschrift")], 4819, { borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder } }),
   cell([para("Franziska Kaiser", { bold: true }), para("", { after: 400 }), para("______________________________", { color: GREY }), small("Datum, Unterschrift")], 4819, { borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder } })],
], { header: false }));
children.push(h2("Rückgabe"));
children.push(...bullets([
  "Per E-Mail an Jan Malte Andresen (ausgefülltes Word, kommentiertes PDF oder Scan).",
  "Oder in der gemeinsamen Videosession (90 Minuten); dort setzen wir die Entscheidungen direkt im System.",
  "Nach Eingang übernehmen wir die Entscheidungen anhand der Codes, protokollieren den Freigabestand mit Datum und senden Ihnen die Liste der geänderten Datensätze zur Gegenkontrolle.",
]));
children.push(h2("Anmerkungen (frei)"));
for (let i = 0; i < 14; i++) children.push(para("______________________________________________________________________________________", { color: GREY, before: 120, after: 0 }));

const doc = new Document({
  creator: "PPWR Radar – packaging journal",
  title: "Prüfpaket Cattwyk – PPWR Radar – Rechtsstand " + RECHTSSTAND,
  styles: { default: { document: { run: { font: "Arial", size: 20 } } } },
  numbering: { config: [{ reference: "bul", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 420, hanging: 280 } } } }] }] },
  sections: [{
    properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
    headers: { default: new Header({ children: [new Paragraph({ children: [run("PPWR Radar – by packaging journal · Prüfpaket Cattwyk · Rechtsstand " + RECHTSSTAND, { size: 16, color: GREY })], border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: GREEN, space: 4 } } })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [run("Seite ", { size: 16, color: GREY }), new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 16, color: GREY }), run(" von ", { size: 16, color: GREY }), new TextRun({ children: [PageNumber.TOTAL_PAGES], font: "Arial", size: 16, color: GREY })] })] }) },
    children,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync("Cattwyk_Pruefpaket_PPWR-Radar_2026-10-30.docx", buf);
  console.log("ok", buf.length, { stufe1Anz, stufe2Anz, pinsAnz });
});
