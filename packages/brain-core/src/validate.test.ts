import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { validateConcept } from "./validate.ts"
import type { Concept } from "./types.ts"

function concept(overrides: Partial<Concept> = {}): Concept {
  return {
    path: "conventions/estilo.md",
    frontmatter: {
      type: "Convention",
      title: "Estilo",
      description: "Cómo se escribe el código.",
      generated: { by: "humano", at: "2026-11-05T09:00:00Z" },
      status: "stable",
    },
    body: "# Estilo\n",
    ...overrides,
  }
}

describe("the linter", () => {
  it("accepts a well-formed concept", () => {
    const findings = validateConcept(concept())

    assert.deepEqual(findings, [])
  })

  it("blocks a concept without a type", () => {
    const findings = validateConcept(
      concept({ frontmatter: { title: "Sin tipo" } as never }),
    )

    assert.ok(
      findings.some(
        (finding) =>
          finding.code === "okf/missing-type" && finding.severity === "blocker",
      ),
    )
  })

  it("warns about a missing description", () => {
    const findings = validateConcept(
      concept({
        frontmatter: {
          type: "Convention",
          title: "Sin descripción",
          generated: { by: "humano", at: "2026-11-05T09:00:00Z" },
          status: "stable",
        },
      }),
    )

    assert.ok(
      findings.some((finding) => finding.code === "okf/missing-description"),
    )
  })

  it("warns when a concept sits in the wrong folder", () => {
    const findings = validateConcept(concept({ path: "patterns/estilo.md" }))

    assert.ok(
      findings.some((finding) => finding.code === "okf/unexpected-folder"),
    )
  })

  it("blocks a rule without a check", () => {
    const findings = validateConcept(
      concept({
        path: "rules/una-regla.md",
        frontmatter: {
          type: "Rule",
          title: "Sin check",
          description: "No se puede comprobar.",
          generated: { by: "humano", at: "2026-11-05T09:00:00Z" },
          status: "stable",
          severity: "major",
          applies_to: "**",
        },
      }),
    )

    assert.ok(
      findings.some(
        (finding) =>
          finding.code === "rule/missing-check" && finding.severity === "major",
      ),
    )
  })

  it("blocks a credential", () => {
    const findings = validateConcept(
      concept({ body: "El token es ghp_abcdefghijklmnopqrstuvwxyz012345.\n" }),
    )

    assert.ok(
      findings.some(
        (finding) =>
          finding.code === "secret/github-token" && finding.severity === "blocker",
      ),
    )
  })
})
