import type { Priority, Status } from "./types.ts";

/**
 * ASCII-Aliase je Emoji-Wert (T3): Die CLI akzeptiert zusätzlich zu den Icons
 * diese Aliase (case-insensitiv). Das MCP-Schema bleibt bei den Emojis —
 * Agenten emittieren sie zuverlässig; Menschen tippen die Aliase.
 */
export const PRIORITY_ALIASES: Readonly<
  Record<Exclude<Priority, "unknown">, readonly string[]>
> = {
  "🔴": ["red", "kritisch", "p1"],
  "🟠": ["orange", "hoch", "p2"],
  "🟡": ["yellow", "mittel", "p3"],
  "🟢": ["green", "niedrig", "p4"],
  "🔵": ["blue", "test", "p5"],
};

export const STATUS_ALIASES: Readonly<
  Record<Exclude<Status, "unknown">, readonly string[]>
> = {
  "⬜": ["open"],
  "🔄": ["running", "wip"],
  "✅": ["done"],
  "⛔": ["blocked"],
};

const PRIORITY_KEYS = Object.keys(PRIORITY_ALIASES) as Array<Exclude<Priority, "unknown">>;
const STATUS_KEYS = Object.keys(STATUS_ALIASES) as Array<Exclude<Status, "unknown">>;

export function resolvePriority(token: string): Priority | undefined {
  if ((PRIORITY_KEYS as string[]).includes(token)) return token as Priority;
  if (token === "unknown") return "unknown";
  const t = token.toLowerCase();
  for (const key of PRIORITY_KEYS) {
    if (PRIORITY_ALIASES[key].includes(t)) return key;
  }
  return undefined;
}

export function resolveStatus(token: string): Status | undefined {
  if ((STATUS_KEYS as string[]).includes(token)) return token as Status;
  if (token === "unknown") return "unknown";
  const t = token.toLowerCase();
  for (const key of STATUS_KEYS) {
    if (STATUS_ALIASES[key].includes(t)) return key;
  }
  return undefined;
}

export function priorityAliasHelp(): string {
  return (
    PRIORITY_KEYS.map((key) => `${key}=${PRIORITY_ALIASES[key].join("/")}`).join(", ") +
    ", unknown"
  );
}

export function statusAliasHelp(): string {
  return (
    STATUS_KEYS.map((key) => `${key}=${STATUS_ALIASES[key].join("/")}`).join(", ") + ", unknown"
  );
}
