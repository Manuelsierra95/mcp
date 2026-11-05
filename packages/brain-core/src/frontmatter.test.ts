import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { parseDocument, serializeDocument } from "./frontmatter.ts"

describe("the frontmatter", () => {
  it("splits a document into its frontmatter and its body", () => {
    const document = parseDocument(
      ["---", "type: Rule", "title: Una regla", "---", "", "# El cuerpo", ""].join(
        "\n",
      ),
    )

    assert.equal(document.error, undefined)
    assert.equal(document.frontmatter.type, "Rule")
    assert.equal(document.frontmatter.title, "Una regla")
    assert.match(document.body, /# El cuerpo/)
  })

  it("treats a document without frontmatter as a body", () => {
    const document = parseDocument("# Solo cuerpo\n")

    assert.equal(document.error, undefined)
    assert.deepEqual(document.frontmatter, {})
    assert.equal(document.body, "# Solo cuerpo\n")
  })

  it("says so when the frontmatter is never closed", () => {
    const document = parseDocument("---\ntype: Rule\ntitle: Sin cerrar\n")

    assert.match(document.error ?? "", /never closed/)
  })

  it("reads a colon inside a quoted description", () => {
    const document = parseDocument(
      [
        "---",
        'description: "Uno: dos."',
        "type: Pattern",
        "---",
        "",
      ].join("\n"),
    )

    assert.equal(document.error, undefined)
    assert.equal(document.frontmatter.description, "Uno: dos.")
  })

  it("says how to fix a colon inside an unquoted description", () => {
    const document = parseDocument(
      ["---", "description: Uno: dos.", "type: Pattern", "---", ""].join("\n"),
    )

    assert.match(document.error ?? "", /has to be quoted/)
  })

  it("round-trips a document", () => {
    const frontmatter = { type: "Convention", title: "Una convención" }
    const body = "# Cuerpo\n\nTexto."

    const document = parseDocument(serializeDocument(frontmatter, body))

    assert.equal(document.frontmatter.type, "Convention")
    assert.equal(document.frontmatter.title, "Una convención")
    assert.match(document.body, /Texto\./)
  })
})
