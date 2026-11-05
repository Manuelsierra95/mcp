import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { serializeDocument } from "./frontmatter.ts"
import { loadConcepts, readConcept, TYPE_FOLDERS } from "./bundle.ts"
import { writeIndexes } from "./indexer.ts"
import { isBlocking, validateConcept } from "./validate.ts"
import type { Concept, Frontmatter } from "./types.ts"

/**
 * What a concept looks like when it is about to be written.
 */
export interface ConceptDraft {
  /** Path relative to the bundle root. */
  readonly path: string
  readonly frontmatter: Frontmatter
  readonly body: string
}

/**
 * What happened when a concept was written.
 */
export interface WriteResult {
  readonly path: string
  /** True when the file did not exist before. */
  readonly created: boolean
  /** The concepts that were updated, if the write touched an existing one. */
  readonly updated: boolean
  readonly indexes: readonly string[]
}

/**
 * Writes a concept.
 *
 * @remarks
 * The concept is validated first: a concept that does not pass the linter
 * is not written. The index is regenerated and the log gets a line, so the
 * bundle stays consistent without anyone having to remember to do it.
 *
 * The frontmatter of an existing concept is never rewritten: it is
 * immutable once the concept exists, and only the body grows. That is what
 * keeps two branches from conflicting over the same concept.
 */
export async function writeConcept(
  root: string,
  draft: ConceptDraft,
): Promise<WriteResult> {
  const existing = await readConcept(root, draft.path)
  const frontmatter = existing?.frontmatter ?? draft.frontmatter
  const body = existing === null ? draft.body : appendBody(existing.body, draft.body)

  const candidate: Concept = {
    path: draft.path,
    frontmatter,
    body,
  }

  const findings = validateConcept(candidate).filter(isBlocking)
  if (findings.length > 0) {
    throw new Error(
      `The concept does not pass the linter:\n${findings
        .map((finding) => `  - ${finding.code}: ${finding.message}`)
        .join("\n")}`,
    )
  }

  const full = join(root, draft.path)
  await mkdir(dirname(full), { recursive: true })
  await writeFile(full, serializeDocument(frontmatter, body), "utf8")

  const concepts = await loadConcepts(root)
  const indexes = await writeIndexes(root, concepts)

  await appendLog(root, {
    kind: existing === null ? "created" : "updated",
    path: draft.path,
    detail: frontmatter.title ?? draft.path,
  })

  return {
    path: draft.path,
    created: existing === null,
    updated: existing !== null,
    indexes,
  }
}

/**
 * Appends to the body without touching what is already there.
 */
function appendBody(existing: string, addition: string): string {
  const trimmed = addition.trim()
  if (trimmed === "") {
    return existing
  }
  if (existing.trim() === "") {
    return `${trimmed}\n`
  }
  return `${existing.replace(/\n+$/, "")}\n\n${trimmed}\n`
}

/**
 * One line of history.
 */
export interface LogEntry {
  readonly kind: string
  readonly path: string
  readonly detail?: string
}

/**
 * Adds a line to `log.md`.
 *
 * @remarks
 * The log is append-only and one line per event, so two branches that log
 * something do not conflict.
 */
export async function appendLog(
  root: string,
  entry: LogEntry,
): Promise<void> {
  const at = new Date().toISOString()
  const detail = entry.detail === undefined ? "" : ` · ${entry.detail}`
  await appendFile(
    join(root, "log.md"),
    `- ${at} · ${entry.kind} · ${entry.path}${detail}\n`,
    "utf8",
  )
}

/**
 * The path a new concept of a type belongs to.
 */
export function pathForType(
  type: string,
  slug: string,
  frontmatter: Frontmatter,
): string {
  const folder = TYPE_FOLDERS[type] ?? "notes"
  const stamp = frontmatter.generated?.at?.slice(0, 10) ?? ""
  const prefix = stamp === "" ? "" : `${stamp}-`
  return `${folder}/${prefix}${slug}.md`
}

/**
 * Turns a title into a file name.
 */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/gu, "")
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .slice(0, 60)
}

/**
 * Reads the whole bundle as a map, for callers that want it all.
 */
export async function loadBundle(root: string): Promise<Map<string, Concept>> {
  const concepts = await loadConcepts(root)
  return new Map(concepts.map((concept) => [concept.path, concept]))
}

/**
 * Reads the log, if it exists.
 */
export async function readLog(root: string): Promise<string> {
  return readFile(join(root, "log.md"), "utf8").catch(() => "")
}
