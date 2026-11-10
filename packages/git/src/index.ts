export { runGit, splitLines, type GitCall } from "./git.ts";
export { commitDocs, docCommitMessage } from "./commit.ts";
export { pullTrunk, resolveTrunkBranch } from "./sync.ts";
export { pushTrunk, type PushOk, type PushResult } from "./push.ts";
export type { CommitDocsOk, CommitDocsResult, PullOk, PullResult, SyncError, SyncErrorCode } from "./types.ts";
