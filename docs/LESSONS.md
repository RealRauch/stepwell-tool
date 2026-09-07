# LESSONS.md — Lessons Learned als Review-Checkliste (projektunabhängig)

> Jede Regel entstand aus einem **echten, gefundenen Fehler** — die Fundstelle in Klammern
> verweist auf das Backlog-Archiv des Ursprungsprojekts (Beweis, nicht Voraussetzung).
>
> **Verwendung:** Vor jedem Review, vor jedem Phasenabschluss und beim Anlegen neuer
> Routen/Endpunkte/Caches diese Checkliste durcharbeiten. Ziel: nie zweimal machen.

## A. Sicherheit & Mandantentrennung

1. **Parameterisierte Werte schützen nicht die Keys.** Dynamisches SQL (SET/ORDER-BY über Objekt-Keys) braucht eine **Column-Whitelist**. *(Beweis: K1)*
   - Check: Jedes Repo-Update, das Body-Keys in SQL interpoliert → Whitelist oder 400.
2. **Jede `:id`-Route prüft Ownership, nicht nur die Rolle.** Muster: Objekt laden → Eigentümer vergleichen → sonst 403/404. Gilt auch für Sub-Ressourcen. *(K2)*
   - Check: Test-Matrix „fremder Mandant → 403/404" für jede `:id`-Route inkl. Sub-Ressourcen.
3. **Schutz durch Reihenfolge ist kein Schutz.** Eine Route, die nur sicher ist, weil ein anderer Handler vorher registriert wurde, ist eine latente Lücke — Guard an die Ressource selbst, Unabhängigkeit per Test beweisen. *(H2)*
4. **Secrets failen hart, nicht warnen.** In Produktion mit Default-Geheimnissen/Passwörtern: Prozessabbruch mit klarer Meldung; `${VAR:?…}` statt `:-default` in Compose. *(K4)*
5. **Öffentliche Auth-Endpunkte werden gedrosselt.** Login, Recovery, anonyme Anlage: einfache Rate-Limits — sonst sind große Keyspaces und teile Hashes kein Zeitproblem für Angreifer. *(H3)*

## B. Tests, die etwas finden

6. **Tests dürfen nicht die eigene Implementierung spiegeln.** „Glatte" Fixtures bestätigen den Code, statt ihn zu prüfen. Immer auch **realistische/böse** Varianten: gemischte Schreibweisen, fremde Keys, Riesen-Payloads, fremd-Mandanten-IDs. *(K3, K1, K2 — alle drei hätten einfache Tests gefunden)*
7. **Kontrakte testschnittpunktweise absichern.** Wo zwei Schichten dieselbe Konvention teilen (Code-Case, Längen, Payload-Felder), gehört ein Test auf **beiden** Seiten mit **gemeinsamer** Fixture-Quelle — sonst „errät" eine Seite die andere. *(K3, T3)*
8. **In-Memory-Clients (inject/Mocks) verstecken Host- und Umgebungslogik.** IP-/Host-basierte Auflösung sieht im Integrationstest korrekt aus und bricht im echten HTTP — Host-Logik immer mit echten Requests testen. *(Phase-4-Fund: 127.0.0.1 als „Subdomain")*
9. **Stille Catches sind Diagnose-Gift.** `catch(() => {})` ohne Log verwandelt Fehler in „funktioniert mysteriös nicht". Minimal: Warn-Log mit Kontext. *(SW-Registrierungs-Fund)*

## C. Frontend & Browser-Realität

10. **URL-keyed Caches speichern keine personalisierten Responses.** Enthält eine Antwort nutzerspezifische Daten, darf ein Service-Worker sie nicht unter der nackten URL cachen — Key um Session ergänzen oder Antwort aufspalten. *(H1)*
11. **Router remounted bei Param-Wechsel nicht.** `useRef(searchParams.get(…))` friert den ersten Wert ein — Refs nachführen oder Remount-Komponentengrenzen setzen. *(M2)*
12. **Geräte-Realität einplanen.** iOS braucht `requestPermission()` in einer Nutzer-Geste; headless-Browser kennen teils keine Service Worker. Geräte-Features immer mit Permission-Flow + Fallback bauen; E2E mit passendem Browser-Channel. *(M4, E2E-Erfahrung)*
13. **Umweltabhängige Werte (Build-IDs, Pfade) müssen deterministisch sein ODER har failen.** Stille Fallbacks („Paketversion") führen zu Altfehlern, die nie auffallen. Muster: Env-Override erlauben, aber fehlende Bestimmbarkeit = Buildfehler. *(M5, Phase-5-Fund)*

## D. Build & Prozess

14. **Bundler-`define`-Werte sind Ausdrücke, keine Werte.** `JSON.stringify` genau einmal für Strings/Arrays — doppeltes Stringify erzeugt Strings statt Arrays und schlägt zur Laufzeit still fehl. *(SW-`addAll(String)`-Fund)*
15. **Security-Selbstreview vor „fertig".** Gezielt die eigene Angriffsfläche durchgehen: „Was kann ein *anderer* Mandant? Ein nicht-Authentifizierter? Ein Admin mit bösem Body?" — die reguläre Test-Suite prüft überwiegend Happy Paths. *(R1-Protokoll)*
16. **Mechanische Massen-Ersetzungen mit Platzhaltern sind gefährlich.** Replace nur mit exakten, eindeutigen Strings; Platzhalter dürfen niemals mit echtem Inhalt kollidieren; danach immer Diff-/Anomalie-Check. *(Beweis: Archivierungs-Slip 09/2026 — ein `.Replace('X', …)` zerschoss alle „X" in drei Dateien)*
17. **Struktur-Operationen gehören dem Tool.** Statuspflege in der Fortschrittstabelle, Detail-Block-, Erledigt-Index- und Archiv-Änderungen laufen immer über die dafür gebauten Tools (`progress_update`, `archive_item`) — manuelle Edits an diesen Strukturen erzeugen genau die Drift, die die Tools verhindern sollen. Direkt in den Dateien editiert wird nur die Prosa, die das Tool bewusst nicht verwaltet (Ziel-/Abnahme-Texte, Item-Inhalte, neue BACKLOG-Items). *(Beweis: method-docs 09/2026 — Status-Edits von Hand in PROGRESS.md trotz verfügbarer Tools, aufgedeckt beim nächsten validate.)*
