import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** Die vier Pflichtdateien eines STEPWELL-Projekts (posix-style Relativpfade). */
export const DOC_FILES = [
  "BACKLOG.md",
  "PROGRESS.md",
  "docs/archive/BACKLOG_ARCHIVE.md",
  "docs/archive/PROGRESS_ARCHIVE.md",
] as const;

/**
 * SHA256 je gelesener Doku-Datei (E2/12.5) — Clients vergleichen gegen den letzten
 * bekannten Stand und überspringen Voll-Lese. Tolerant: fehlende Dateien bekommen
 * keinen Schlüssel (Decision 6), kein Crash.
 */
export function fileHashes(root: string): Record<string, string> {
  const hashes: Record<string, string> = {};
  for (const rel of DOC_FILES) {
    const abs = join(root, ...rel.split("/"));
    if (!existsSync(abs)) continue;
    hashes[rel] = createHash("sha256").update(readFileSync(abs, "utf8")).digest("hex");
  }
  return hashes;
}
