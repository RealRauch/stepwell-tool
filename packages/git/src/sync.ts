import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  appendChunkOrder,
  docsValidate,
  docFileSet,
  EMPTY_MARKER_CANONICAL,
  latestStampKey,
} from "stepwell-core";
import { runGit, splitLines } from "./git.ts";
import type { PullOk, PullResult, SyncError } from "./types.ts";

function fail(error: SyncError): PullResult {
  return { ok: false, error };
}

const CONFLICT_OPEN = "<<<<<<<";
const CONFLICT_MID = "=======";
const CONFLICT_CLOSE = ">>>>>>>";

/**
 * H7/27.6: resolve the conflict regions of one doc file mechanically - only
 * regions that are provably parallel appends (merge-base slice at the position
 * empty: blanks or the H6 section marker) or provably disjoint deletions (every
 * side line exists in the base slice - keep what EITHER side kept, 3-way
 * semantics; an emptied section restores the H6 marker). Both sides are never
 * dropped: append order is chronological by completion timestamps when both
 * sides parse, else deterministic HEAD-first (per file; Decision 12's
 * completion chronology stays the guidance for manual resolutions). The only
 * non-append region accepted is a single-line As-of stamp pair (later stamp
 * wins). Everything else - real content edits, table-row conflicts - is NOT
 * resolvable here (undefined -> caller aborts the merge cleanly).
 */
function regionBaseSlice(
  base: string[],
  above: string | undefined,
  below: string | undefined,
): string[] | undefined {
  // M25/32.4: empty base (both-added shard) — the whole file is parallel appends
  if (base.every((l) => l.trim() === "")) return [];
  let start = 0;
  let end = base.length - 1;
  if (above !== undefined) {
    start = base.findIndex((l, i) => i >= start && l.trim() === above.trim());
    if (start === -1) return undefined;
  }
  if (below !== undefined) {
    end = base.findIndex((l, i) => i > start && l.trim() === below.trim());
    if (end === -1) return undefined;
  }
  return base.slice(start + 1, end);
}

export function resolveAppendConflict(content: string, baseContent: string | undefined): string | undefined {
  if (baseContent === undefined) return undefined;
  const lines = content.split(/\r?\n/u);
  const base = baseContent.split(/\r?\n/u);
  const regions: Array<{ open: number; mid: number; close: number }> = [];
  let open = -1;
  let mid = -1;
  for (const [idx, line] of lines.entries()) {
    if (open === -1 && line.startsWith(CONFLICT_OPEN)) {
      open = idx;
      mid = -1;
    } else if (open !== -1 && mid === -1 && line.trim() === CONFLICT_MID) {
      mid = idx;
    } else if (open !== -1 && mid !== -1 && line.startsWith(CONFLICT_CLOSE)) {
      regions.push({ open, mid, close: idx });
      open = -1;
      mid = -1;
    }
  }
  if (open !== -1 || regions.length === 0) return undefined;

  const resolvedSides: Array<string[]> = [];
  // M25/32.4: regions resolved via the "parallel appends into an empty insertion
  // point" path are positional (append semantics) — allowed only at the file end
  // when the base carries content (the classic archive/index append); a both-added
  // file (entirely blank base, e.g. a fresh shard) is appends throughout.
  const appendPath: boolean[] = [];
  const baseHasContent = base.some((l) => l.trim() !== "");
  for (const region of regions) {
    const headSide = lines.slice(region.open + 1, region.mid);
    const trunkSide = lines.slice(region.mid + 1, region.close);
    if (headSide.length === 0 || trunkSide.length === 0) return undefined;
    const headSet = new Set(headSide.map((l) => l.trim()));
    if (trunkSide.some((l) => headSet.has(l.trim()))) return undefined; // overlapping edit

    // nearest non-blank context lines around the region
    let above: string | undefined;
    for (let i = region.open - 1; i >= 0; i--) {
      if (lines[i]!.trim() !== "" && !lines[i]!.startsWith(CONFLICT_OPEN)) {
        above = lines[i]!;
        break;
      }
    }
    let below: string | undefined;
    for (let i = region.close + 1; i < lines.length; i++) {
      if (lines[i]!.trim() !== "" && !lines[i]!.startsWith(CONFLICT_CLOSE)) {
        below = lines[i]!;
        break;
      }
    }

    const slice = regionBaseSlice(base, above, below);
    if (slice === undefined) return undefined;
    const baseSet = new Set(slice.map((l) => l.trim()).filter((l) => l !== ""));
    const order = appendChunkOrder(headSide.join("\n"), trunkSide.join("\n"));
    const orderedSides =
      order !== undefined && order > 0 ? [...trunkSide, ...headSide] : [...headSide, ...trunkSide];

    if (baseSet.size === 0) {
      // parallel appends into an empty insertion point (archives, empty sections)
      appendPath.push(true);
      resolvedSides.push(orderedSides);
      continue;
    }
    // disjoint deletions/subset case: every side line must exist in the base slice -
    // keep exactly what EITHER side kept (two workstreams archiving different items
    // of one section, for instance); an emptied section restores the H6 marker
    const sideLines = new Set([...headSide, ...trunkSide].map((l) => l.trim()));
    if ([...sideLines].every((l) => l === "" || baseSet.has(l))) {
      appendPath.push(false);
      const kept = slice.filter((l) => l.trim() === "" || sideLines.has(l.trim()));
      const keptNonBlank = kept.filter((l) => l.trim() !== "");
      if (keptNonBlank.length > 0) {
        resolvedSides.push(kept);
        continue;
      }
      if (above !== undefined && /^##\s+/u.test(above.trim())) {
        resolvedSides.push(["", EMPTY_MARKER_CANONICAL, ""]);
        continue;
      }
      resolvedSides.push([]);
      continue;
    }
    // non-append region: only a single-line As-of stamp pair is deterministic
    if (headSide.length === 1 && trunkSide.length === 1) {
      const keyHead = latestStampKey(headSide[0]!);
      const keyTrunk = latestStampKey(trunkSide[0]!);
      if (keyHead !== undefined && keyTrunk !== undefined) {
        appendPath.push(false);
        resolvedSides.push(keyHead >= keyTrunk ? [...headSide] : [...trunkSide]);
        continue;
      }
    }
    return undefined;
  }

  const out: string[] = [];
  let cursor = 0;
  for (const [i, region] of regions.entries()) {
    const ctx = lines.slice(cursor, region.open);
    while (ctx.length > 0 && ctx[ctx.length - 1]!.trim() === "" && cursor + ctx.length > 0) ctx.pop();
    if (ctx.length > 0) out.push(...ctx, "");
    out.push(...resolvedSides[i]!);
    cursor = region.close + 1;
    // M25/32.4: the tail is PRESERVED (not refused) — mid-file regions are
    // legitimate (parallel block removals in one BACKLOG section land mid-file
    // once the Done Index lives in the shards, M24). Positional append-path
    // regions (empty insertion point in a non-empty base) still require the
    // file-end position: a mid-file parallel INSERT of real content must abort.
    const isLast = i === regions.length - 1;
    if (isLast) {
      const tail = lines.slice(cursor);
      const tailHasContent = tail.some((l) => l.trim() !== "");
      if (appendPath[i]! && baseHasContent && tailHasContent) return undefined;
      while (tail.length > 0 && tail[0]!.trim() === "") tail.shift();
      out.push("", ...tail);
    } else {
      if (appendPath[i]! && baseHasContent) return undefined;
      out.push("");
    }
  }
  return `${out.join("\n")}\n`;
}

const EMPTY_MARKER_LINE = /^>\s*(?:No open items\.|Keine offenen Punkte\.?)\s*$/u;

/**
 * H7/27.6: attempt mechanical resolution for ALL conflicted files — every file
 * must be one of the four doc paths AND every region provably a parallel append
 * (merge-base slice empty) or an As-of stamp pair; one unresolvable file aborts
 * the whole attempt (returns undefined → caller aborts the merge cleanly).
 */
const SHARD_PATH = /docs[\\/]archive[\\/](?:BACKLOG|PROGRESS)_ARCHIVE\.p\d+\.md$/u;

function resolveDocAppends(root: string, conflicted: string[], baseSha: string): string[] | undefined {
  // M25/32.4: derived doc file set — shards count as doc files (H7 per file unchanged)
  const docSet = new Set(docFileSet(root).map((f) => f.replaceAll("/", "\\")));
  const files: string[] = [];
  const contents = new Map<string, string>();
  for (const rel of conflicted) {
    const native = rel.replaceAll("/", "\\");
    if (!docSet.has(native)) return undefined;
    const show = runGit(root, ["show", `${baseSha}:${rel.replace(/\\/gu, "/")}`]);
    // both-added shard (each worktree created it during its running phase) has no
    // merge base — resolve against an empty base (parallel appends only; a shard
    // is append-only, so this stays deterministic). Canonical files keep the
    // strict no-base abort.
    const baseContent = show.status === 0 ? show.stdout : SHARD_PATH.test(rel) ? "" : undefined;
    if (baseContent === undefined) return undefined;
    const abs = join(root, rel);
    const content = readFileSync(abs, "utf8");
    const resolved = resolveAppendConflict(content, baseContent);
    if (resolved === undefined) return undefined;
    contents.set(abs, resolved);
    files.push(rel);
  }
  for (const [abs, content] of contents) writeFileSync(abs, content, "utf8");
  return files;
}

/**
 * Trunk branch of the project = the branch checked out in the MAIN worktree
 * (PLAYBOOK §1 "zero config"). `undefined` when it cannot be determined
 * (bare repo, detached main worktree).
 */
export function resolveTrunkBranch(root: string): string | undefined {
  const list = runGit(root, ["worktree", "list", "--porcelain"]);
  if (list.status !== 0) return undefined;
  const mainPath = splitLines(list.stdout)
    .find((line) => line.startsWith("worktree "))
    ?.slice("worktree ".length);
  if (mainPath === undefined) return undefined;
  const branch = runGit(mainPath, ["branch", "--show-current"]).stdout.trim();
  return branch === "" ? undefined : branch;
}

function commitsTouching(root: string, base: string, tip: string, file: string): number {
  if (base === "" || base === tip) return 0;
  const out = runGit(root, ["rev-list", "--count", `${base}..${tip}`, "--", file]).stdout.trim();
  const n = Number.parseInt(out, 10);
  return Number.isNaN(n) ? 0 : n;
}

/** Count of commits in a rev-list range (0 when unparseable). */
export function commitCount(root: string, range: string): number {
  const out = runGit(root, ["rev-list", "--count", range]).stdout.trim();
  const n = Number.parseInt(out, 10);
  return Number.isNaN(n) ? 0 : n;
}

export type PullGuards = { ok: true; branch: string; trunk: string } | { ok: false; error: SyncError };

function guardFail(error: SyncError): { ok: false; error: SyncError } {
  return { ok: false, error };
}


/**
 * Guard chain of the pull operation, shared by the real op and its dry-run
 * preview — one source of truth so a dry-run can never disagree with the
 * merge it forecasts.
 */
export function pullGuards(root: string): PullGuards {
  const inside = runGit(root, ["rev-parse", "--is-inside-work-tree"]);
  if (inside.status !== 0 || inside.stdout.trim() !== "true") {
    if (inside.status === -1) {
      return guardFail({ code: "GIT_MISSING", message: "git is not available on PATH", detail: inside.stderr });
    }
    return guardFail({ code: "NOT_A_GIT_REPO", message: `"${root}" is not inside a git work tree` });
  }

  const branch = runGit(root, ["branch", "--show-current"]).stdout.trim();
  if (branch === "") {
    return guardFail({ code: "DETACHED_HEAD", message: "HEAD is detached — a workstream needs a branch to merge into" });
  }

  const dirty = runGit(root, ["status", "--porcelain"]);
  const dirtyFiles = splitLines(dirty.stdout).map((line) => line.slice(3).trim());
  if (dirtyFiles.length > 0) {
    return guardFail({
      code: "DIRTY_TREE",
      message: "working tree has uncommitted changes — commit or stash before syncing",
      files: dirtyFiles,
    });
  }

  const trunk = resolveTrunkBranch(root);
  if (trunk === undefined) {
    return guardFail({ code: "MERGE_REFUSED", message: "cannot determine the trunk branch (main worktree has no branch)" });
  }
  return { ok: true, branch, trunk };
}

/**
 * Pull (merge trunk → branch) inside the caller's workstream worktree —
 * the risky direction: code conflicts surface HERE, before trunk moves
 * (PLAYBOOK §1 ritual). Guards run before anything touches the tree;
 * a conflict aborts cleanly back to the pre-merge state with a structured
 * report (files + per-side commit counts). Post-merge the four docs are
 * re-validated as the mechanical net.
 */
export function pullTrunk(root: string): PullResult {
  const guards = pullGuards(root);
  if (!guards.ok) return guards;
  const { branch, trunk } = guards;
  const headBefore = runGit(root, ["rev-parse", "HEAD"]).stdout.trim();
  const merge = runGit(root, [
    "merge",
    "--no-edit",
    "-m",
    `stepwell: sync trunk (${trunk}) into ${branch}`,
    trunk,
  ]);

  if (merge.status !== 0) {
    const conflicted = splitLines(runGit(root, ["diff", "--name-only", "--diff-filter=U"]).stdout);
    if (conflicted.length > 0) {
      const baseSha = runGit(root, ["merge-base", headBefore, trunk]).stdout.trim();
      // H7/27.6: mechanical resolution for the provably-parallel-append case —
      // all conflicted doc files must resolve against the merge base, anything
      // else aborts cleanly as before.
      const resolution = baseSha !== "" ? resolveDocAppends(root, conflicted, baseSha) : undefined;
      let concluded = false;
      let resolvedFiles: string[] = [];
      if (resolution !== undefined) {
        runGit(root, ["add", "--", ...conflicted]);
        const conclude = runGit(root, ["commit", "--no-edit"]);
        if (conclude.status === 0) {
          concluded = true;
          resolvedFiles = resolution;
        } else {
          runGit(root, ["merge", "--abort"]); // conclude failed — never leave a half-merge
        }
      }
      if (!concluded) {
        // Clean abort: back to the exact pre-merge state; report both sides.
        runGit(root, ["merge", "--abort"]);
        const detail = conflicted
          .map((file) =>
            `${file} (branch: ${commitsTouching(root, baseSha, headBefore, file)} commit(s), trunk: ${commitsTouching(root, baseSha, trunk, file)} commit(s))`,
          )
          .join("; ");
        return fail({
          code: "MERGE_CONFLICT",
          message: `merge of "${trunk}" into "${branch}" conflicts — aborted cleanly, resolve and retry`,
          files: conflicted,
          detail,
        });
      }
      const headAfterResolved = runGit(root, ["rev-parse", "HEAD"]).stdout.trim();
      const trunkHeadResolved = runGit(root, ["rev-parse", trunk]).stdout.trim();
      const mergedFilesResolved = splitLines(runGit(root, ["diff", "--name-only", headBefore, "HEAD"]).stdout).length;
      const validationResolved = docsValidate(root);
      const resolvedPull: PullOk = {
        ok: true,
        branch,
        trunk,
        fastForward: headAfterResolved === trunkHeadResolved && headBefore !== trunkHeadResolved,
        mergedFiles: mergedFilesResolved,
        validation: {
          ok: validationResolved.ok,
          findings: validationResolved.findings.length,
          warnings: validationResolved.warnings.length,
        },
        resolved: resolvedFiles,
      };
      return resolvedPull;
    }
    return fail({
      code: "MERGE_REFUSED",
      message: `git refused the merge of "${trunk}" into "${branch}"`,
      detail: (merge.stderr.trim() !== "" ? merge.stderr : merge.stdout).trim(),
    });
  }

  const headAfter = runGit(root, ["rev-parse", "HEAD"]).stdout.trim();
  const trunkHead = runGit(root, ["rev-parse", trunk]).stdout.trim();
  const mergedFiles = splitLines(runGit(root, ["diff", "--name-only", headBefore, "HEAD"]).stdout).length;
  const validation = docsValidate(root);
  const pull: PullOk = {
    ok: true,
    branch,
    trunk,
    fastForward: headAfter === trunkHead && headBefore !== trunkHead,
    mergedFiles,
    validation: {
      ok: validation.ok,
      findings: validation.findings.length,
      warnings: validation.warnings.length,
    },
  };
  return pull;
}
