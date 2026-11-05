import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { search } from "./search.ts"
import type { Concept } from "./types.ts"

const concepts: Concept[] = [
  {
    path: "conventions/arquitectura.md",
    frontmatter: {
      type: "Convention",
      title: "Cómo está organizado este monorepo",
      description: "Dónde vive cada cosa y qué puede importar qué.",
      tags: ["arquitectura", "monorepo"],
      generated: { by: "humano", at: "2026-11-05T09:00:00Z" },
      status: "stable",
    },
    body: "Un paquete no importa el interior de otro paquete.",
  },
  {
    path: "conventions/estilo.md",
    frontmatter: {
      type: "Convention",
      title: "Cómo se escribe el código aquí",
      description: "TypeScript, ESLint, Prettier, nombres e imports.",
      tags: ["estilo"],
      generated: { by: "humano", at: "2026-11-05T09:00:00Z" },
      status: "stable",
    },
    body: "Prettier manda sobre el formato.",
  },
]

describe("the search", () => {
  it("finds a concept by its title", () => {
    const hits = search(concepts, "monorepo")

    assert.equal(hits.length, 1)
    assert.equal(hits[0]?.path, "conventions/arquitectura.md")
    assert.equal(hits[0]?.matchedIn, "title")
  })

  it("finds a concept by its description", () => {
    const hits = search(concepts, "imports")

    assert.equal(hits.length, 1)
    assert.equal(hits[0]?.path, "conventions/estilo.md")
    assert.equal(hits[0]?.matchedIn, "description")
  })

  it("ignores accents", () => {
    const hits = search(concepts, "codigo")

    assert.equal(hits.length, 1)
    assert.equal(hits[0]?.path, "conventions/estilo.md")
  })

  it("filters by type", () => {
    const hits = search(concepts, "código", { types: ["Rule"] })

    assert.deepEqual(hits, [])
  })

  it("returns nothing when there is no match", () => {
    assert.deepEqual(search(concepts, "kubernetes"), [])
  })
})
