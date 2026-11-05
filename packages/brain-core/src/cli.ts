import { execFile } from "node:child_process"
import { readFile } from "node:fs/promises"
import { relative, resolve, sep } from "node:path"
import { promisify } from "node:util"
import { loadConcepts, readConcept, resolveBrainRoot } from "./bundle.ts"
import { buildContext } from "./context.ts"
import { checkBundle } from "./check.ts"
import { checkIndexes, writeIndexes } from "./indexer.ts"
import { bySeverity, isBlocking, validateConcept } from "./validate.ts"
import { search } from "./search.ts"
import type { Finding } from "./types.ts"

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
  const paths =
    typeof flags.paths === "string" ? flags.paths.split(",").map((p) => p.trim()) : undefined

  const result = await checkBundle({ root, ...(paths === undefined ? {} : { paths }) })

  printFindings(result.findings)

  if (!result.passes) {
    const blocking = result.findings.filter(isBlocking)
    process.stderr.write(
      `${blocking.length} blocking findings. The change does not pass the gate.\n`,
    )
    return 1
  }
  process.stdout.write("The change passes the gate.\n")
  return 0
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
