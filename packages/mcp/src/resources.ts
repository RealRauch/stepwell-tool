import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ResourceTemplate, type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TEMPLATE_KINDS, projectTemplates, type TemplateKind } from "@method-docs/core";

const MARKDOWN = "text/markdown";

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
    new ResourceTemplate("methoddocs://templates/{kind}", {
      list: () => ({
        resources: TEMPLATE_KINDS.map((kind) => ({
          uri: `methoddocs://templates/${kind}`,
          name: `template: ${kind}`,
          description: "Kanonisches Skeleton einer Pflichtdatei (M8) — unverändert übernehmen.",
          mimeType: MARKDOWN,
        })),
      }),
    }),
    {
      title: "Projekt-Vorlagen",
      description:
        "Kanonische Skeletons der vier Pflichtdateien (M8): kind = \"backlog\" | \"progress\" | " +
        "\"backlog-archive\" | \"progress-archive\" — Agent legt daraus die Dateien an " +
        "(Variante A: Read-Only, kein init_project).",
      mimeType: MARKDOWN,
    },
    (uri, { kind }) => {
      const k = String(kind) as TemplateKind;
      if (!TEMPLATE_KINDS.includes(k)) {
        throw new Error(`unknown template kind: ${String(kind)} (erlaubt: ${TEMPLATE_KINDS.join(" | ")})`);
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
    new ResourceTemplate("methoddocs://{root}/backlog", { list: undefined }),
    {
      title: "BACKLOG.md",
      description: "Offene Items eines STEPWELL-Projekts (verbatim; Root percent-encoded im URI).",
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
    new ResourceTemplate("methoddocs://{root}/progress", { list: undefined }),
    {
      title: "PROGRESS.md",
      description: "Fortschrittstabelle + laufende Phasen (verbatim; Root percent-encoded im URI).",
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
    "archive",
    new ResourceTemplate("methoddocs://{root}/archive/{kind}", { list: undefined }),
    {
      title: "Archiv",
      description:
        "Append-only-Archive: kind = \"backlog\" (BACKLOG_ARCHIVE.md) oder \"progress\" " +
        "(PROGRESS_ARCHIVE.md); Root percent-encoded im URI.",
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
        throw new Error(`unknown archive kind: ${String(kind)} (erlaubt: backlog | progress)`);
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
