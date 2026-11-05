import { parse, stringify } from "yaml"

/**
 * A markdown file split into its frontmatter and its body.
 */
export interface ParsedDocument {
  readonly frontmatter: Record<string, unknown>
  readonly body: string
  /** Set when the frontmatter is not valid YAML. */
  readonly error?: string
}

/**
 * Splits a markdown file into frontmatter and body.
 *
 * @remarks
 * The frontmatter block is delimited by `---` on its own line, as OKF
 * specifies. A file without frontmatter is a body with no frontmatter, not
 * an error: the linter decides whether that is a problem.
 */
export function parseDocument(text: string): ParsedDocument {
  const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n")
  if (!normalized.startsWith("---\n")) {
    return { frontmatter: {}, body: normalized }
  }

  const end = normalized.indexOf("\n---", 4)
  if (end === -1) {
    return {
      frontmatter: {},
      body: normalized,
      error: "The frontmatter block is never closed.",
    }
  }

  const raw = normalized.slice(4, end)
  const body = normalized.slice(end + 4).replace(/^\n/, "")

  try {
    const parsed = parse(raw)
    if (parsed === null || parsed === undefined) {
      return { frontmatter: {}, body }
    }
    if (typeof parsed !== "object" || Array.isArray(parsed)) {
      return {
        frontmatter: {},
        body,
        error: "The frontmatter is not a mapping.",
      }
    }
    return { frontmatter: parsed as Record<string, unknown>, body }
  } catch (error) {
    const message = (error as Error).message
    const hint = /compact mapping/i.test(message)
      ? " A value with a colon has to be quoted: description: \"One: two\"."
      : ""
    return {
      frontmatter: {},
      body,
      error: `The frontmatter is not valid YAML: ${message}.${hint}`,
    }
  }
}

/**
 * Joins frontmatter and body back into a markdown file.
 *
 * @remarks
 * The frontmatter is written with the key order it has, so a concept that
 * was read and written again does not churn the diff.
 */
export function serializeDocument(
  frontmatter: Record<string, unknown>,
  body: string,
): string {
  const yaml = stringify(frontmatter, { lineWidth: 0 }).trimEnd()
  const trimmedBody = body.replace(/^\n+/, "")
  return `---\n${yaml}\n---\n\n${trimmedBody.replace(/\n+$/, "")}\n`
}
