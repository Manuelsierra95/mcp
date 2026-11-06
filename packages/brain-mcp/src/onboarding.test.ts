import assert from "node:assert/strict"
import { describe, it, before, after } from "node:test"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js"
import { mkdtemp, rm, readFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { buildServer } from "./server.ts"

describe("the onboarding", () => {
  let root: string
  let client: Client

  before(async () => {
    root = await mkdtemp(join(tmpdir(), "brain-onboarding-"))
    process.env.BRAIN_ROOT = join(root, "docs")

    const server = buildServer()
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair()
    client = new Client({ name: "test", version: "1.0.0" })
    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport),
    ])
  })

  after(async () => {
    await client.close()
    await rm(root, { recursive: true, force: true })
    delete process.env.BRAIN_ROOT
  })

  it("asks the four plain-language questions", async () => {
    const result = await client.callTool({
      name: "brain_onboarding",
      arguments: { step: "questions" },
    })
    const payload = JSON.parse(
      (result.content as Array<{ text: string }>)[0]?.text ?? "{}",
    )

    assert.equal(payload.layerA.length, 4)
    assert.equal(payload.layerA[0].id, "purpose")
    assert.equal(payload.layerA[0].question, "¿Para qué va a servir?")
    assert.ok(payload.layerA[0].options.length > 1)
    assert.equal(payload.layerA[0].options[0].value, "web o blog")
  })

  it("proposes concrete paths, without jargon", async () => {
    const result = await client.callTool({
      name: "brain_onboarding",
      arguments: {
        step: "propose",
        purpose: "web o blog",
        audience: "cualquiera",
        firstMinute: "que alguien lea un artículo",
        cadence: "casi nunca",
      },
    })
    const payload = JSON.parse(
      (result.content as Array<{ text: string }>)[0]?.text ?? "{}",
    )

    assert.ok(payload.options.length >= 2)
    assert.equal(payload.options[0].letter, "A")
    assert.equal(payload.options[0].name, "Web estática")
    // The summary is read by a person: it says "una web o un blog" and
    // "cambia poco", not the raw category names.
    assert.match(payload.summary, /una web o un blog/)
    assert.match(payload.summary, /cambia poco/)
    assert.match(payload.recommendation.reason, /Con lo que me has/)
    // The text a person reads carries the cost and the ceiling.
    assert.match(payload.text, /Coste:/)
    assert.match(payload.text, /Techo:/)
  })

  it("recommends the path that fits the answers", async () => {
    const result = await client.callTool({
      name: "brain_onboarding",
      arguments: {
        step: "propose",
        purpose: "web o blog",
        audience: "cualquiera",
        firstMinute: "que alguien lea un artículo",
        cadence: "cada semana",
      },
    })
    const payload = JSON.parse(
      (result.content as Array<{ text: string }>)[0]?.text ?? "{}",
    )

    // A blog that changes every week needs somewhere to put what people
    // write, not a CDN.
    assert.equal(payload.options[0].name, "Web con base de datos")
  })

  it("writes the conventions of the chosen path", async () => {
    const result = await client.callTool({
      name: "brain_onboarding",
      arguments: {
        step: "apply",
        purpose: "web o blog",
        audience: "cualquiera",
        firstMinute: "que alguien lea un artículo",
        cadence: "casi nunca",
        choice: "A",
      },
    })
    const payload = JSON.parse(
      (result.content as Array<{ text: string }>)[0]?.text ?? "{}",
    )

    assert.equal(payload.written.length, 5)

    const architecture = await readFile(
      join(root, "docs", payload.written[0] as string),
      "utf8",
    )
    assert.match(architecture, /Web estática/)
    assert.match(architecture, /que alguien lea un artículo/)

    const testing = await readFile(
      join(root, "docs", payload.written[2] as string),
      "utf8",
    )
    assert.match(testing, /AC-1/)
  })

  it("refuses to apply without a letter", async () => {
    const result = await client.callTool({
      name: "brain_onboarding",
      arguments: {
        step: "apply",
        purpose: "web o blog",
        audience: "cualquiera",
        firstMinute: "leer un artículo",
        cadence: "casi nunca",
      },
    })

    assert.equal(result.isError, true)
  })

  it("refuses to propose without the four answers", async () => {
    const result = await client.callTool({
      name: "brain_onboarding",
      arguments: { step: "propose", purpose: "web o blog" },
    })

    assert.equal(result.isError, true)
  })
})
