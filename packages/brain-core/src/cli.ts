import { execFile } from "node:child_process"
import { readFile } from "node:fs/promises"
import { relative, resolve, sep } from "node:path"
import { promisify } from "node:util"
import { loadConcepts, readConcept, resolveBrainRoot } from "./bundle.ts"
import { buildContext } from "./context.ts"
import { checkIndexes, writeIndexes } from "./indexer.ts"
import { evaluateRules, type RuleEvaluationInput } from "./rules.ts"
import { bySeverity, isBlocking, validateConcept } from "./validate.ts"
import { search } from "./search.ts"
import type { Finding, ScannedFile } from "./types.ts"

const run = promisify(execFile)

/**
 * The command line.
 *
 * @remarks
 * Every command reads the bundle and nothing else. The tool never writes a
 * concept: that is the MCP's job, and the hooks make sure the agent goes
 * through it.
 */
async function main(argv: string[]): Promise<number> {
  const [command = "help", ...rest] = argv
  const flags = parseFlags(rest)
  const positional = rest.filter((argument) => !argument.startsWith("--"))

  switch (command) {
    case "lint":
      return lint()
    case "index":
      return index(flags.check === true)
    case "search":
      return searchCommand(positional, flags)
    case "read":
      return read(positional)
    case "context":
      return context(positional)
    case "check":
      return check(flags)
    case "help":
    case "--help":
    case "-h":
      printHelp()
      return 0
    default:
      process.stderr.write(`Unknown command "${command}".\n\n`)
      printHelp()
      return 1
  }
}

/**
 * Parses `--flag` and `--flag value` arguments.
 */
function parseFlags(argv: string[]): Record<string, string | boolean> {
  const flags: Record<string, string | boolean> = {}
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === undefined || !argument.startsWith("--")) {
      continue
    }
    const name = argument.slice(2)
    const next = argv[index + 1]
    if (next !== undefined && !next.startsWith("--")) {
      flags[name] = next
      index += 1
    } else {
      flags[name] = true
    }
  }
  return flags
}

/**
 * Validates the bundle.
 */
async function lint(): Promise<number> {
  const root = await resolveBrainRoot()
  const concepts = await loadConcepts(root)
  const findings = concepts.flatMap((concept) => validateConcept(concept))

  printFindings(findings)

  const blocking = findings.filter(isBlocking)
  if (blocking.length === 0) {
    process.stdout.write(
      `The BRAIN is valid: ${concepts.length} concepts, no blocking findings.\n`,
    )
    return 0
  }
  process.stderr.write(
    `${blocking.length} blocking findings in the BRAIN. Fix them before continuing.\n`,
  )
  return 1
}

/**
 * Regenerates the listings, or checks that they are current.
 */
async function index(check: boolean): Promise<number> {
  const root = await resolveBrainRoot()
  const concepts = await loadConcepts(root)

  if (check) {
    const stale = await checkIndexes(root, concepts)
    if (stale.length === 0) {
      process.stdout.write("The indexes are up to date.\n")
      return 0
    }
    process.stderr.write(
      `These indexes are stale: ${stale.join(", ")}. Run \`pnpm brain index\`.\n`,
    )
    return 1
  }

  const changed = await writeIndexes(root, concepts)
  process.stdout.write(
    changed.length === 0
      ? "The indexes were already up to date.\n"
      : `Updated ${changed.length} indexes: ${changed.join(", ")}\n`,
  )
  return 0
}

/**
 * Searches the bundle.
 */
async function searchCommand(
  positional: string[],
  flags: Record<string, string | boolean>,
): Promise<number> {
  const root = await resolveBrainRoot()
  const concepts = await loadConcepts(root)
  const query = positional.join(" ").trim()

  const types = typeof flags.type === "string" ? flags.type.split(",") : undefined
  const tags = typeof flags.tag === "string" ? flags.tag.split(",") : undefined
  const limit = typeof flags.limit === "string" ? Number(flags.limit) : undefined

  const hits = search(concepts, query, {
    ...(types === undefined ? {} : { types }),
    ...(tags === undefined ? {} : { tags }),
    ...(limit === undefined ? {} : { limit }),
  })

  if (hits.length === 0) {
    process.stdout.write(`Nothing found for "${query}".\n`)
    return 0
  }

  for (const hit of hits) {
    process.stdout.write(
      `${hit.path}\n  ${hit.title}\n  ${hit.description}\n  (matched in ${hit.matchedIn})\n\n`,
    )
  }
  return 0
}

/**
 * Reads one concept.
 */
async function read(positional: string[]): Promise<number> {
  const path = positional[0]
  if (path === undefined) {
    process.stderr.write("Which concept? Try `pnpm brain read conventions/estilo.md`.\n")
    return 1
  }
  const root = await resolveBrainRoot()
  const concept = await readConcept(root, path)
  if (concept === null) {
    process.stderr.write(`There is no concept at "${path}".\n`)
    return 1
  }
  const raw = await readFile(resolve(root, path), "utf8")
  process.stdout.write(raw)
  return 0
}

/**
 * Prints the working context for a set of paths.
 */
async function context(positional: string[]): Promise<number> {
  const root = await resolveBrainRoot()
  const built = await buildContext(root, positional)
  process.stdout.write(`${JSON.stringify(built, null, 2)}\n`)
  return 0
}

/**
 * The gate: the bundle is valid, the rules hold, and the change documented
 * something.
 */
async function check(flags: Record<string, string | boolean>): Promise<number> {
  const root = await resolveBrainRoot()
  const repoRoot = resolve(root, "..")
  const concepts = await loadConcepts(root)

  const findings: Finding[] = concepts.flatMap((concept) =>
    validateConcept(concept),
  )

  const input = await collectChange(repoRoot, flags)
  findings.push(...evaluateRules(concepts, input))

  const stale = await checkIndexes(root, concepts)
  for (const path of stale) {
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
    input.changed.length > 0 &&
    !input.changed.some((file) => file.path.startsWith("docs/"))
  ) {
    findings.push({
      severity: "minor",
      code: "brain/undocumented",
      path: "docs/",
      message:
        "This change touches code and does not touch the BRAIN. Record what happened with `brain_note` or `brain_record`.",
    })
  }

  printFindings(findings)

  const blocking = findings.filter(isBlocking)
  if (blocking.length > 0) {
    process.stderr.write(
      `${blocking.length} blocking findings. The change does not pass the gate.\n`,
    )
    return 1
  }
  process.stdout.write("The change passes the gate.\n")
  return 0
}

/**
 * Gathers the files a change touched.
 */
async function collectChange(
  repoRoot: string,
  flags: Record<string, string | boolean>,
): Promise<RuleEvaluationInput> {
  const explicit = typeof flags.paths === "string" ? flags.paths.split(",") : undefined

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
      const result = await run("git", command, { cwd: repoRoot }).catch(
        () => ({ stdout: "" }),
      )
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
      changed.push({
        path: path.split(sep).join("/"),
        content,
      })
    }
  }

  const repo = await run("git", ["ls-files"], { cwd: repoRoot })
    .then((result) =>
      result.stdout
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line !== ""),
    )
    .catch(() => [] as string[])

  return { changed, repo }
}

/**
 * Prints findings, worst first.
 */
function printFindings(findings: readonly Finding[]): void {
  const ordered = [...findings].sort(bySeverity)
  for (const finding of ordered) {
    const line = `${finding.severity.padEnd(7)} ${finding.path}: ${finding.message}`
    if (finding.severity === "minor") {
      process.stdout.write(`${line}\n`)
    } else {
      process.stderr.write(`${line}\n`)
    }
  }
}

/**
 * Prints the usage.
 */
function printHelp(): void {
  process.stdout.write(`brain · the BRAIN of this repository

  brain lint             validate the bundle
  brain index [--check]  regenerate (or check) the listings
  brain search <query>   search by text, title, description or tags
                         [--type a,b] [--tag a,b] [--limit n]
  brain read <path>      read one concept
  brain context <paths>  the working context for a set of paths
  brain check [--paths]  the gate: bundle valid, rules hold, change documented
`)
}

await main(process.argv.slice(2)).then((code) => {
  process.exitCode = code
})
