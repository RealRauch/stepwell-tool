# PROGRESS_ARCHIVE.p32.md — Shard (Phase 32, append-only)

> Created 2026-11-12T22:04 — home for the detail block of Phase 32 on completion.
> Contains: Phase 32 — Archive Sharding. Header is write-once — never edited.

---

### Phase 32 — Archive Sharding

**Umfang (Steps):**

- **32.1 [H11] core: shard-fähiges Archiv-Lesen — Glob docs/archive/*_ARCHIVE*.md + konkatenierter Parse (p<n> aufsteigend, kanonisch zuletzt), Inventory hartkodierter Archiv-Pfade, RED→GRÜN Fixture**
- **32.2 [H12] core: Rotation als Tool-Op — Shard je Phase (Direktschreib): Item-Appends an BACKLOG_ARCHIVE.p<n>.md, Phase-Block bei completedPhase an PROGRESS_ARCHIVE.p<n>.md, Kopfzeile je Shard-Datei**
- **32.3 [M24] core: Done-Index-Kopplung — Index-Zeile lebt dort, wo ihr Block lebt (Shard-Index-Sektionen; L13-Muster-Entscheid: strenge Lokalität vs. globale Existenz-Prüfung)**
- **32.4 [M25] core/git/mcp: Satellit/Hashes/Resources shard-fähig — Doc-File-Sets (DOC_FILES-Staging), sync docSet, hashes-Resource, archivePath()**
- **32.5 [M23] core validate: PLAN_WITHOUT_WIP transient bei Step-Übergängen — sequentieller Fortschritt → PHASE_MIDWAY-Warning, verwaist bleibt Finding**
- **32.6 [L22] git: Workstream-Report — doppelte Parses beseitigen (foreignDocState, idCollisions base-State), byte-gleich**
- **32.7 [L24] core/mcp: docs_status docFiles-Aggregat (Zeilen/Bytes je Doku-Datei) + CLI-Kompakt-Zeile, JSON additiv**
- **32.8 [L19] Item-bewusste Suche über offen+Archiv+Done Index: Alternativprüfung dokumentieren statt Tool bauen (Muster L5, Reaktivierungs-Kriterium)**
- **32.9 [L25] Methoden-/Doku-Sync Sharding: PLAYBOOK §3 wortidentisch in alle Kopien + SHA256-Evidenz, QUICKSTART/README/AGENTS nachziehen**
- **32.10 Verification: typecheck + full suite + docs_validate clean; offene Items archivieren; Phasen-Abschluss**
**Verifikation:** typecheck + 488/488 Suite + docs_validate clean; 9 Items archiviert (H11 kanonisch via Alt-Konsumer-Registration, Rest im Shard p32); Phase dogfoodet eigenes Sharding (checkpoint: c5157bd)
