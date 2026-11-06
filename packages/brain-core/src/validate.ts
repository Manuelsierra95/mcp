import {
  CONCEPT_TYPES,
  OKF_STATUSES,
  SEVERITIES,
  type Concept,
  type Finding,
} from "./types.ts"
import { RESERVED_FILENAMES, TYPE_FOLDERS } from "./bundle.ts"

/**
 * Patterns that look like a credential that leaked into the bundle.
 *
 * @remarks
 * The list is deliberately narrow. A false positive in a linter is worse
 * than a miss: it trains people to ignore the output.
 */
const SECRET_PATTERNS: ReadonlyArray<{ code: string; pattern: RegExp }> = [
  { code: "secret/github-token", pattern: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/ },
  { code: "secret/github-pat", pattern: /\bgithub_pat_[A-Za-z0-9_]{20,}\b/ },
  { code: "secret/openai-key", pattern: /\bsk-[A-Za-z0-9]{20,}\b/ },
  { code: "secret/aws-key", pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  { code: "secret/private-key", pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { code: "secret/slack-token", pattern: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/ },
  {
    code: "secret/assigned-credential",
    pattern:
      /\b(?:api[_-]?key|secret|password|passwd|access[_-]?token)\s*[:=]\s*["'][^"'\s]{8,}["']/i,
  },
]

/**
 * Markdown links that point at another concept.
 */
const LINK_PATTERN = /\]\(([^)]+)\)/g

/**
 * Checks one concept.
 *
 * @remarks
 * The findings are ordered by severity, so the first one is the one that
 * matters.
 */
export function validateConcept(concept: Concept): Finding[] {
  const findings: Finding[] = []
  const { frontmatter, body, path } = concept

  if (concept.parseError !== undefined) {
    findings.push({
      severity: "blocker",
      code: "okf/unparseable",
      path,
      message: concept.parseError,
    })
  }

  const type = frontmatter.type
  if (typeof type !== "string" || type.trim() === "") {
    findings.push({
      severity: "blocker",
      code: "okf/missing-type",
      path,
      message:
        "The concept has no `type`. OKF requires it, and without it the bundle cannot be indexed.",
    })
  } else if (!(CONCEPT_TYPES as readonly string[]).includes(type)) {
    findings.push({
      severity: "minor",
      code: "okf/unknown-type",
      path,
      message: `Unknown concept type "${type}". Known types: ${CONCEPT_TYPES.join(", ")}.`,
    })
  }

  if (typeof frontmatter.title !== "string" || frontmatter.title.trim() === "") {
    findings.push({
      severity: "minor",
      code: "okf/missing-title",
      path,
      message: "The concept has no `title`.",
    })
  }

  if (
    typeof frontmatter.description !== "string" ||
    frontmatter.description.trim() === ""
  ) {
    findings.push({
      severity: "major",
      code: "okf/missing-description",
      path,
      message:
        "The concept has no `description`. It is what the index and the search show, and it is what tells an agent when the concept applies.",
    })
  }

  const generated = frontmatter.generated
  if (generated === undefined) {
    findings.push({
      severity: "minor",
      code: "okf/missing-generated",
      path,
      message:
        "The concept has no `generated`. Without it nobody knows who wrote it or when.",
    })
  } else if (typeof generated.at !== "string") {
    findings.push({
      severity: "minor",
      code: "okf/missing-generated-at",
      path,
      message: "`generated` has no `at`.",
    })
  }

  const status = frontmatter.status
  if (status !== undefined && !(OKF_STATUSES as readonly string[]).includes(status)) {
    findings.push({
      severity: "major",
      code: "okf/invalid-status",
      path,
      message: `\`status\` must be one of ${OKF_STATUSES.join(", ")}, got "${status}".`,
    })
  }

  const expectedFolder = TYPE_FOLDERS[type]
  if (expectedFolder !== undefined) {
    const folder = path.split("/")[0]
    if (folder !== expectedFolder) {
      findings.push({
        severity: "minor",
        code: "okf/unexpected-folder",
        path,
        message: `A ${type} usually lives in "${expectedFolder}/", and this one is in "${folder}/".`,
      })
    }
  }

  if (type === "Rule") {
    findings.push(...validateRule(concept))
  }

  findings.push(...scanForSecrets(concept))
  findings.push(...checkLinks(concept))

  return findings.sort(bySeverity)
}

/**
 * Checks that a `Rule` carries everything the engine needs.
 */
function validateRule(concept: Concept): Finding[] {
  const findings: Finding[] = []
  const { frontmatter, path } = concept

  if (frontmatter.severity === undefined) {
    findings.push({
      severity: "major",
      code: "rule/missing-severity",
      path,
      message:
        "A Rule needs a `severity`: without it the engine does not know whether it blocks.",
    })
  } else if (!(SEVERITIES as readonly string[]).includes(frontmatter.severity)) {
    findings.push({
      severity: "major",
      code: "rule/invalid-severity",
      path,
      message: `\`severity\` must be one of ${SEVERITIES.join(", ")}, got "${frontmatter.severity}".`,
    })
  }

  const appliesTo = frontmatter.applies_to
  const appliesToEmpty =
    appliesTo === undefined ||
    (typeof appliesTo === "string" && appliesTo.trim() === "") ||
    (Array.isArray(appliesTo) && appliesTo.length === 0)
  if (appliesToEmpty) {
    findings.push({
      severity: "major",
      code: "rule/missing-applies-to",
      path,
      message: "A Rule needs `applies_to`: the paths it governs.",
    })
  }

  const check = frontmatter.check
  if (check === undefined) {
    findings.push({
      severity: "major",
      code: "rule/missing-check",
      path,
      message:
        "A Rule needs a `check`. If it cannot be checked, it is a Pattern or a Convention, not a Rule.",
    })
  } else if (
    check.value === undefined ||
    (typeof check.value === "string" && check.value.trim() === "")
  ) {
    findings.push({
      severity: "major",
      code: "rule/missing-check-value",
      path,
      message: "The rule's `check` has no `value`.",
    })
  }

  return findings
}

/**
 * Looks for credentials in the body.
 */
function scanForSecrets(concept: Concept): Finding[] {
  const findings: Finding[] = []
  const haystack = `${concept.frontmatter.description ?? ""}\n${concept.body}`
  for (const { code, pattern } of SECRET_PATTERNS) {
    if (pattern.test(haystack)) {
      findings.push({
        severity: "blocker",
        code,
        path: concept.path,
        message:
          "The concept looks like it contains a credential. Remove it and rotate the secret.",
      })
    }
  }
  return findings
}

/**
 * Checks that the links to other concepts resolve.
 *
 * @remarks
 * Links to files outside the bundle, and links to URLs, are left alone: the
 * bundle does not know about the rest of the repository.
 */
function checkLinks(concept: Concept): Finding[] {
  const findings: Finding[] = []
  for (const match of concept.body.matchAll(LINK_PATTERN)) {
    const target = match[1]
    if (target === undefined) {
      continue
    }
    if (/^[a-z][a-z0-9+.-]*:\/\//iu.test(target)) {
      continue
    }
    if (!target.startsWith("/")) {
      continue
    }
    const resolved = target.replace(/^\/+/, "")
    if ((RESERVED_FILENAMES as readonly string[]).includes(resolved)) {
      continue
    }
    findings.push({
      severity: "minor",
      code: "link/unverified",
      path: concept.path,
      message: `The link to "${target}" was not checked: the bundle only resolves links to concepts it holds.`,
    })
  }
  return findings
}

/**
 * Orders findings by severity, worst first.
 */
export function bySeverity(a: Finding, b: Finding): number {
  return SEVERITIES.indexOf(a.severity) - SEVERITIES.indexOf(b.severity)
}

/**
 * Whether a finding should stop the build.
 */
export function isBlocking(finding: Finding): boolean {
  return finding.severity === "blocker" || finding.severity === "major"
}
