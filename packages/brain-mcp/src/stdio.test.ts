import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

/**
 * The server, over stdio, the way a client launches it.
 *
 * @remarks
 * The in-memory test proves the protocol. This one proves the launch: the
 * command, the working directory, and the environment a client uses. If the
 * server cannot find the bundle from here, it cannot find it from an IDE.
 */
const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(here, "..", "..", "..")

describe("the MCP server over stdio", () => {
  it("starts, finds the bundle and answers", async () => {
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [join(repoRoot, "packages", "brain-mcp", "src", "index.ts")],
      cwd: repoRoot,
    })

    const client = new Client({ name: "test", version: "1.0.0" })
    await client.connect(transport)

    try {
      const { tools } = await client.listTools()
      assert.equal(tools.length, 6)

      const result = await client.callTool({
        name: "brain_context",
        arguments: { paths: ["apps/web/app/page.tsx"] },
      })
      const payload = JSON.parse(
        (result.content as Array<{ text: string }>)[0]?.text ?? "{}",
      )
      assert.ok(payload.conventions.length > 0)
      assert.ok(payload.rules.length > 0)
    } finally {
      await client.close()
    }
  })
})
