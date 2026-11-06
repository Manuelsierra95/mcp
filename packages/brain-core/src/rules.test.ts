import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { evaluateRules, extractImports, matchesGlob } from "./rules.ts"
import type { Concept } from "./types.ts"

function rule(
  path: string,
  appliesTo: string | string[],
  check: Concept["frontmatter"]["check"],
  severity: "blocker" | "major" | "minor" = "major",
): Concept {
  return {
    path,
    frontmatter: {
      type: "Rule",
      title: "Una regla",
      description: "Una regla comprobable.",
      generated: { by: "humano", at: "2026-11-05T09:00:00Z" },
      status: "stable",
      severity,
      applies_to: appliesTo,
      ...(check === undefined ? {} : { check }),
    },
    body: "",
  }
}

describe("the rule engine", () => {
  it("finds the imports of a file", () => {
    const imports = extractImports(
      [
        'import { Button } from "@workspace/ui/components/button"',
        'import "@workspace/ui/globals.css"',
        'const z = require("zod")',
        'const lazy = await import("./lazy.ts")',
      ].join("\n"),
    )

    assert.ok(imports.includes("@workspace/ui/components/button"))
    assert.ok(imports.includes("@workspace/ui/globals.css"))
    assert.ok(imports.includes("zod"))
    assert.ok(imports.includes("./lazy.ts"))
  })

  it("matches paths the way people write them", () => {
    assert.ok(matchesGlob("apps/web/app/page.tsx", "apps/web/**"))
    assert.ok(matchesGlob("packages/ui/src/auth/login.ts", "**/auth/**"))
    assert.ok(!matchesGlob("apps/web/app/page.tsx", "packages/**"))
  })

  it("reports a forbidden import", async () => {
    const findings = await evaluateRules(
      [
        rule("rules/0001.md", "**/*.{ts,tsx}", {
          kind: "forbidden-import",
          value: "@workspace/ui/src/",
          message: "Importa por la API pública.",
        }),
      ],
      {
        changed: [
          {
            path: "apps/web/app/page.tsx",
            content: 'import { Button } from "@workspace/ui/src/components/button"',
          },
        ],
        repo: ["apps/web/app/page.tsx"],
      },
    )

    assert.equal(findings.length, 1)
    assert.equal(findings[0]?.code, "rule/forbidden-import")
    assert.equal(findings[0]?.severity, "major")
  })

  it("says nothing when the rule does not apply to the change", async () => {
    const findings = await evaluateRules(
      [
        rule("rules/0001.md", "packages/tests/**", {
          kind: "forbidden-import",
          value: "@workspace/ui/src/",
        }),
      ],
      {
        changed: [
          { path: "apps/web/app/page.tsx", content: "export {}\n" },
        ],
        repo: ["apps/web/app/page.tsx"],
      },
    )

    assert.deepEqual(findings, [])
  })

  it("reports a required path that does not exist", async () => {
    const findings = await evaluateRules(
      [
        rule("rules/0002.md", "apps/web/**", {
          kind: "required-path",
          value: "apps/web/app/layout.tsx",
        }),
      ],
      {
        changed: [{ path: "apps/web/app/page.tsx", content: "export {}\n" }],
        repo: ["apps/web/app/page.tsx"],
      },
    )

    assert.equal(findings.length, 1)
    assert.equal(findings[0]?.code, "rule/required-path")
  })

  it("reports forbidden text", async () => {
    const findings = await evaluateRules(
      [
        rule("rules/0003.md", "apps/web/**", {
          kind: "forbidden-text",
          value: "console\\.log\\(",
          message: "Quita el console.log.",
        }, "minor"),
      ],
      {
        changed: [
          { path: "apps/web/app/page.tsx", content: 'console.log("hola")\n' },
        ],
        repo: ["apps/web/app/page.tsx"],
      },
    )

    assert.equal(findings.length, 1)
    assert.equal(findings[0]?.severity, "minor")
  })

  it("reports a required text that is missing", async () => {
    const findings = await evaluateRules(
      [
        rule("rules/0004.md", "packages/tests/**/*.spec.ts", {
          kind: "required-text",
          value: 'test\\("AC-[0-9]+ · ',
        }),
      ],
      {
        changed: [
          {
            path: "packages/tests/e2e/smoke.spec.ts",
            content: 'test("la home va", async () => {})\n',
          },
        ],
        repo: ["packages/tests/e2e/smoke.spec.ts"],
      },
    )

    assert.equal(findings.length, 1)
    assert.equal(findings[0]?.code, "rule/required-text")
  })
})

describe("the cross-reference check", () => {
  const files: Record<string, string> = {
    "docs/features/export.md":
      "---\ntype: Feature\n---\n\n## Slices\n\n### AC-1 · exporta\n\nGiven un pedido\n",
    "packages/tests/e2e/export.spec.ts":
      'test("AC-1 · exporta el pedido", async () => {})\n',
  }

  const read = async (path: string): Promise<string | null> => files[path] ?? null
  const repo = () => Object.keys(files)

  it("says nothing when every scenario has a test", async () => {
    const findings = await evaluateRules(
      [
        rule("rules/0005.md", "docs/features/**", {
          kind: "linkage",
          value: {
            left: "docs/features/**/*.md",
            right: "packages/tests/**/*.spec.ts",
            subject: "ac",
            mode: "left-to-right",
          },
        }),
      ],
      {
        changed: [
          {
            path: "docs/features/export.md",
            content: files["docs/features/export.md"] as string,
          },
        ],
        repo: repo(),
        read,
      },
    )

    assert.equal(findings.length, 0)
  })

  it("complains when a scenario has no test", async () => {
    files["docs/features/export.md"] =
      "---\ntype: Feature\n---\n\n## Slices\n\n### AC-1 · exporta\n\n### AC-2 · manda por correo\n"
    const findings = await evaluateRules(
      [
        rule("rules/0005.md", "docs/features/**", {
          kind: "linkage",
          value: {
            left: "docs/features/**/*.md",
            right: "packages/tests/**/*.spec.ts",
            subject: "ac",
            mode: "left-to-right",
          },
        }),
      ],
      {
        changed: [
          {
            path: "docs/features/export.md",
            content:
              "---\ntype: Feature\n---\n\n## Slices\n\n### AC-1 · exporta\n\n### AC-2 · manda por correo\n",
          },
        ],
        repo: repo(),
        read,
      },
    )

    assert.equal(findings.length, 1)
    assert.match(findings[0]?.message ?? "", /AC-2/)
  })

  it("complains when a test has no scenario", async () => {
    files["packages/tests/e2e/export.spec.ts"] =
      'test("AC-7 · un test sin scenario", async () => {})\n'
    const findings = await evaluateRules(
      [
        rule("rules/0006.md", "packages/tests/**", {
          kind: "linkage",
          value: {
            left: "docs/features/**/*.md",
            right: "packages/tests/**/*.spec.ts",
            subject: "ac",
            mode: "right-to-left",
          },
        }),
      ],
      {
        changed: [
          {
            path: "packages/tests/e2e/export.spec.ts",
            content: 'test("AC-7 · un test sin scenario", async () => {})\n',
          },
        ],
        repo: repo(),
        read,
      },
    )

    assert.equal(findings.length, 1)
    assert.match(findings[0]?.message ?? "", /AC-7/)
  })

  it("governs several path families at once", async () => {
    const findings = await evaluateRules(
      [
        rule("rules/0007.md", ["docs/features/**", "features/**"], {
          kind: "required-text",
          value: "## Slices",
        }),
      ],
      {
        changed: [
          {
            path: "features/export.feature",
            content: "Feature: export\n",
          },
        ],
        repo: ["features/export.feature"],
      },
    )

    assert.equal(findings.length, 1)
  })
})
