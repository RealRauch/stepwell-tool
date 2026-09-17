# AGENTS-decisions-history.md — relocated architecture decisions (append-only)

> Decisions that documented **historical facts** (a one-off choice, a naming check) or
> that only repeated the binding method (`PLAYBOOK`) live here **verbatim** as evidence.
> They no longer steer running behaviour — the active decision list is in `AGENTS.md`.
> Relocated in Phase 23 (Q4/Decision consolidation). Archive rule: append-only, the
> entries are never edited afterwards.

---

**3. Archiv-Muster respektieren:** Archive sind append-only; `archive_item` (Phase 3) verschiebt verbatim + Einzeiler im Erledigt-Index, Dry-run zuerst.
*(Now binding in PLAYBOOK §3; tool behaviour documented in `README.md` under `archive_item`.)*

---

**4. Fixtures:** Parser-Steps testen gegen realistische, anonymisierte Fixtures (abgeleitet aus internal-pwa; Sektionen mit Kopfregeln, R-/U-Serien, Erledigt-Index, Emoji-Prios).
*(Setup fact of the parser phases; the fixtures README remains the working specification.)*

---

**5. Nomenklatur:** Der **Parser** macht keine Format-Annahmen an Item-IDs (`id` = Token zwischen Checkbox und erstem ` — `; Gleichheit exakt nach Trim, case-sensitiv). Die **Konvention** (PLAYBOOK §3) ist `<Serienbuchstabe><Nummer>` (`^[A-Z][0-9]+$`): `K`/`H`/`M`/`L` = Prioritäts-Serien, sonst thematische Serien; Nummern fortlaufend, nie wiederverwendet. `docs_validate` warnt (`ID_CONVENTION`), wenn ein Item die Konvention verletzt — Warnung, nie Abbruch.
*(Convention now binding in PLAYBOOK §3; the parser's no-assumption rule is carried by the active Decision on the fault-tolerant parser.)*

---

**8. Stack final (TS/Node):** Bewusst gegen Python/Rust entschieden — MCP-SDK ist in TS First-Class, `npx` verteilt das Tool mühelos in Zielprojekte (Node dort omnipräsent), und die Workload (wenige Markdown-Dateien) ist perf-irrelevant, sodass kein Stack-Vorteil den Neuanfang rechtfertigt. „Schlank" wird erreicht durch: Zero-Dependencies-Kern (zeilenbasiertes Parsen, kein markdown-AST-Framework), faules Parsen (nur die Dateien, die ein Tool-Call braucht), stdio-Server ohne Daemon/Caches.
*(Historical stack decision; the current stack facts live in `AGENTS.md` → Stack and `README.md` → Architecture.)*

---

**9. Dokument-Zuordnung:** Regel lebt bindend in PLAYBOOK §2 (committete Phasenfolge → `PROGRESS.md`, alles andere Offene → `BACKLOG.md` mit Fundstelle + Abnahmekriterium). Projektspezifische Konsequenz hier: BACKLOG ist prioritäts-sortiert (🔴→🔵), nicht reihenfolge-sortiert — Sequenz-Information lebt ausschließlich in PROGRESS.
*(Duplicate of PLAYBOOK §2 — the binding text lives there.)*

---

**12. Methoden-Name „STEPWELL":** Die Arbeitsweise trägt einen eigenen Namen (Untertitel in PLAYBOOK/README). Kollisions-Check 09/2026: „STEP"/„STEPcode" ist belegt (ISO 10303; NIST-Fork stepcode), „STAIRS" durch eine formale Methode — STEPWELL ist im Tech-Kontext frei und hält die Step-Metapher: viele kleine, jede tragende Steps.
*(Naming-collision check, a one-off historical fact.)*

---

**18. Endgültiges Naming — STEPWELL durchgängig (bindend, 09/2026, N1/13.3):** Paketnamen (`stepwell` flat für MCP + CLI; `stepwell-core` flat für die Bibliothek), Bin-Name (`stepwell`), TOOL_NAME (`stepwell`), MCP-Server-Name (`stepwell`, `serverInfo.name`), Resource-URI-Schema (`stepwell://templates/{kind}`, `stepwell://{root}/...`), Repo-Pfad (`stepwell-tool`, 13.4). **Kein** `@stepwell/*`-Scope, kein `@method-docs/*`-Rest. Begründung: nach erstem npm-Publish wäre ein Rename teuer (Deprecation/Aliase); die Halb-Migration mit halb-aktualisierten Arteen war bereits verwirrender als jedes der beiden Extreme. Lockstep-SemVer Decision 16 erzwingt dieselbe Version auf allen Arteen. Archive bleiben append-only und behalten historische Namen als Belegstellen; nur offene Dateien werden auf den neuen Stand migriert.
*(Migration completed; the resulting names are visible in the manifests and README, the lockstep rule is carried by the active Lockstep-SemVer decision.)*
