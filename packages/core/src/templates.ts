/**
 * Kanonische Skeletons für die vier Pflichtdateien eines STEPWELL-Projekts
 * (M8/9.4 — Variante A: Vorlagen als Read-Only-Resource, kein init_project-Tool,
 * M4-Guardrail). contents frei: projektname ersetzen, sonst unverändert übernehmen.
 * docs_validate bleibt an den geleerten Skeletons fund-frei (Test: templates.test.ts).
 */
export type TemplateKind = "backlog" | "progress" | "backlog-archive" | "progress-archive";

export const TEMPLATE_KINDS: readonly TemplateKind[] = [
  "backlog",
  "progress",
  "backlog-archive",
  "progress-archive",
];

const BACKLOG = `# BACKLOG.md — Offene Punkte (Stand: JJMMDD/HHMM)

> **Diese Datei enthält nur OFFENE Items.** Erledigte Items werden nach dem Abschluss
> **unverändert** in \`docs/archive/BACKLOG_ARCHIVE.md\` verschoben; hier bleibt je Item nur ein Einzeiler
> im Erledigt-Index (unten). Fundstellen/Fix-Ideen/Decisions nicht löschen — ins Archiv verschieben.
> Legende: 🔴 kritisch · 🟠 hoch · 🟡 mittel · 🟢 niedrig · 🔵 Test-Lücke
> Abarbeitung: sequenziell nach Priorität (🔴 → 🟠 → 🟡 → 🟢 → 🔵), jedes Item test-first, Commit pro Item.

---

## 🔴 KRITISCH

> Keine offenen Items.

---

## 🟠 HOCH

> Keine offenen Items.

---

## 🟡 MITTEL

> Keine offenen Items.

---

## 🟢 NIEDRIG

> Keine offenen Items.

---

## 🔵 TEST-LÜCKEN

> Keine offenen Items.

---

## ✅ Erledigt-Index

> (Einzeiler je abgeschlossenem Item, mit Commit-Hash; Details im Archiv.)
`;

const PROGRESS = `# Projekt-Tracking: <Projektname>

> Quellen-Methode: \`docs/PLAYBOOK.md\` (verbatim)
> Fortschrittsdatei — wird nach jedem Step aktualisiert.
> Legende: ⬜ offen · 🔄 in Arbeit · ✅ fertig · ⛔ blockiert

> **Struktur (Archiv-Muster):** Diese Datei enthält die **vollständige Fortschrittstabelle**
> und Detail-Blöcke **nur für laufende/offene Phasen**. Detail-Blöcke abgeschlossener Phasen
> wandern nach Abschluss **unverändert** in \`docs/archive/PROGRESS_ARCHIVE.md\`.

## Laufende Phasen

---

## Fortschritt

| # | Step | Status |
|---|------|--------|
`;

const BACKLOG_ARCHIVE = `# BACKLOG_ARCHIVE.md — Archiv erledigter Items (append-only)

> Items werden **unverändert** hierher verschoben; nachträgliche Ergänzungen nur als
> neuer Abschnitt unterhalb des Items. Neueste Items unten anfügen.

---
`;

const PROGRESS_ARCHIVE = `# PROGRESS_ARCHIVE.md — Archiv abgeschlossener Phasen (append-only)

> Detail-Blöcke wandern **unverändert** hierher; die Fortschrittstabelle bleibt
> vollständig in \`PROGRESS.md\` (dauerhafter Index).

---
`;

export const projectTemplates: Record<TemplateKind, string> = {
  backlog: BACKLOG,
  progress: PROGRESS,
  "backlog-archive": BACKLOG_ARCHIVE,
  "progress-archive": PROGRESS_ARCHIVE,
};
