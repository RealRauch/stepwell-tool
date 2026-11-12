// Stepwell Website Interactive Behavior

const terminalData = {
  status: {
    command: "stepwell status --root . --json",
    description: "Session Kickoff in 1 Call: open priority counts, running steps/phases, done quote, next step, per-file sizes (docFiles) and SHA-256 hashes for the read short-circuit.",
    output: `{
  "schema": 2,
  "openByPriority": { "🔴": 0, "🟠": 1, "🟡": 2, "🟢": 3, "🔵": 0 },
  "openTotal": 6,
  "runningSteps": [
    { "step": "33.1", "name": "Field test round 1", "status": "🔄" }
  ],
  "runningPhases": ["Phase 33 — Field Test"],
  "doneQuote": { "done": 148, "total": 154, "percent": 96 },
  "nextStep": { "step": "33.2", "name": "Promotion ritual dry run", "status": "⬜" },
  "nextPriority": "🟠",
  "docFiles": [
    { "file": "BACKLOG.md", "lines": 96, "bytes": 12480 },
    { "file": "PROGRESS.md", "lines": 205, "bytes": 21736 },
    { "file": "docs/archive/PROGRESS_ARCHIVE.p32.md", "lines": 18, "bytes": 1502 }
  ],
  "hashes": {
    "BACKLOG.md": "21ae5321411c4576…",
    "PROGRESS.md": "d005eb60879f5577…",
    "docs/archive/PROGRESS_ARCHIVE.p32.md": "9c2a1b7f4e6d0a35…"
  },
  "warnings": []
}`
  },
  archive: {
    command: "stepwell archive --root . --id H9 --note \"Commit 4b6c2a1\"",
    description: "Dry-Run First: exact line diff of the verbatim move — checkbox flip, done line, Done Index entry (which lives where the block lives). Plan messages are human-readable (de/en); the write happens only with --apply.",
    output: `Dry-run — nothing was written (--apply to apply).

## BACKLOG.md — Item "H9" aus dem offenen BACKLOG entfernen (span 59–63, verbatim)
@@ -59,6 +59,0 @@
<span class="diff-del">- ### [ ] H9 — Mechanical repair path *(🟢 Low)*</span>
<span class="diff-del">-   - **Location:** packages/core/src/validate.ts</span>
<span class="diff-del">-   - **Acceptance:** RED→GRÜN, docs_validate clean</span>

## docs/archive/BACKLOG_ARCHIVE.p33.md — Item-Block "H9" verbatim anhängen (Checkbox → [x], mit Erledigt-Zeile + Index-Zeile in der Shard-Sektion) — Ziel: docs/archive/BACKLOG_ARCHIVE.p33.md (Shard der laufenden Phase)
@@ -14,0 +15,6 @@
<span class="diff-add">+ ### [x] H9 — Mechanical repair path *(🟢 Low)*</span>
<span class="diff-add">+   - **Location:** packages/core/src/validate.ts</span>
<span class="diff-add">+   - **Acceptance:** RED→GRÜN, docs_validate clean</span>
<span class="diff-add">+   - **Done:** Commit 4b6c2a1</span>
<span class="diff-add">+ - H9 — Mechanical repair path — done (Commit 4b6c2a1)</span>

Apply verifies freshly: ID gone from open, present in archive + index.`
  },
  progress: {
    command: 'stepwell progress-update --root . --phase 33 --step 33.1 --status running',
    description: "Deterministic State Management: adds missing rows, creates the scope skeleton, enforces ⬜ → 🔄 → ✅. On phase completion the block moves verbatim into the archive shard — rotation is a tool-op, never a hand edit.",
    output: `Dry-run — nothing was written (--apply to apply).

## PROGRESS.md — Laufende Phase "Phase 33 — Field Test" um 1 Steps erweitern (Tabellen-Zeilen ⬜ + Scope-Bullets)
@@ -208,3 +208,4 @@
 | 32.10 | Verification + phase completion | ✅ |
<span class="diff-add">+| 33.1 | Field test round 1 | 🔄 |</span>

@@ -14,0 +15,4 @@
<span class="diff-add">+### Phase 33 — Field Test</span>
<span class="diff-add">+**Scope (Steps):**</span>
<span class="diff-add">+- **33.1 Field test round 1**</span>

Apply verifies row, skeleton and docs_validate. With --commit: only the doc files are staged.`
  },
  validate: {
    command: "stepwell validate --root .",
    description: "CI-Grade Consistency Gate: cross-file integrity, duplicate IDs, orphaned blocks, legacy dates, dependency cycles. Exits 1 on findings; accepted findings (inline marker) are counted separately and never flip ok.",
    output: `OK — no consistency findings.
Acknowledged (accepted findings): 1
  ID_CONVENTION BACKLOG_ARCHIVE.md:47
Warnings (parse): 0

(exit code: 0)`
  },
  sync: {
    command: "stepwell sync status --root . --json",
    description: "Git Satellite, read-only (core stays git-blind): per-worktree liveness (ahead/behind/dirty), factual + predicted overlap from open items' Location bullets, ID collisions, worktree hygiene (husks/prunable).",
    output: `{
  "worktrees": [
    {
      "path": "../demo-pwa-ws33",
      "branch": "ws/33-field-test",
      "dirty": false,
      "ahead": 1,
      "behind": 0,
      "lastSubject": "feat(core): field test round 1"
    }
  ],
  "overlap": [],
  "predictedOverlap": [
    { "path": "packages/core/src/status.ts", "openItems": ["L24", "M25"] }
  ],
  "idCollisions": [],
  "husks": [],
  "prunable": []
}`
  },
  repair: {
    command: "stepwell repair --root .",
    description: "Mechanical repair path over the responsible planners — never text manipulation. Dry-run default; refusals are reported with a reason, never retried; re-validates between repairs.",
    output: `Dry-run — nothing was written (--apply to apply).

Planned: 2
  DATE_LEGACY — PROGRESS.md:214
  EMPTY_MARKER_STALE — BACKLOG.md:18
Skipped: 0

Apply re-validates between repairs and reports remaining findings — never guesses, never invents scope.`
  }
};

const configData = {
  claude: `{
  "mcpServers": {
    "stepwell": {
      "command": "npx",
      "args": ["-y", "stepwell"]
    }
  }
}`,
  cursor: `{
  "mcp": {
    "servers": {
      "stepwell": {
        "command": "npx",
        "args": ["-y", "stepwell"]
      }
    }
  }
}`,
  opencode: `{
  "mcp": {
    "stepwell": {
      "type": "local",
      "command": ["npx", "-y", "stepwell"],
      "enabled": true
    }
  }
}`,
  zcode: `// ~/.zcode/cli/config.json — user-scoped, all sessions
{
  "mcpServers": {
    "stepwell": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "stepwell"]
    }
  }
}`,
  cli: `# Global installation
npm install -g stepwell

# Or run on demand with zero install
npx stepwell status --root .
npx stepwell validate --root .

# Git workstream satellite (CLI-first — no MCP registration needed)
stepwell sync status --root <worktree>
stepwell sync pull --root <worktree>
stepwell progress-update --root . --phase 7 --step 7.2 --status done --apply --commit
stepwell sync push --root <worktree>`
};

document.addEventListener("DOMContentLoaded", () => {
  // Terminal Simulator Tabs
  const terminalTabs = document.querySelectorAll("[data-terminal-tab]");
  const terminalCmd = document.getElementById("terminal-command");
  const terminalDesc = document.getElementById("terminal-desc");
  const terminalOut = document.getElementById("terminal-output");

  function setTerminalTab(key) {
    terminalTabs.forEach(t => {
      if (t.dataset.terminalTab === key) {
        t.classList.add("bg-blue-600/20", "text-blue-400", "border-blue-500/50");
        t.classList.remove("text-slate-400", "border-transparent");
      } else {
        t.classList.remove("bg-blue-600/20", "text-blue-400", "border-blue-500/50");
        t.classList.add("text-slate-400", "border-transparent");
      }
    });

    const data = terminalData[key];
    if (data && terminalCmd && terminalDesc && terminalOut) {
      terminalCmd.textContent = data.command;
      terminalDesc.textContent = data.description;
      terminalOut.innerHTML = data.output;
    }
  }

  terminalTabs.forEach(tab => {
    tab.addEventListener("click", () => setTerminalTab(tab.dataset.terminalTab));
  });

  // Config Switcher Tabs
  const configTabs = document.querySelectorAll("[data-config-tab]");
  const configCode = document.getElementById("config-code");

  function setConfigTab(key) {
    configTabs.forEach(t => {
      if (t.dataset.configTab === key) {
        t.classList.add("bg-slate-700/80", "text-white");
        t.classList.remove("text-slate-400");
      } else {
        t.classList.remove("bg-slate-700/80", "text-white");
        t.classList.add("text-slate-400");
      }
    });

    if (configData[key] && configCode) {
      configCode.textContent = configData[key];
    }
  }

  configTabs.forEach(tab => {
    tab.addEventListener("click", () => setConfigTab(tab.dataset.configTab));
  });

  // Copy Buttons
  document.querySelectorAll("[data-copy]").forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.copy;
      const targetEl = document.getElementById(targetId);
      if (!targetEl) return;

      const text = targetEl.textContent || targetEl.innerText;
      navigator.clipboard.writeText(text).then(() => {
        const originalText = btn.innerHTML;
        btn.innerHTML = `
          <svg class="w-4 h-4 text-emerald-400 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          Copied!
        `;
        btn.classList.add("bg-emerald-950/60", "border-emerald-500/50");
        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.classList.remove("bg-emerald-950/60", "border-emerald-500/50");
        }, 2000);
      });
    });
  });

  // Initialize defaults
  setTerminalTab("status");
  setConfigTab("claude");
});
