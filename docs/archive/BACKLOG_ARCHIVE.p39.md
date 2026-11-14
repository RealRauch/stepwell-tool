# BACKLOG_ARCHIVE.p39.md — Shard (Phase 39, append-only)

> Created 2026-11-14T16:14 — home for item blocks archived in the context of Phase 39 (rotation: last active phase, H14/34.2).
> Contains: items archived during Phase 39. Header is write-once — never edited.

---

### [x] M30 — npm-Package-READMEs (stepwell/core/git) + Root-README Install-Abschnitt — Paketseiten sind öffentlich und leer — 🟡
- **Location:** `packages/mcp/README.md` (neu) · `packages/core/README.md` (neu) · `packages/git/README.md` (neu) · Root `README.md` (Install-Abschnitt)
- **Problem:** Erstes npm-Release (0.2.4) ist live, aber alle drei Paketseiten zeigen „No README data found!" (`npm view <pkg> readme` bestätigt) — die npm-Seiten sind die öffentliche Entdeckungsfläche und sind leer. Root README behandelt npm nur am Rande (Zeile ~241 „npm i -g stepwell“, kein dedizierter Install-Abschnitt; Kopf dominiert von Phasen-Historie statt Nutzung). Zusätzlich fund: package.jsons tragen kein `repository`-Field — auch der Repo-Link fehlt auf den npm-Seiten.
- **Acceptance:** kompakte EN-Readme je Paket (stepwell: Install + CLI-Schnellstart + MCP-stdio-Config + SKILL-Verweis; stepwell-core: Bibliotheksprofil ParseResult/no-MCP-dep; stepwell-git: Satellit sync/commit) — npm packt package-lokale READMEs automatisch; `repository`-Metadatum in die 3 package.jsons (kein Dependency-Change → Niedrig, dokumentiert); Root README mit Install/npm-Packages-Abschnitt (Registry-Links, npx-Beispiel); Release 0.2.5 (PATCH, docs-only) + Promotion + publish; pack-smoke grün; `npm view <pkg> readme` liefert Inhalt.
- **Packaging:** als Phase 39 (39.1 Readmes, 39.2 Root-README + Release 0.2.5 + Promotion) paketiert — Freigabe durch Nutzer 11/2026 („ok“); Content-Gate: Niedrig (docs-only; `repository`-Metadatum als fund-integriertes Zusatzdatum dokumentiert).
- **Erledigt:** Phase 39 (39.1: dc277d4 · 39.2: a554c03) — 3 Package-Readmes + repository-Metadatum + Root-Install-Abschnitt; Release 0.2.5 promoted (CI grün), publish 0.2.5 an Nutzer übergeben

## ✅ Erledigt-Index

> Einzeiler je abgeschlossenem Item (Details oben).

- M30 — npm-Package-READMEs (stepwell/core/git) + Root-README Install-Abschnitt — Paketseiten sind öffentlich und leer — erledigt (Phase 39 (39.1: dc277d4 · 39.2: a554c03) — 3 Package-Readmes + repository-Metadatum + Root-Install-Abschnitt; Release 0.2.5 promoted (CI grün), publish 0.2.5 an Nutzer übergeben)
