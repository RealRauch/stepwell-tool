import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";
import type { Stats } from "node:fs";
import { parseBacklog, parseProgress } from "stepwell-core";
import { runGit, splitLines } from "./git.ts";
import type { SyncError } from "./types.ts";

/**
 * H10/30.4: one file that OPEN items on BOTH sides name in their Location
 * bullets — the cheap "these workstreams will collide" prediction, visible
 * before anyone actually edits the file. Read-only derivation in the satellite
 * (core stays git-blind, Decision 14); `overlap[]` remains the factual
 * touched-on-both-sides list.
 */
export interface PredictedOverlapEntry {
  path: string;
  openItems: string[];
}

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
  /** H10/30.4: file-based collision prognosis from open-item Location bullets. */
  predictedOverlap: PredictedOverlapEntry[];
  /**
   * M20/30.5: item ids and table steps that BOTH sides newly added since the
   * merge base — the parallel "same next id" collision, visible before the merge.
   */
  idCollisions: string[];
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

/**
 * Open-item file map at a ref (`git show <ref>:BACKLOG.md` parsed with the core
 * parser — the satellite may read, never write). A ref whose doc state is absent
 * (unborn branch, pre-adoption commit) yields an empty map — prognosis skips
 * silently, never throws.
 */
function openItemFilesAt(root: string, ref: string): Map<string, string[]> {
  const map = new Map<string, string[]>();
  const out = runGit(root, ["show", `${ref}:BACKLOG.md`]);
  if (out.status !== 0) return map;
  for (const item of parseBacklog(out.stdout).value.items) {
    for (const file of item.files) {
      const ids = map.get(file) ?? [];
      ids.push(item.id);
      map.set(file, ids);
    }
  }
  return map;
}

/** Files that open items on BOTH sides name — sorted by path, ids deduped. */
export function predictedOverlap(root: string, branch: string, trunk: string): PredictedOverlapEntry[] {
  const branchFiles = openItemFilesAt(root, branch);
  if (branchFiles.size === 0) return [];
  const trunkFiles = openItemFilesAt(root, trunk);
  const entries: PredictedOverlapEntry[] = [];
  for (const [path, items] of branchFiles) {
    const trunkItems = trunkFiles.get(path);
    if (trunkItems === undefined) continue;
    entries.push({ path, openItems: [...new Set([...items, ...trunkItems])].sort() });
  }
  return entries.sort((a, b) => a.path.localeCompare(b.path));
}

interface IdStepState {
  ids: Set<string>;
  steps: Set<string>;
}

function docStateAt(root: string, ref: string): IdStepState {
  const state: IdStepState = { ids: new Set(), steps: new Set() };
  const backlog = runGit(root, ["show", `${ref}:BACKLOG.md`]);
  if (backlog.status === 0) {
    const parsed = parseBacklog(backlog.stdout).value;
    for (const id of parsed.items.map((i) => i.id)) state.ids.add(id);
    for (const id of parsed.doneIndex.map((d) => d.id)) state.ids.add(id);
  }
  const progress = runGit(root, ["show", `${ref}:PROGRESS.md`]);
  if (progress.status === 0) {
    for (const row of parseProgress(progress.stdout).value.rows) state.steps.add(row.step);
  }
  return state;
}

/**
 * M20/30.5: ids and steps that BOTH sides newly added since the merge base —
 * the intersection of the newly created candidates, read from the doc diffs
 * (no registry). Refs without a readable doc state contribute nothing.
 */
export function idCollisions(root: string, branch: string, trunk: string): string[] {
  const base = runGit(root, ["merge-base", branch, trunk]).stdout.trim();
  if (base === "") return [];
  const freshSince = (ref: string): Set<string> => {
    const baseState = docStateAt(root, base);
    const refState = docStateAt(root, ref);
    const fresh = new Set<string>();
    for (const id of refState.ids) if (!baseState.ids.has(id)) fresh.add(id);
    for (const step of refState.steps) if (!baseState.steps.has(step)) fresh.add(step);
    return fresh;
  };
  const mine = freshSince(branch);
  const theirs = freshSince(trunk);
  return [...mine].filter((x) => theirs.has(x)).sort();
}

/**
 * M20/30.5: item ids, table steps and phase numbers across ALL foreign worktree
 * doc states — the input for `considerWorktrees` on the write tools. The core
 * stays git-blind: the transport collects this and passes it as exclusion
 * options; per-branch failures become warnings, never throws.
 */
export function foreignDocState(root: string): {
  ids: string[];
  steps: string[];
  phases: string[];
  warnings: string[];
} {
  const inside = runGit(root, ["rev-parse", "--is-inside-work-tree"]);
  if (inside.status !== 0 || inside.stdout.trim() !== "true") {
    return { ids: [], steps: [], phases: [], warnings: [`considerWorktrees ignored: git state unavailable at "${root}"`] };
  }
  const { entries } = listWorktrees(root);
  const trunk = entries[0]?.branch ?? "";
  const ids = new Set<string>();
  const steps = new Set<string>();
  const phases = new Set<string>();
  const warnings: string[] = [];
  for (const entry of entries.slice(1)) {
    if (entry.branch === "" || entry.branch === trunk) continue;
    const backlog = runGit(root, ["show", `${entry.branch}:BACKLOG.md`]);
    if (backlog.status !== 0) {
      warnings.push(`considerWorktrees: skipped "${entry.branch}" (BACKLOG.md unreadable at the branch head)`);
      continue;
    }
    for (const id of parseBacklog(backlog.stdout).value.items.map((i) => i.id)) ids.add(id);
    for (const id of parseBacklog(backlog.stdout).value.doneIndex.map((d) => d.id)) ids.add(id);
    const progress = runGit(root, ["show", `${entry.branch}:PROGRESS.md`]);
    if (progress.status !== 0) {
      warnings.push(`considerWorktrees: skipped "${entry.branch}" (PROGRESS.md unreadable at the branch head)`);
      continue;
    }
    const parsedProgress = parseProgress(progress.stdout).value;
    for (const row of parsedProgress.rows) {
      steps.add(row.step);
      phases.add(row.step.split(".")[0] ?? "");
    }
  }
  return { ids: [...ids], steps: [...steps], phases: [...phases], warnings };
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
      predictedOverlap: knownBranch ? predictedOverlap(root, entry.branch, trunk) : [],
      idCollisions: knownBranch ? idCollisions(root, entry.branch, trunk) : [],
    };
  });

  const husks = main !== undefined ? findHusks(main.path) : [];

  return { ok: true, trunk, current, husks, prunable, worktrees };
}
