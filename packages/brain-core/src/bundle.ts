import type { Dirent } from "node:fs"
import { readFile, readdir, stat } from "node:fs/promises"
import { dirname, join, relative, resolve, sep } from "node:path"
import { parseDocument } from "./frontmatter.ts"
import {
  FrontmatterSchema,
  type Concept,
  type Frontmatter,
} from "./types.ts"

/**
 * Names OKF reserves for the bundle's own bookkeeping.
 */
export const RESERVED_FILENAMES = ["index.md", "log.md"] as const

/**
 * The folders a concept type is expected to live in.
 *
 * @remarks
 * A convention, not a law: the linter warns when a concept sits in the
 * wrong folder, because that is usually a sign of drift.
 */
export const TYPE_FOLDERS: Readonly<Record<string, string>> = {
  Convention: "conventions",
  Pattern: "patterns",
  Rule: "rules",
  Decision: "decisions",
  Lesson: "lessons",
  Progress: "progress",
  Problem: "problems",
  Spec: "specs",
  Solution: "solutions",
}

/**
 * Finds the bundle root.
 *
 * @remarks
 * `BRAIN_ROOT` wins. Otherwise the search walks up from the working
 * directory looking for a `docs/` folder that holds a bundle, so the tool
 * works from a subpackage as well as from the repository root.
 */
export async function resolveBrainRoot(startDir?: string): Promise<string> {
  const fromEnv = process.env.BRAIN_ROOT
  if (fromEnv !== undefined && fromEnv !== "") {
    return resolve(fromEnv)
  }

  let current = resolve(startDir ?? process.cwd())
  for (;;) {
    const candidate = join(current, "docs")
    if (await isDirectory(candidate)) {
      return candidate
    }
    const parent = dirname(current)
    if (parent === current) {
      throw new Error(
        "No BRAIN found. Run from the repository, or set BRAIN_ROOT to the bundle folder.",
      )
    }
    current = parent
  }
}

async function isDirectory(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isDirectory()
  } catch {
    return false
  }
}

/**
 * Lists every markdown file in the bundle, in a stable order.
 */
async function listMarkdownFiles(root: string): Promise<string[]> {
  const files: string[] = []

  async function walk(directory: string): Promise<void> {
    let entries: Dirent[]
    try {
      entries = await readdir(directory, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const full = join(directory, entry.name)
      if (entry.isDirectory()) {
        await walk(full)
        continue
      }
      if (!entry.isFile() || !entry.name.endsWith(".md")) {
        continue
      }
      if ((RESERVED_FILENAMES as readonly string[]).includes(entry.name)) {
        continue
      }
      files.push(relative(root, full).split(sep).join("/"))
    }
  }

  await walk(root)
  return files.sort()
}

/**
 * Reads one concept from the bundle.
 */
export async function readConcept(
  root: string,
  path: string,
): Promise<Concept | null> {
  const full = join(root, path)
  let text: string
  try {
    text = await readFile(full, "utf8")
  } catch {
    return null
  }

  const parsed = parseDocument(text)
  const frontmatter = FrontmatterSchema.safeParse(parsed.frontmatter)
  return {
    path,
    frontmatter: frontmatter.success
      ? (frontmatter.data as Frontmatter)
      : (parsed.frontmatter as Frontmatter),
    body: parsed.body,
    ...(parsed.error === undefined ? {} : { parseError: parsed.error }),
  }
}

/**
 * Reads every concept in the bundle.
 */
export async function loadConcepts(root: string): Promise<Concept[]> {
  const paths = await listMarkdownFiles(root)
  const concepts: Concept[] = []
  for (const path of paths) {
    const concept = await readConcept(root, path)
    if (concept !== null) {
      concepts.push(concept)
    }
  }
  return concepts
}
