import picomatch from "picomatch"
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
 * Evaluates every rule against a change.
 *
 * @remarks
 * A rule only applies when the change touches something under its
 * `applies_to`. A rule that does not apply is not reported: the report is
 * about this change, not about the repository.
 */
export function evaluateRules(
  concepts: readonly Concept[],
  input: RuleEvaluationInput,
): Finding[] {
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

    const scope = input.changed.filter((file) =>
      matchesGlob(file.path, appliesTo),
    )
    if (scope.length === 0) {
      continue
    }

    const violation = evaluateCheck(concept, check, scope, input.repo)
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
function evaluateCheck(
  concept: Concept,
  check: NonNullable<Concept["frontmatter"]["check"]>,
  scope: readonly ScannedFile[],
  repo: readonly string[],
): string | null {
  switch (check.kind) {
    case "forbidden-path": {
      const hit = scope.find((file) => matchesGlob(file.path, check.value))
      return hit === undefined
        ? null
        : `The rule "${concept.frontmatter.title ?? concept.path}" forbids "${check.value}", and the change touches "${hit.path}".`
    }
    case "required-path": {
      const exists = repo.some((path) => matchesGlob(path, check.value))
      return exists
        ? null
        : `The rule "${concept.frontmatter.title ?? concept.path}" requires "${check.value}", and it does not exist.`
    }
    case "forbidden-import": {
      for (const file of scope) {
        if (extractImports(file.content).some((specifier) => matchesImport(specifier, check.value))) {
          return `The rule "${concept.frontmatter.title ?? concept.path}" forbids importing "${check.value}", and "${file.path}" does.`
        }
      }
      return null
    }
    case "required-import": {
      for (const file of scope) {
        if (extractImports(file.content).some((specifier) => matchesImport(specifier, check.value))) {
          return null
        }
      }
      return `The rule "${concept.frontmatter.title ?? concept.path}" requires importing "${check.value}", and no file in scope does.`
    }
    case "forbidden-text": {
      for (const file of scope) {
        if (matchesText(file.content, check.value)) {
          return `The rule "${concept.frontmatter.title ?? concept.path}" forbids "${check.value}", and "${file.path}" contains it.`
        }
      }
      return null
    }
    case "required-text": {
      for (const file of scope) {
        if (matchesText(file.content, check.value)) {
          return null
        }
      }
      return `The rule "${concept.frontmatter.title ?? concept.path}" requires "${check.value}", and no file in scope has it.`
    }
    default:
      return null
  }
}
