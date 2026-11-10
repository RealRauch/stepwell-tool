// Stepwell Website Interactive Behavior

const terminalData = {
  status: {
    command: "stepwell status --root . --json",
    description: "Session Kickoff in 1 Call: Delivers open priority counts, running steps, nextStepScope, and SHA-256 hashes for instant short-circuit.",
    output: `{
  "schema": 2,
  "openByPriority": { "🔴": 0, "🟠": 0, "🟡": 0, "🟢": 0, "🔵": 0 },
  "openTotal": 0,
  "runningSteps": [
    { "step": "18.3", "name": "Konsolidierung: Step-Präfix-Regex", "status": "✅" }
  ],
  "runningPhases": [],
  "doneQuote": { "done": 93, "total": 93, "percent": 100 },
  "nextStep": undefined,
  "nextPriority": undefined,
  "nextStepScope": {
    "phase": "Phase 18",
    "phaseTitle": "Review Fixes",
    "step": "18.3",
    "name": "Konsolidierung",
    "goal": "Single source of truth for regexes",
    "acceptance": "318/318 tests green, behavior identical"
  },
  "hashes": {
    "BACKLOG.md": "a6f8b2c...",
    "PROGRESS.md": "3c91d4e..."
  },
  "warnings": []
}`
  },
  archive: {
    command: "stepwell archive --root . --id H1",
    description: "Dry-Run First: Generates an exact line diff of the verbatim move to BACKLOG_ARCHIVE and index tail append. Verifies before & after write.",
    output: `[DRY RUN] Plan generated for item "H1":
Affected files:
  - BACKLOG.md
  - docs/archive/BACKLOG_ARCHIVE.md

--- Diff Preview (BACKLOG.md) ---
@@ -14,6 +14,0 @@
<span class="diff-del">- ### [ ] H1 — Dist-Blocker: npm-Artefakt Build</span>
<span class="diff-del">-   - **Ort:** packages/mcp</span>
<span class="diff-del">-   - **Abnahme:** npx stepwell läuft ohne Build-Step</span>
--- Diff Preview (docs/archive/BACKLOG_ARCHIVE.md) ---
@@ -102,0 +103,6 @@
<span class="diff-add">+ ### [x] H1 — Dist-Blocker: npm-Artefakt Build</span>
<span class="diff-add">+   - **Ort:** packages/mcp</span>
<span class="diff-add">+   - **Abnahme:** npx stepwell läuft ohne Build-Step</span>
<span class="diff-add">+   - **Erledigt:** Commit cb10583</span>

Pass --apply to execute plan and run integrity verification.`
  },
  progress: {
    command: 'stepwell progress-update --root . --phase "Phase 19" --step 19.1 --status running',
    description: "Deterministic State Management: Adds row if missing, creates active phase block skeleton, enforces ⬜ → 🔄 → ✅ flow.",
    output: `[DRY RUN] Status update planned:
Phase: "Phase 19"
Step:  19.1
Status: ⬜ -> 🔄 (running)

--- Diff Preview (PROGRESS.md) ---
@@ -28,3 +28,4 @@
 | 18.3 | Konsolidierung | ✅ |
<span class="diff-add">+| 19.1 | External Tracker Bridge | 🔄 |</span>

@@ -12,0 +13,6 @@
<span class="diff-add">+### Phase 19 — External Tracker Bridge</span>
<span class="diff-add">+**Scope (Steps):**</span>
<span class="diff-add">+- 19.1 External Tracker Bridge</span>

Pass --apply to write changes safely.`
  },
  validate: {
    command: "stepwell validate --root .",
    description: "CI-Grade Consistency Gate: Checks cross-file integrity, duplicated IDs, orphan WIP steps, date formats. Exits 1 on drift.",
    output: `Analyzing 4 core files in D:/Development/stepwell-tool...
  ✔ BACKLOG.md: Validated
  ✔ PROGRESS.md: Validated
  ✔ docs/archive/BACKLOG_ARCHIVE.md: Validated
  ✔ docs/archive/PROGRESS_ARCHIVE.md: Validated

Findings: 0
Parse warnings: 0
OK — Repository docs are 100% consistent with STEPWELL standards.
(Exit code: 0)`
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
  cli: `# Global installation
npm install -g stepwell

# Or run on demand with zero install
npx stepwell status --root .
npx stepwell validate --root .`
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
