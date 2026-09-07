export const LOCALES = ["de", "en"] as const;
export type Locale = (typeof LOCALES)[number];

/**
 * Rollen → Sprach-Synonyme. Erste Schreibform je Locale = kanonische Form
 * für die Generierung; alle Synonyme aller Locales gelten beim Lesen
 * (Union-Matching, zero-config). Eine neue Sprache = neuer Schlüssel je Rolle.
 */
export const SYNONYMS = {
  doneIndexHeading: { de: ["Erledigt-Index"], en: ["Done Index"] },
  progressHeading: { de: ["Fortschritt"], en: ["Progress"] },
  runningPhasesHeading: { de: ["Laufende Phasen"], en: ["Active Phases"] },
  locationLabel: { de: ["Ort"], en: ["Location"] },
  doneLabel: { de: ["Erledigt"], en: ["Done"] },
  goalLabel: { de: ["Ziel"], en: ["Goal"] },
  acceptanceLabel: { de: ["Abnahme"], en: ["Acceptance"] },
  verificationLabel: { de: ["Verifikation"], en: ["Verification"] },
  scopeLabel: { de: ["Umfang"], en: ["Scope"] },
  doneWord: { de: ["erledigt"], en: ["done"] },
  completedMarker: { de: ["abgeschlossen"], en: ["completed"] },
  standMarker: { de: ["Stand:"], en: ["As of:"] },
} as const;

export type SynonymRole = keyof typeof SYNONYMS;

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

/** Alle Synonyme einer Rolle über alle Locales (Detection, Union). */
export function allSynonyms(role: SynonymRole): string[] {
  return Object.values(SYNONYMS[role]).flat();
}

/** Union-Regex einer Rolle über alle Locales (Detection). */
export function synonymPattern(role: SynonymRole, flags = "iu"): RegExp {
  return new RegExp(allSynonyms(role).map(escapeRegExp).join("|"), flags);
}

/** Kanonische Schreibform einer Rolle für eine Ziel-Sprache (Generation). */
export function canonical(role: SynonymRole, locale: Locale): string {
  return SYNONYMS[role][locale][0]!;
}

/**
 * Erkennt die Sprache des Dokument-Kontexts per Mehrheitsentscheid über alle
 * Synonym-Vorkommen. Gleichstand/leer → "de" (Rückwärtskompatibilität).
 */
export function detectLocale(...contents: string[]): Locale {
  let de = 0;
  let en = 0;
  const count = (content: string, locale: Locale): number => {
    let hits = 0;
    for (const role of Object.keys(SYNONYMS) as SynonymRole[]) {
      for (const word of SYNONYMS[role][locale]) {
        hits += content.match(new RegExp(escapeRegExp(word), "giu"))?.length ?? 0;
      }
    }
    return hits;
  };
  for (const content of contents) {
    de += count(content, "de");
    en += count(content, "en");
  }
  return en > de ? "en" : "de";
}

/** Groß-/klein-insensitiver Feld-Lookup in einer Label-Map über Synonyme. */
export function getFieldByRole(
  fields: Map<string, string>,
  role: SynonymRole,
): string | undefined {
  for (const [key, value] of fields) {
    if (allSynonyms(role).some((s) => s.toLowerCase() === key.toLowerCase())) {
      return value;
    }
  }
  return undefined;
}
