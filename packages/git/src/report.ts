import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";
import type { Stats } from "node:fs";
import { runGit, splitLines } from "./git.ts";
import type { SyncError } from "./types.ts";

/** One linked worktree (= one parallel workstream), analyzed from git only. */
export interface WorkstreamInfo {
  /** Worktree path on disk. */
  path: string;
  /** Checked-out branch; empty string when detached. */
  branch: string;
  /** Uncommitted changes in this worktree. */
  dirty: boolean;
  /** Commits ahead of the trunk. */
  ahead: number;
  /** Commits behind the trunk. */
  behind: number;
  /** Subject of the last commit on this branch (liveness signal). */
  lastSubject: string;
  /** ISO 8601 timestamp of the last commit (Decision 6). */
  lastCommitIso: string;
  /** Conflict candidates: files touched on BOTH sides since the merge base. */
  overlap: string[];
}

export interface WorkstreamReportOk {
  ok: true;
  /** Trunk branch (main worktree's checked-out branch, zero config). */
  trunk: string;
  /** Branch of the queried root. */
  current: string;
  /**
   * Hygiene (M16): directories whose `.git` FILE points into this repo's
   * `.git/worktrees/` admin area but whose admin entry is gone — leftovers of
   * `git worktree remove` that kept untracked content. Read-only detection; the
   * agent removes them (`rm -rf`) after `git worktree prune`.
   */
  husks: string[];
  /**
   * Hygiene (M16): registered worktrees git considers prunable (path vanished) —
   * `git worktree prune` cleans their admin entries.
   */
  prunable: string[];
  /** All linked (non-main) worktrees; empty in single-tree mode. */
  worktrees: WorkstreamInfo[];
}

export type WorkstreamReportResult = WorkstreamReportOk | { ok: false; error: SyncError };

interface WorktreeEntry {
  path: string;
  branch: string;
}

/** Git prints forward slashes even on win32 — report paths OS-native. */
const toNativePath = (p: string): string =>
  process.platform === "win32" ? p.replaceAll("/", "\\") : p;

function listWorktrees(root: string): { entries: WorktreeEntry[]; prunable: string[] } {
  const list = runGit(root, ["worktree", "list", "--porcelain"]);
  const entries: WorktreeEntry[] = [];
  const prunable: string[] = [];
  let path: string | undefined;
  let branch: string | undefined;
  let isPrunable = false;
  const flush = (): void => {
    if (path !== undefined) {
      entries.push({ path, branch: branch ?? "" });
      if (isPrunable) prunable.push(path);
    }
    path = undefined;
    branch = undefined;
    isPrunable = false;
  };
  for (const line of splitLines(list.stdout)) {
    if (line.startsWith("worktree ")) {
      flush();
      path = toNativePath(line.slice("worktree ".length));
    } else if (line.startsWith("branch ")) {
      branch = line.slice("branch refs/heads/".length);
    } else if (line.startsWith("prunable ")) {
      isPrunable = true;
    }
    // no branch line ⇒ detached (reported with an empty branch); `bare` entries
    // land here too and are filtered by the trunk/workstream logic downstream
  }
  flush();
  return { entries, prunable };
}

/**
 * Hygiene (M16): sibling directories of the main worktree whose `.git` FILE points
 * into THIS repo's `.git/worktrees/` admin area while that admin entry no longer
 * exists — leftovers of `git worktree remove` that kept untracked content after
 * deregistering. Deliberately precise (no name/doc heuristics): real sibling
 * projects living next to the repo must never be flagged.
 */
function findHusks(mainWorktreePath: string): string[] {
  const parent = join(mainWorktreePath, "..");
  let names: string[] = [];
  try {
    names = readdirSync(parent);
  } catch {
    return [];
  }
  const adminRoot = join(resolve(mainWorktreePath), ".git", "worktrees");
  const husks: string[] = [];
  for (const name of names) {
    const dir = join(parent, name);
    if (resolve(dir) === resolve(mainWorktreePath)) continue;
    const gitPath = join(dir, ".git");
    let stat: Stats;
    try {
      stat = statSync(gitPath);
    } catch {
      continue;
    }
    if (!stat.isFile()) continue;
    const firstLine = (readFileSync(gitPath, "utf8").split(/\r?\n/u)[0] ?? "").trim();
    if (!firstLine.startsWith("gitdir:")) continue;
    const gitdir = firstLine.slice("gitdir:".length).trim();
    const resolved = resolve(gitdir.startsWith("/") || gitdir.match(/^[A-Za-z]:/u) ? gitdir : join(dir, gitdir));
    // relative() normalizes mixed separators on win32 — startsWith would not
    const rel = relative(adminRoot, resolved);
    if (rel !== "" && !rel.startsWith("..") && !isAbsolute(rel) && !existsSync(resolved)) husks.push(dir);
  }
  return husks;
}

function countCommits(root: string, range: string): number {
  const out = runGit(root, ["rev-list", "--count", range]).stdout.trim();
  const n = Number.parseInt(out, 10);
  return Number.isNaN(n) ? 0 : n;
}

/** Files touched on both sides since the merge base — the conflict candidates. */
export function overlapFiles(root: string, branch: string, trunk: string): string[] {
  const base = runGit(root, ["merge-base", branch, trunk]).stdout.trim();
  if (base === "") return [];
  const mine = new Set(splitLines(runGit(root, ["diff", "--name-only", base, branch]).stdout));
  if (mine.size === 0) return [];
  const incoming = splitLines(runGit(root, ["diff", "--name-only", base, trunk]).stdout);
  return incoming.filter((file) => mine.has(file));
}

function lastCommit(root: string, ref: string): { subject: string; iso: string } {
  const out = runGit(root, ["log", "-1", "--format=%s%x1f%cI", ref]).stdout.trim();
  const [subject = "", iso = ""] = out.split("\x1f");
  return { subject, iso };
}

/**
 * Read-only workstream report — liveness and overlap derived from git itself
 * (branch existence + last-commit times are ground truth; no registry file,
 * no heartbeats, Decision 14). The overlap list names the files that BOTH the
 * workstream branch and the trunk touched since their merge base — the likely
 * conflicts of the next pull, visible before they happen.
 */
export function workstreamReport(root: string): WorkstreamReportResult {
  const inside = runGit(root, ["rev-parse", "--is-inside-work-tree"]);
  if (inside.status !== 0 || inside.stdout.trim() !== "true") {
    if (inside.status === -1) {
      return { ok: false, error: { code: "GIT_MISSING", message: "git is not available on PATH", detail: inside.stderr } };
    }
    return { ok: false, error: { code: "NOT_A_GIT_REPO", message: `"${root}" is not inside a git work tree` } };
  }

  const { entries, prunable } = listWorktrees(root);
  // first entry is the main worktree; its branch is the trunk (zero config)
  const main = entries[0];
  const trunk = main?.branch ?? "";
  const current = runGit(root, ["branch", "--show-current"]).stdout.trim();

  const worktrees: WorkstreamInfo[] = entries.slice(1).map((entry) => {
    const dirty = splitLines(runGit(entry.path, ["status", "--porcelain"]).stdout).length > 0;
    const knownBranch = entry.branch !== "" && entry.branch !== trunk;
    const ahead = knownBranch ? countCommits(root, `${trunk}..${entry.branch}`) : 0;
    const behind = knownBranch ? countCommits(root, `${entry.branch}..${trunk}`) : 0;
    const last = knownBranch ? lastCommit(root, entry.branch) : { subject: "", iso: "" };
    return {
      path: entry.path,
      branch: entry.branch,
      dirty,
      ahead,
      behind,
      lastSubject: last.subject,
      lastCommitIso: last.iso,
      overlap: knownBranch ? overlapFiles(root, entry.branch, trunk) : [],
    };
  });

  const husks = main !== undefined ? findHusks(main.path) : [];

  return { ok: true, trunk, current, husks, prunable, worktrees };
}
