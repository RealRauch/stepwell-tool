export function lineDiff(before: string, after: string, context = 2): string {
  const splitLines = (content: string): string[] =>
    content === "" ? [] : content.replace(/\r?\n$/u, "").split("\n");
  const a = splitLines(before);
  const b = splitLines(after);

  let prefix = 0;
  while (prefix < a.length && prefix < b.length && a[prefix] === b[prefix]) {
    prefix += 1;
  }
  let suffix = 0;
  while (
    suffix < a.length - prefix &&
    suffix < b.length - prefix &&
    a[a.length - 1 - suffix] === b[b.length - 1 - suffix]
  ) {
    suffix += 1;
  }

  const removed = a.slice(prefix, a.length - suffix);
  const added = b.slice(prefix, b.length - suffix);
  if (removed.length === 0 && added.length === 0) {
    return "";
  }

  const lines: string[] = [];
  for (const line of a.slice(Math.max(0, prefix - context), prefix)) {
    lines.push(` ${line}`);
  }
  for (const line of removed) {
    lines.push(`-${line}`);
  }
  for (const line of added) {
    lines.push(`+${line}`);
  }
  for (const line of a.slice(a.length - suffix, a.length - suffix + context)) {
    lines.push(` ${line}`);
  }
  return lines.join("\n");
}
