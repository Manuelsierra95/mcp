import { z } from "zod"

/**
 * The concepts the BRAIN understands.
 *
 * @remarks
 * OKF only requires `type`. The list here is the vocabulary this project
 * uses: anything else is still valid OKF, but this linter does not know what
 * to do with it.
 */
export const CONCEPT_TYPES = [
  "Convention",
  "Pattern",
  "Rule",
  "Decision",
  "Lesson",
  "Progress",
  "Problem",
  "Spec",
  "Solution",
  "Feature",
  "Glossary",
] as const

export type ConceptType = (typeof CONCEPT_TYPES)[number]

/**
 * The checks a `Rule` can carry.
 *
 * @remarks
 * All of them are declarative: a rule is data that can be evaluated without
 * a model. Anything that needs judgement is prose in a `Pattern` or a
 * `Convention`, not a `Rule`.
 */
export const CHECK_KINDS = [
  "forbidden-path",
  "required-path",
  "forbidden-import",
  "required-import",
  "forbidden-text",
  "required-text",
  "linkage",
] as const

export type CheckKind = (typeof CHECK_KINDS)[number]

export const SEVERITIES = ["blocker", "major", "minor"] as const

export type Severity = (typeof SEVERITIES)[number]

/** OKF lifecycle. Not to be confused with a project's own status. */
export const OKF_STATUSES = ["draft", "stable", "deprecated"] as const

/**
 * The two sides of a cross-reference.
 *
 * @remarks
 * Some rules are about two documents at once: "every scenario has a test"
 * cannot be checked inside a single file. The `linkage` check compares what
 * is on the left with what is on the right.
 */
export const LinkageSpecSchema = z.object({
  /** Where the things that must be linked live. */
  left: z.string().min(1),
  /** Where their counterpart has to appear. */
  right: z.string().min(1),
  /** What is being linked: the acceptance criteria, or the glossary terms. */
  subject: z.enum(["ac", "term"]),
  /**
   * Which direction has to hold.
   *
   * - `left-to-right`: everything on the left appears on the right.
   * - `right-to-left`: everything on the right appears on the left.
   * - `both`: the two, and neither side has anything the other lacks.
   */
  mode: z.enum(["left-to-right", "right-to-left", "both"]),
})

export const RuleCheckSchema = z.object({
  kind: z.enum(CHECK_KINDS),
  value: z.union([z.string().min(1), LinkageSpecSchema]),
  message: z.string().optional(),
})

export type RuleCheck = z.infer<typeof RuleCheckSchema>

/**
 * The frontmatter every concept carries.
 *
 * @remarks
 * `type` is the only field OKF requires. The rest is this project's
 * vocabulary, and OKF explicitly allows extra keys.
 */
export const FrontmatterSchema = z
  .object({
    type: z.string().min(1),
    title: z.string().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    generated: z
      .object({
        by: z.string().optional(),
        at: z.string().optional(),
      })
      .passthrough()
      .optional(),
    status: z.enum(OKF_STATUSES).optional(),
    severity: z.enum(SEVERITIES).optional(),
    /** The paths the rule governs. A list, when it governs more than one. */
    applies_to: z.union([z.string(), z.array(z.string())]).optional(),
    check: RuleCheckSchema.optional(),
  })
  .passthrough()

export type Frontmatter = z.infer<typeof FrontmatterSchema>

/**
 * One concept: a file in the bundle.
 */
export interface Concept {
  /** Path relative to the bundle root, e.g. `conventions/arquitectura.md`. */
  readonly path: string
  readonly frontmatter: Frontmatter
  readonly body: string
  /** Set when the file could not be parsed at all. */
  readonly parseError?: string
}

/**
 * A problem found in the bundle or in a change.
 */
export interface Finding {
  readonly severity: Severity
  /** A stable machine code, so tooling can match on it. */
  readonly code: string
  /** Path relative to the repository root. */
  readonly path: string
  readonly message: string
}

/**
 * A file considered by the rule engine.
 */
export interface ScannedFile {
  /** Path relative to the repository root, with forward slashes. */
  readonly path: string
  readonly content: string
}
