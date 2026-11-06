import { execFile } from "node:child_process"
import { readFile } from "node:fs/promises"
import { resolve, sep } from "node:path"
import { promisify } from "node:util"
import { loadConcepts } from "./bundle.ts"
import { checkIndexes } from "./indexer.ts"
import { evaluateRules } from "./rules.ts"
import { bySeverity, isBlocking, validateConcept } from "./validate.ts"
import type { Finding, ScannedFile } from "./types.ts"

const run = promisify(execFile)

/**
 * What the gate found.
 */
export interface CheckResult {
  readonly findings: readonly Finding[]
  /** The files the change touched. */
  readonly changed: readonly ScannedFile[]
  /** Whether the change passes. */
  readonly passes: boolean
}

export interface CheckOptions {
  /** The bundle root. */
  readonly root: string
  /** The repository root. Defaults to the parent of the bundle. */
  readonly repoRoot?: string
  /** The paths to consider. Defaults to what git says changed. */
  readonly paths?: readonly string[]
}

/**
 * The gate: the bundle is valid, the rules hold, and the change documented
 * something.
 *
 * @remarks
 * This is the one function the CLI, the MCP and the CI all call. If they
 * each had their own copy, they would drift, and the gate would end up
 * meaning three different things.
 */
export async function checkBundle(options: CheckOptions): Promise<CheckResult> {
  const root = options.root
  const repoRoot = options.repoRoot ?? resolve(root, "..")
  const concepts = await loadConcepts(root)

  const findings: Finding[] = concepts.flatMap((concept) =>
    validateConcept(concept),
  )

  const changed = await collectChange(repoRoot, options.paths)
  const repo = await repoFiles(repoRoot)
  findings.push(
    ...(await evaluateRules(concepts, {
      changed,
      repo,
      read: (path) =>
        readFile(resolve(repoRoot, path), "utf8").catch(() => null),
    })),
  )

  for (const path of await checkIndexes(root, concepts)) {
    findings.push({
      severity: "major",
      code: "index/stale",
      path: `docs/${path}`,
      message: "The index is out of date. Run `pnpm brain index`.",
    })
  }

  // A change to code that says nothing in the BRAIN is a change nobody can
  // learn from later.
  if (
    changed.length > 0 &&
    !changed.some((file) => file.path.startsWith("docs/"))
  ) {
    findings.push({
      severity: "minor",
      code: "brain/undocumented",
      path: "docs/",
      message:
        "This change touches code and does not touch the BRAIN. Record what happened with `brain_note` or `brain_record`.",
    })
  }

  const ordered = [...findings].sort(bySeverity)
  return {
    findings: ordered,
    changed,
    passes: !ordered.some(isBlocking),
  }
}

/**
 * Gathers the files a change touched.
 *
 * @remarks
 * Without an explicit list, it asks git: what changed in the working tree,
 * what is staged, and what is untracked. That covers the three ways a
 * change can be waiting to be committed.
 */
export async function collectChange(
  repoRoot: string,
  explicit?: readonly string[],
): Promise<ScannedFile[]> {
  const paths = new Set<string>()

  if (explicit !== undefined) {
    for (const path of explicit) {
      paths.add(path.trim())
    }
  } else {
    for (const command of [
      ["diff", "--name-only", "HEAD"],
      ["diff", "--name-only", "--cached"],
      ["ls-files", "--others", "--exclude-standard"],
    ]) {
      const result = await run("git", command, { cwd: repoRoot }).catch(() => ({
        stdout: "",
      }))
      for (const line of result.stdout.split("\n")) {
        const path = line.trim()
        if (path !== "") {
          paths.add(path)
        }
      }
    }
  }

  const changed: ScannedFile[] = []
  for (const path of paths) {
    const content = await readFile(resolve(repoRoot, path), "utf8").catch(
      () => null,
    )
    if (content !== null) {
      changed.push({ path: path.split(sep).join("/"), content })
    }
  }
  return changed
}

/**
 * Every path of the repository.
 *
 * @remarks
 * The tracked files **and** the untracked ones. A file that is not
 * committed yet is part of the change, and a rule that cannot see it would
 * not be checking the change.
 */
export async function repoFiles(repoRoot: string): Promise<string[]> {
  const result = await run(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard"],
    { cwd: repoRoot },
  ).catch(() => ({
    stdout: "",
  }))
  return result.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "")
}
