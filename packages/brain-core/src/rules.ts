import picomatch from "picomatch"
import { parseDocument } from "./frontmatter.ts"
import { bySeverity } from "./validate.ts"
import type { Concept, Finding, ScannedFile } from "./types.ts"

/**
 * What the engine needs to evaluate the rules against a change.
 */
export interface RuleEvaluationInput {
  /** The files the change touched, with their content. */
  readonly changed: readonly ScannedFile[]
  /** Every path in the repository, for checks about existence. */
  readonly repo: readonly string[]
  /**
   * Reads any file of the repository.
   *
   * @remarks
   * Some checks compare two places at once, and the other side may not be
   * among the changed files.
   */
  readonly read?: (path: string) => Promise<string | null>
}

/**
 * The specifiers a file imports.
 *
 * @remarks
 * Covers the three shapes that matter in this repository: a named import,
 * a side-effect import, and a dynamic import. CommonJS `require` is here
 * too, because it still shows up in configs.
 */
const IMPORT_PATTERN =
  /(?:^|\n)\s*(?:import|export)\s+(?:[^'"]*?\sfrom\s*)?["']([^"']+)["']|(?:^|\n)\s*(?:const|let|var)\s+[^=\n]*=\s*require\(\s*["']([^"']+)["']\s*\)|import\(\s*["']([^"']+)["']\s*\)/g

/**
 * The specifiers a file imports.
 */
export function extractImports(content: string): string[] {
  const imports: string[] = []
  for (const match of content.matchAll(IMPORT_PATTERN)) {
    const specifier = match[1] ?? match[2] ?? match[3]
    if (specifier !== undefined) {
      imports.push(specifier)
    }
  }
  return imports
}

/**
 * Whether a path is one of the reserved, generated files.
 *
 * @remarks
 * `index.md` and `log.md` are written by the tool, not by a person. A rule
 * that governs a folder has nothing to say about the listing of that
 * folder.
 */
export function isReserved(path: string): boolean {
  const name = path.split("/").pop() ?? path
  return name === "index.md" || name === "log.md"
}

/**
 * The globs a rule governs.
 */
export function scopesOf(appliesTo: string | readonly string[]): string[] {
  return typeof appliesTo === "string" ? [appliesTo] : [...appliesTo]
}

/**
 * Whether a path matches a glob.
 *
 * @remarks
 * The globs are written the way people write them: `apps/web/**` matches
 * everything under the folder, `**\/auth/**` matches an `auth` folder at any
 * depth.
 */
export function matchesGlob(path: string, glob: string): boolean {
  return picomatch(glob, { dot: true })(path)
}

/**
 * Whether an import matches the value of a rule.
 *
 * @remarks
 * A value ending in "/" is a prefix: `@workspace/ui/src/` matches every
 * import that reaches inside the package. Any other value is a package: it
 * matches itself and its subpaths, but not a package that merely starts with
 * the same letters.
 */
export function matchesImport(specifier: string, value: string): boolean {
  if (value.endsWith("/")) {
    return specifier.startsWith(value)
  }
  return specifier === value || specifier.startsWith(`${value}/`)
}

/**
 * Whether a file's text matches a pattern.
 *
 * @remarks
 * The pattern is a regular expression. When it does not compile, it is
 * matched as literal text: a rule with a broken pattern should report a
 * finding, not crash the run.
 */
export function matchesText(content: string, pattern: string): boolean {
  try {
    return new RegExp(pattern).test(content)
  } catch {
    return content.includes(pattern)
  }
}

/**
 * The two sides of a cross-reference, and what has to match.
 */
export interface LinkageSpec {
  /** Where the things that must be linked live. */
  readonly left: string
  /** Where their counterpart has to appear. */
  readonly right: string
  /** What is being linked: the acceptance criteria, or the glossary terms. */
  readonly subject: "ac" | "term"
  /**
   * Which direction has to hold.
   *
   * - `left-to-right`: everything on the left appears on the right.
   * - `right-to-left`: everything on the right appears on the left.
   * - `both`: the two, and neither side has anything the other lacks.
   */
  readonly mode: "left-to-right" | "right-to-left" | "both"
}

/**
 * Evaluates every rule against a change.
 *
 * @remarks
 * A rule only applies when the change touches something under its
 * `applies_to`. A rule that does not apply is not reported: the report is
 * about this change, not about the repository.
 */
export async function evaluateRules(
  concepts: readonly Concept[],
  input: RuleEvaluationInput,
): Promise<Finding[]> {
  const findings: Finding[] = []

  for (const concept of concepts) {
    if (concept.frontmatter.type !== "Rule") {
      continue
    }

    const appliesTo = concept.frontmatter.applies_to
    const check = concept.frontmatter.check
    const severity = concept.frontmatter.severity ?? "major"

    if (appliesTo === undefined || check === undefined) {
      // The linter reports the missing pieces; the engine stays quiet.
      continue
    }

    const scope = input.changed.filter(
      (file) =>
        !isReserved(file.path) &&
        scopesOf(appliesTo).some((glob) => matchesGlob(file.path, glob)),
    )
    if (scope.length === 0) {
      continue
    }

    const violation = await evaluateCheck(concept, check, scope, input)
    if (violation !== null) {
      findings.push({
        severity,
        code: `rule/${check.kind}`,
        path: concept.path,
        message: check.message ?? violation,
      })
    }
  }

  return findings.sort(bySeverity)
}

/**
 * Evaluates one check.
 *
 * @returns The message of the violation, or null when the check passes.
 */
async function evaluateCheck(
  concept: Concept,
  check: NonNullable<Concept["frontmatter"]["check"]>,
  scope: readonly ScannedFile[],
  input: RuleEvaluationInput,
): Promise<string | null> {
  if (check.kind === "linkage") {
    return await evaluateLinkage(concept, check, input)
  }

  const value = check.value
  if (typeof value !== "string") {
    // Only the linkage check uses a structured value.
    return null
  }

  switch (check.kind) {
    case "forbidden-path": {
      const hit = scope.find((file) => matchesGlob(file.path, value))
      return hit === undefined
        ? null
        : `The rule "${concept.frontmatter.title ?? concept.path}" forbids "${value}", and the change touches "${hit.path}".`
    }
    case "required-path": {
      const exists = input.repo.some((path) => matchesGlob(path, value))
      return exists
        ? null
        : `The rule "${concept.frontmatter.title ?? concept.path}" requires "${value}", and it does not exist.`
    }
    case "forbidden-import": {
      for (const file of scope) {
        if (
          extractImports(file.content).some((specifier) =>
            matchesImport(specifier, value),
          )
        ) {
          return `The rule "${concept.frontmatter.title ?? concept.path}" forbids importing "${value}", and "${file.path}" does.`
        }
      }
      return null
    }
    case "required-import": {
      for (const file of scope) {
        if (
          extractImports(file.content).some((specifier) =>
            matchesImport(specifier, value),
          )
        ) {
          return null
        }
      }
      return `The rule "${concept.frontmatter.title ?? concept.path}" requires importing "${value}", and no file in scope does.`
    }
    case "forbidden-text": {
      for (const file of scope) {
        if (matchesText(file.content, value)) {
          return `The rule "${concept.frontmatter.title ?? concept.path}" forbids "${value}", and "${file.path}" contains it.`
        }
      }
      return null
    }
    case "required-text": {
      for (const file of scope) {
        if (matchesText(file.content, value)) {
          return null
        }
      }
      return `The rule "${concept.frontmatter.title ?? concept.path}" requires "${value}", and no file in scope has it.`
    }
    default:
      return null
  }
}

/**
 * Evaluates a cross-reference.
 *
 * @remarks
 * "Every scenario has a test" cannot be checked inside one file: it needs
 * the features and the tests at the same time. That is what this check is
 * for, and it is the one thing the plain checks cannot express.
 */
async function evaluateLinkage(
  concept: Concept,
  check: NonNullable<Concept["frontmatter"]["check"]>,
  input: RuleEvaluationInput,
): Promise<string | null> {
  if (typeof check.value === "string") {
    return null
  }
  const spec = check.value as LinkageSpec
  const read = input.read
  if (read === undefined) {
    // Without a way to read the repository, the rule cannot be evaluated.
    // Saying nothing is better than saying it passes.
    return null
  }

  const leftPaths = input.repo.filter((path) =>
    matchesGlob(path, spec.left),
  )
  // The left side does not count as a use of itself: a term is not "used"
  // by its own definition.
  const rightPaths = input.repo.filter(
    (path) =>
      matchesGlob(path, spec.right) && !matchesGlob(path, spec.left),
  )

  const title = concept.frontmatter.title ?? concept.path

  // What each side holds depends on what is being linked.
  const left = await collectSubjects(leftPaths, spec.subject, read)
  const right =
    spec.subject === "ac"
      ? await collectSubjects(rightPaths, spec.subject, read)
      : await findSubjects(leftPaths, rightPaths, spec.subject, read)

  const missingInRight = [...left.keys()].filter((key) => !right.has(key))
  const missingInLeft = [...right.keys()].filter((key) => !left.has(key))

  if (spec.mode === "left-to-right" || spec.mode === "both") {
    if (missingInRight.length > 0) {
      return `The rule "${title}" requires ${missingInRight.join(", ")} to appear in ${spec.right}, and they do not.`
    }
  }
  if (spec.mode === "right-to-left" || spec.mode === "both") {
    if (missingInLeft.length > 0) {
      return `The rule "${title}" forbids ${missingInLeft.join(", ")} in ${spec.right}: they do not appear in ${spec.left}.`
    }
  }
  return null
}

/**
 * Which of the subjects on the left appear on the right.
 *
 * @remarks
 * A glossary term is not extracted from the code: it is looked for. "The
 * term `pedido` appears somewhere" is a search, not a title.
 */
async function findSubjects(
  leftPaths: readonly string[],
  rightPaths: readonly string[],
  subject: "ac" | "term",
  read: (path: string) => Promise<string | null>,
): Promise<Map<string, string>> {
  if (subject === "ac") {
    return new Map()
  }

  const terms = await collectSubjects(leftPaths, subject, read)
  const found = new Map<string, string>()
  for (const path of rightPaths) {
    const content = await read(path)
    if (content === null) {
      continue
    }
    for (const term of terms.keys()) {
      if (!found.has(term) && mentions(content, term)) {
        found.set(term, path)
      }
    }
  }
  return found
}

/**
 * Whether a text mentions a term, as a whole word.
 */
function mentions(content: string, term: string): boolean {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return new RegExp(`\\b${escaped}\\b`, "iu").test(content)
}

/**
 * The subjects of a side of a cross-reference.
 *
 * @remarks
 * The acceptance criteria are the `AC-n` ids that appear in the text. The
 * glossary terms are the titles of the concepts, because a term is a
 * concept with a name.
 */
async function collectSubjects(
  paths: readonly string[],
  subject: "ac" | "term",
  read: (path: string) => Promise<string | null>,
): Promise<Map<string, string>> {
  const found = new Map<string, string>()
  for (const path of paths) {
    const content = await read(path)
    if (content === null) {
      continue
    }
    if (subject === "ac") {
      for (const match of content.matchAll(/\bAC-\d+\b/g)) {
        if (!found.has(match[0])) {
          found.set(match[0], path)
        }
      }
    } else {
      const title = parseDocument(content).frontmatter.title
      if (typeof title === "string" && title.trim() !== "") {
        found.set(title.trim().toLowerCase(), path)
      }
    }
  }
  return found
}
