# BRAINSTORM.md — Angedachte zukünftige Erweiterungen (außerhalb Parser-Scope)

> Diese Datei liegt bewusst **außerhalb** des stepwell-Parser-Scopes. Sie wird
> von `BACKLOG.md`/`PROGRESS.md`/`docs/archive/*` und von `docs_status`,
> `docs_validate`, `backlog_list` etc. **nicht** gelesen oder geparst.
>
> **Zweck:** Freie Prosa für Brainstorming, Halb-Ideen, „angedachte zukünftige
> Erweiterungen" — Dinge, die (noch) kein offizielles Backlog-Item sind.
> Sobald etwas commit-fähig wird: als Item (z. B. mit `backlog_add`) ins
> `BACKLOG.md` heben.
>
> **Konventionen:**
> - Freie Markdown-Prosa — keine Struktur-Vorgaben
> - Wiki-Links auf Obsidian-Vault-Notizen sind erlaubt und erwünscht
> - Keine Item-IDs, keine Step-Nummern, keine Sektions-Headings nötig
> - Diese Datei wird **nicht** ins Archiv verschoben

---

## MCP remote (HTTP-Transport)

stepwell-MCP läuft aktuell als stdio-Subprozess pro Editor/Agent. Könnte man auf
Streamable-HTTP / SSE (MCP-Spec 2025-03-26) umstellen — SDK 1.30 unterstützt es
offiziell.

**Pro:** mehrere Agents/Editoren teilen sich einen Server, Index-Cache einmal warm,
Lese-Requests aggregieren besser.

**Contra:** Hauptnutzen ist Schreiben (`archive_item`/`progress_update`/
`backlog_*`) — gleicher Repo-Mount + Netz = Race-Conditions + Sicherheitsrisiko.
Aktueller Use-Case ist Single-User/Single-Repo lokal — kein Skalierungsdruck.
HTTP-Transport hat Auth/Authz/CORS als Pflicht. Latenz: stdio ≈ 0 ms lokal vs.
HTTP-Round-Trip + Reverse-Proxy drückt jedes `docs_status` um Faktor 10–50.

**Sinnvoller wäre remote eher wenn:** Multi-Repo-Aggregation (eigenes
`stepwell-hub`-Produkt), Read-only-Mirror für CI-Dashboards, Shared Index über
mehrere Workspaces für Team-Status.

**Falls doch:** BACKLOG-Item (R10?) anlegen, M4-Guardrail wahren (nur Read-Tools
+ expliziter `mutation`-namespace mit Auth-Tokens pro Tool), eigener `serve-http`-
Entrypoint im Bin (Lockstep Decision 16: neuer Bin = kein API-Bruch), strikte
Tests gegen echten HTTP-Client. Phase nach B1 (Build-Cross-Platform) und I2
(README) — als 1.x-Feature, nicht vor 1.0.0.

Stand 09/2026: bewusst **nicht** umgesetzt, kein Item angelegt.

---

## Obsidian-Integration

Obsidian + stepwell passt überraschend gut — beides lokal, beides Markdown,
beides Files-on-Disk. Vier bis fünf Integrationsrichtungen, priorisiert nach
Aufwand/Wert:

### Variante 1 — Daily-Note mit Status-Block (Templater + CLI)

Templater-Snippet `<% tp.user.statusBlock() %>` ruft `npx stepwell status --root
<projekt> --json` auf. Beim Erstellen der Daily Note steht der aktuelle
Projekt-Status oben drin. Kein Plugin nötig, nur Templater + Bash-Snippet
(~30 Zeilen Templater-User-Script). Schwelle: 1–2 Std.

### Variante 2 — Item → Vault-Note Verlinkung (Parser-Erweiterung)

`Location:`-Feld in BACKLOG-Items akzeptiert `[[notes/projekt-research]]`
Wiki-Link-Syntax. Parser macht die Links im Tool-Output sichtbar (klickbar
via `obsidian://` URI in der Konsole). BACKLOG wird zum Index, Vault-Notizen
halten Research/Diskussion/Bilder/Code-Snippets. Schwelle: 4–6 Std (Parser +
ein Test-Fixture).

### Variante 3 — Obsidian-Plugin „STEPWELL Sidebar"

Eigenes Community-Plugin das `docs_status`/`backlog_list` direkt anzeigt.
View-Option „Switch project root" für Multi-Projekt-Tracking. Live-Update via
File-Watcher (chokidar) oder Polling alle 30s. Nutzt den MCP-Server per stdio
oder direkt `stepwell-core` als Library. Schwelle: 1–2 Tage (Plugin-Boilerplate,
dann View-Code).

### Variante 4 — Daily-Note-Generator im Vault-Format

`npx stepwell daily --root <projekt> --vault <vault-path> --date 2026-09-12`
erzeugt `Daily/2026-09-12.md` mit: Datums-Header, Status-Aggregat, offene
Items, nächster Schritt, Commit-Hinweise. Nutzt Vault-Konventionen (Frontmatter,
Dataview-kompatible Felder, Wiki-Links auf Item-Notizen). Lässt sich per
Templater oder als Cron-Hook in den Workflow hängen. Schwelle: 1 Tag.

### Variante 5 — Bidirektionaler Sync Vault↔BACKLOG (groß)

Vault-Note ist kanonische Source, BACKLOG.md wird generiert. Komplex:
Konflikt-Handling, Write-Order, Schema-Mapping. Eher ein eigenes Produkt
(`stepwell-vault`) als Feature. 2.x-Version.

**Bauchgefühl:** #1 + #2 sind das beste Aufwand/Nutzen-Paar. #1 in 1–2 Stunden
als Quick-Win, #2 gibt der Methode den „Research-Anker" im Vault. #3 ist
nice-to-have wenn stepwell intensiv genutzt wird.

Stand 09/2026: nur Brainstorming, keine Umsetzung.
