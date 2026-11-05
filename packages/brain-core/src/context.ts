import { loadConcepts, readConcept, TYPE_FOLDERS } from "./bundle.ts"
import { search, type SearchOptions } from "./search.ts"
import { matchesGlob } from "./rules.ts"
import type { Concept } from "./types.ts"

/**
 * The working context for one task.
 *
 * @remarks
 * This is the payload of `brain_context`, the call that has to replace
 * reading six files: the conventions and patterns that apply to the paths
 * being touched, the rules that govern them, the decisions in force, the
 * last progress notes, and the open items.
 */
export interface TaskContext {
  /** The paths the context was built for. */
  readonly paths: readonly string[]
  /** The conventions that apply to those paths. */
  readonly conventions: readonly ContextConcept[]
  /** The patterns that apply to those paths. */
  readonly patterns: readonly ContextConcept[]
  /** The rules that apply to those paths. */
  readonly rules: readonly ContextConcept[]
  /** The decisions in force. */
  readonly decisions: readonly ContextConcept[]
  /** The most recent progress notes. */
  readonly progress: readonly ContextConcept[]
  /** The lessons that could bite in this change. */
  readonly lessons: readonly ContextConcept[]
}

/**
 * A concept, as it appears in the context.
 */
export interface ContextConcept {
  readonly path: string
  readonly title: string
  readonly description: string
  readonly type: string
  readonly tags: readonly string[]
  /** Only for rules: what the rule demands. */
  readonly check?: string
  /** Only for rules: how serious it is. */
  readonly severity?: string
}

/**
 * Builds the working context.
 *
 * @remarks
 * The selection is by path: a convention that governs `apps/web/**` shows up
 * when the change touches `apps/web/**`, and stays out of the way when it
 * does not. The decisions and the recent progress always come along: they
 * are short and they change how the work is done.
 */
export async function buildContext(
  root: string,
  paths: readonly string[],
  options: { readonly progressLimit?: number } = {},
): Promise<TaskContext> {
  const concepts = await loadConcepts(root)
  const applies = (concept: Concept): boolean => {
    const appliesTo = concept.frontmatter.applies_to
    if (appliesTo === undefined) {
      return false
    }
    return paths.some((path) => matchesScope(path, appliesTo))
  }

  const byType = (type: string): Concept[] =>
    concepts.filter((concept) => concept.frontmatter.type === type)

  const scoped = (type: string): Concept[] =>
    byType(type).filter((concept) => applies(concept) || concept.frontmatter.applies_to === undefined)

  const decisions = byType("Decision")
    .filter((concept) => concept.frontmatter.status !== "deprecated")
    .sort((a, b) => a.path.localeCompare(b.path))

  const progressLimit = options.progressLimit ?? 5
  const progress = byType("Progress")
    .sort((a, b) => b.path.localeCompare(a.path))
    .slice(0, progressLimit)

  return {
    paths,
    conventions: scoped("Convention").map(toContextConcept),
    patterns: scoped("Pattern").map(toContextConcept),
    rules: byType("Rule").filter(applies).map(toContextConcept),
    decisions: decisions.map(toContextConcept),
    progress: progress.map(toContextConcept),
    lessons: byType("Lesson").map(toContextConcept),
  }
}

/**
 * Whether a path falls under a scope glob.
 */
function matchesScope(path: string, scope: string): boolean {
  return matchesGlob(path, scope)
}

/**
 * Converts a concept into its context form.
 */
function toContextConcept(concept: Concept): ContextConcept {
  const check = concept.frontmatter.check
  return {
    path: concept.path,
    title: concept.frontmatter.title ?? concept.path,
    description: concept.frontmatter.description ?? "",
    type: concept.frontmatter.type,
    tags: concept.frontmatter.tags ?? [],
    ...(check === undefined
      ? {}
      : { check: `${check.kind}: ${check.value}` }),
    ...(concept.frontmatter.severity === undefined
      ? {}
      : { severity: concept.frontmatter.severity }),
  }
}

/**
 * The folders a concept type belongs to, for the CLI's `new` command.
 */
export function foldersByType(): Record<string, string> {
  return { ...TYPE_FOLDERS }
}

/**
 * Reads one concept for the CLI.
 */
export async function conceptAt(
  root: string,
  path: string,
): Promise<Concept | null> {
  return readConcept(root, path)
}

/**
 * Searches with the CLI's options.
 */
export function searchBundle(
  concepts: readonly Concept[],
  query: string,
  options: SearchOptions,
) {
  return search(concepts, query, options)
}
