import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { docFileSet, DOC_FILES } from "./project-files.ts";

export { DOC_FILES };

/**
 * SHA256 je gelesener Doku-Datei (E2/12.5) — Clients vergleichen gegen den letzten
 * bekannten Stand und überspringen Voll-Lese. Tolerant: fehlende Dateien bekommen
 * keinen Schlüssel (Decision 6), kein Crash. M25/32.4: derived doc file set —
 * existing archive shards are part of the manifest (the fast path would never
 * see shard changes otherwise → stale hashes → consumers read stale states).
 */
export function fileHashes(root: string): Record<string, string> {
  const hashes: Record<string, string> = {};
  for (const rel of docFileSet(root)) {
    const abs = join(root, ...rel.split("/"));
    if (!existsSync(abs)) continue;
    hashes[rel] = createHash("sha256").update(readFileSync(abs, "utf8")).digest("hex");
  }
  return hashes;
}
