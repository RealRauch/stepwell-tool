export { runGit, splitLines, type GitCall } from "./git.ts";
export { commitDocs, docCommitMessage } from "./commit.ts";
export { pullGuards, pullTrunk, commitCount, resolveTrunkBranch } from "./sync.ts";
export { pushGuards, pushTrunk, type PushOk, type PushResult } from "./push.ts";
export { syncPreview, type PullPreviewOk, type PushPreviewOk, type SyncPreviewOk, type SyncPreviewResult } from "./preview.ts";
export { workstreamReport, type WorkstreamInfo, type WorkstreamReportOk, type WorkstreamReportResult } from "./report.ts";
export type { CommitDocsOk, CommitDocsResult, PullOk, PullResult, SyncError, SyncErrorCode } from "./types.ts";
