import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ResourceTemplate, type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  TEMPLATE_KINDS,
  fileHashes,
  phaseContext,
  projectTemplates,
  type TemplateKind,
} from "stepwell-core";

const MARKDOWN = "text/markdown";
const JSON_MIME = "application/json";

function decodeRoot(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function readOrThrow(path: string): string {
  try {
    return readFileSync(path, "utf8");
  } catch {
    throw new Error(`missing required file: ${path}`);
  }
}

export function registerDocsResources(server: McpServer): void {
  server.registerResource(
    "templates",
    new ResourceTemplate("stepwell://templates/{kind}", {
      list: () => ({
        resources: TEMPLATE_KINDS.map((kind) => ({
          uri: `stepwell://templates/${kind}`,
          name: `template: ${kind}`,
          description: "Canonical skeleton of a mandatory file (M8) — adopt unchanged.",
          mimeType: MARKDOWN,
        })),
      }),
    }),
    {
      title: "Project templates",
      description:
        "Canonical skeletons of the four mandatory files (M8): kind = \"backlog\" | \"progress\" | " +
        "\"backlog-archive\" | \"progress-archive\" — the agent creates the files from these " +
        "(variant A: read-only, no init_project).",
      mimeType: MARKDOWN,
    },
    (uri, { kind }) => {
      const k = String(kind) as TemplateKind;
      if (!TEMPLATE_KINDS.includes(k)) {
        throw new Error(`unknown template kind: ${String(kind)} (allowed: ${TEMPLATE_KINDS.join(" | ")})`);
      }
      return {
        contents: [
          { uri: uri.href, text: projectTemplates[k], mimeType: MARKDOWN },
        ],
      };
    },
  );

  server.registerResource(
    "backlog",
    new ResourceTemplate("stepwell://{root}/backlog", { list: undefined }),
    {
      title: "BACKLOG.md",
      description: "Open items of a STEPWELL project (verbatim; root percent-encoded in the URI).",
      mimeType: MARKDOWN,
    },
    (uri, { root }) => ({
      contents: [
        {
          uri: uri.href,
          text: readOrThrow(join(decodeRoot(String(root)), "BACKLOG.md")),
          mimeType: MARKDOWN,
        },
      ],
    }),
  );

  server.registerResource(
    "progress",
    new ResourceTemplate("stepwell://{root}/progress", { list: undefined }),
    {
      title: "PROGRESS.md",
      description: "Progress table + active phases (verbatim; root percent-encoded in the URI).",
      mimeType: MARKDOWN,
    },
    (uri, { root }) => ({
      contents: [
        {
          uri: uri.href,
          text: readOrThrow(join(decodeRoot(String(root)), "PROGRESS.md")),
          mimeType: MARKDOWN,
        },
      ],
    }),
  );

  server.registerResource(
    "hashes",
    new ResourceTemplate("stepwell://{root}/hashes", { list: undefined }),
    {
      title: "File hashes",
      description:
        "SHA256 per doc file as JSON (E2/12.5) — the client compares against the last known " +
        "state and skips full reads when everything is unchanged (fast path E3). " +
        "Root percent-encoded in the URI.",
      mimeType: JSON_MIME,
    },
    (uri, { root }) => ({
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify(fileHashes(decodeRoot(String(root)))),
          mimeType: JSON_MIME,
        },
      ],
    }),
  );

  server.registerResource(
    "phase",
    new ResourceTemplate("stepwell://{root}/phase/{phase}", { list: undefined }),
    {
      title: "Phase context",
      description:
        "Phase verbatim + table rows + merged backlog item bodies in step order " +
        "(G5/12.6 — composition at read time, no duplicate in the files). Search across active " +
        "phases and archive; root and phase percent-encoded in the URI.",
      mimeType: MARKDOWN,
    },
    (uri, { root, phase }) => ({
      contents: [
        {
          uri: uri.href,
          text: phaseContext(decodeRoot(String(root)), decodeRoot(String(phase))).markdown,
          mimeType: MARKDOWN,
        },
      ],
    }),
  );

  server.registerResource(
    "archive",
    new ResourceTemplate("stepwell://{root}/archive/{kind}", { list: undefined }),
    {
      title: "Archive",
      description:
        "Append-only archives: kind = \"backlog\" (BACKLOG_ARCHIVE.md) or \"progress\" " +
        "(PROGRESS_ARCHIVE.md); root percent-encoded in the URI.",
      mimeType: MARKDOWN,
    },
    (uri, { root, kind }) => {
      const archivePath = (k: string): string | undefined =>
        k === "backlog"
          ? join("docs", "archive", "BACKLOG_ARCHIVE.md")
          : k === "progress"
            ? join("docs", "archive", "PROGRESS_ARCHIVE.md")
            : undefined;
      const rel = archivePath(String(kind));
      if (rel === undefined) {
        throw new Error(`unknown archive kind: ${String(kind)} (allowed: backlog | progress)`);
      }
      return {
        contents: [
          {
            uri: uri.href,
            text: readOrThrow(join(decodeRoot(String(root)), rel)),
            mimeType: MARKDOWN,
          },
        ],
      };
    },
  );
}
