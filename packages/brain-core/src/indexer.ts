import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, join, relative, sep } from "node:path"
import type { Concept } from "./types.ts"

/**
 * The generated listing of a folder.
 */
export interface IndexEntry {
  /** Path of the index file, relative to the bundle root. */
  readonly path: string
  readonly content: string
}

/**
 * Lists the concepts of a folder, grouped by the folder they live in.
 */
function groupByFolder(
  concepts: readonly Concept[],
): Map<string, Concept[]> {
  const groups = new Map<string, Concept[]>()
  for (const concept of concepts) {
    const folder = concept.path.includes("/")
      ? concept.path.slice(0, concept.path.lastIndexOf("/"))
      : ""
    const existing = groups.get(folder)
    if (existing === undefined) {
      groups.set(folder, [concept])
    } else {
      existing.push(concept)
    }
  }
  return groups
}

/**
 * Generates the listing of every folder in the bundle.
 *
 * @remarks
 * The links are relative to the listing that holds them, so they work both
 * in a browser and in an agent that resolves paths from the file it read.
 * OKF allows relative links next to the bundle-absolute ones.
 */
export function generateIndexes(concepts: readonly Concept[]): IndexEntry[] {
  const groups = groupByFolder(concepts)
  const folders = [...groups.keys()].sort()

  const entries: IndexEntry[] = []

  // The root listing always exists: it is the entry point of the bundle, even
  // when every concept lives in a folder.
  const foldersWithConcepts = folders.filter((name) => name !== "")
  const rootLines: string[] = ["# BRAIN", ""]
  rootLines.push(
    "El conocimiento del proyecto, en formato OKF. Un concepto = un fichero.",
    "",
  )
  if (foldersWithConcepts.length > 0) {
    rootLines.push("## Carpetas", "")
    for (const folder of foldersWithConcepts) {
      const count = (groups.get(folder) ?? []).length
      rootLines.push(
        `- [${titleize(folder)}](${folder}/index.md) — ${count} ${count === 1 ? "concepto" : "conceptos"}`,
      )
    }
    rootLines.push("")
  }
  entries.push({
    path: "index.md",
    content: `${rootLines.join("\n").replace(/\n+$/, "")}\n`,
  })

  for (const folder of foldersWithConcepts) {
    const inFolder = (groups.get(folder) ?? []).slice().sort((a, b) =>
      a.path.localeCompare(b.path),
    )
    const title = titleize(folder)
    const lines: string[] = [`# ${title}`, ""]

    if (inFolder.length > 0) {
      lines.push("## Conceptos", "")
      for (const concept of inFolder) {
        const name = relativePath(folder, concept.path)
        const description =
          concept.frontmatter.description ??
          concept.frontmatter.title ??
          concept.path
        const label = concept.frontmatter.title ?? name
        lines.push(`- [${label}](${name}) — ${description}`)
      }
      lines.push("")
    }

    entries.push({
      path: folder === "" ? "index.md" : `${folder}/index.md`,
      content: `${lines.join("\n").replace(/\n+$/, "")}\n`,
    })
  }

  return entries
}

/**
 * Writes the generated listings.
 *
 * @returns The paths that changed.
 */
export async function writeIndexes(
  root: string,
  concepts: readonly Concept[],
): Promise<string[]> {
  const changed: string[] = []
  for (const entry of generateIndexes(concepts)) {
    const full = join(root, entry.path)
    const current = await readFile(full, "utf8").catch(() => null)
    if (current === entry.content) {
      continue
    }
    await mkdir(dirname(full), { recursive: true })
    await writeFile(full, entry.content, "utf8")
    changed.push(entry.path)
  }
  return changed
}

/**
 * Checks that the generated listings are up to date.
 *
 * @returns The paths that are stale or missing.
 */
export async function checkIndexes(
  root: string,
  concepts: readonly Concept[],
): Promise<string[]> {
  const stale: string[] = []
  for (const entry of generateIndexes(concepts)) {
    const full = join(root, entry.path)
    const current = await readFile(full, "utf8").catch(() => null)
    if (current !== entry.content) {
      stale.push(entry.path)
    }
  }
  return stale
}

/**
 * The relative link from one folder to a concept.
 */
function relativePath(fromFolder: string, path: string): string {
  if (fromFolder === "") {
    return path
  }
  const relativePath = relative(fromFolder, path).split(sep).join("/")
  return relativePath
}

/**
 * The titles of the bundle's folders.
 *
 * @remarks
 * The folder names are English, because they are paths. The titles are the
 * ones the team reads.
 */
const FOLDER_TITLES: Readonly<Record<string, string>> = {
  conventions: "Convenciones",
  patterns: "Patrones",
  rules: "Reglas",
  decisions: "Decisiones",
  lessons: "Lecciones",
  progress: "Avances",
  problems: "Problemas",
  specs: "Especificaciones",
  solutions: "Soluciones",
}

/**
 * Turns a folder name into a title.
 */
function titleize(folder: string): string {
  const known = FOLDER_TITLES[folder]
  if (known !== undefined) {
    return known
  }
  const first = folder.charAt(0).toUpperCase() + folder.slice(1)
  return first
}
