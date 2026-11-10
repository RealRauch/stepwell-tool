import { spawnSync } from "node:child_process";

/** Raw result of one git invocation (status -1 signals git itself failed to start). */
export interface GitCall {
  status: number;
  stdout: string;
  stderr: string;
}

export function runGit(root: string, args: string[]): GitCall {
  const r = spawnSync("git", ["-C", root, ...args], { encoding: "utf8" });
  if (r.error !== undefined || r.status === null) {
    return { status: -1, stdout: "", stderr: r.error?.message ?? "git failed to start" };
  }
  return { status: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

export function splitLines(stdout: string): string[] {
  return stdout
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line !== "");
}
