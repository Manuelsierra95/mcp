import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { evaluateRules, extractImports, matchesGlob } from "./rules.ts"
import type { Concept } from "./types.ts"

function rule(
  path: string,
  appliesTo: string,
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

  it("reports a forbidden import", () => {
    const findings = evaluateRules(
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

  it("says nothing when the rule does not apply to the change", () => {
    const findings = evaluateRules(
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

  it("reports a required path that does not exist", () => {
    const findings = evaluateRules(
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

  it("reports forbidden text", () => {
    const findings = evaluateRules(
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

  it("reports a required text that is missing", () => {
    const findings = evaluateRules(
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
