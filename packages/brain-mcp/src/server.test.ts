import assert from "node:assert/strict"
import { describe, it, before, after } from "node:test"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js"
import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { buildServer } from "./server.ts"

/**
 * The MCP server, driven by a real client.
 *
 * @remarks
 * The client and the server talk over a linked pair of in-memory transports,
 * so these tests exercise the real protocol: the tool names, the schemas,
 * the answers and the errors.
 *
 * The bundle lives in a temporary folder, so the tests do not touch the
 * repository's own BRAIN.
 */
describe("the MCP server", () => {
  let root: string
  let client: Client
  let transport: InMemoryTransport

  before(async () => {
    root = await mkdtemp(join(tmpdir(), "brain-mcp-"))
    await mkdir(join(root, "docs", "conventions"), { recursive: true })
    await writeFile(
      join(root, "docs", "conventions", "estilo.md"),
      [
        "---",
        "type: Convention",
        "title: Cómo se escribe el código",
        "description: TypeScript estricto y sin punto y coma.",
        "tags: [estilo]",
        'generated: { by: "humano", at: "2026-11-05T09:00:00Z" }',
        "status: stable",
        "---",
        "",
        "# Estilo",
        "",
        "Sin punto y coma.",
        "",
      ].join("\n"),
    )
    await mkdir(join(root, "docs", "rules"), { recursive: true })
    await writeFile(
      join(root, "docs", "rules", "0001-sin-imports-profundos.md"),
      [
        "---",
        "type: Rule",
        "title: Sin imports profundos",
        "description: Ningún fichero importa el interior de un paquete.",
        "tags: [imports]",
        'generated: { by: "humano", at: "2026-11-05T09:00:00Z" }',
        "status: stable",
        "severity: major",
        'applies_to: "**/*.{ts,tsx}"',
        "check:",
        "  kind: forbidden-import",
        '  value: "@workspace/ui/src/"',
        "  message: Importa por la API pública.",
        "---",
        "",
      ].join("\n"),
    )

    // El bundle es la carpeta `docs` de dentro del temporal.
    process.env.BRAIN_ROOT = join(root, "docs")

    const server = buildServer()
    const clientTransport = InMemoryTransport.createLinkedPair()
    transport = clientTransport[0]
    client = new Client({ name: "test", version: "1.0.0" })
    await Promise.all([
      server.connect(clientTransport[1]),
      client.connect(transport),
    ])
  })

  after(async () => {
    await client.close()
    await rm(root, { recursive: true, force: true })
    delete process.env.BRAIN_ROOT
  })

  it("offers the six tools", async () => {
    const { tools } = await client.listTools()
    const names = tools.map((tool) => tool.name).sort()

    assert.deepEqual(names, [
      "brain_check",
      "brain_context",
      "brain_note",
      "brain_onboarding",
      "brain_read",
      "brain_record",
      "brain_search",
    ])
  })

  it("gives the context of a task in one call", async () => {
    const result = await client.callTool({
      name: "brain_context",
      arguments: { paths: ["apps/web/app/page.tsx"] },
    })

    const payload = JSON.parse(
      (result.content as Array<{ text: string }>)[0]?.text ?? "{}",
    )
    assert.ok(Array.isArray(payload.conventions))
    assert.ok(payload.conventions.length > 0)
    assert.ok(Array.isArray(payload.rules))
  })

  it("finds a concept by its title", async () => {
    const result = await client.callTool({
      name: "brain_search",
      arguments: { query: "estilo" },
    })

    const hits = JSON.parse(
      (result.content as Array<{ text: string }>)[0]?.text ?? "[]",
    )
    assert.equal(hits.length, 1)
    assert.equal(hits[0]?.path, "conventions/estilo.md")
  })

  it("reads a concept", async () => {
    const result = await client.callTool({
      name: "brain_read",
      arguments: { path: "conventions/estilo.md" },
    })

    const text = (result.content as Array<{ text: string }>)[0]?.text ?? ""
    assert.match(text, /Sin punto y coma/)
  })

  it("says so when a concept does not exist", async () => {
    const result = await client.callTool({
      name: "brain_read",
      arguments: { path: "conventions/inexistente.md" },
    })

    assert.equal(result.isError, true)
  })

  it("writes a note and regenerates the index", async () => {
    const result = await client.callTool({
      name: "brain_note",
      arguments: {
        kind: "progress",
        title: "El MCP arrancó",
        body: "El servidor responde.",
      },
    })

    assert.notEqual(result.isError, true)

    const search = await client.callTool({
      name: "brain_search",
      arguments: { query: "MCP arrancó" },
    })
    const hits = JSON.parse(
      (search.content as Array<{ text: string }>)[0]?.text ?? "[]",
    )
    assert.equal(hits.length, 1)
  })

  it("offers the concepts as resources", async () => {
    const { resources } = await client.listResources()

    assert.ok(resources.some((resource) => resource.uri === "brain://index"))
  })
})
