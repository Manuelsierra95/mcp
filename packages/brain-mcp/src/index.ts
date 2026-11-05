import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { buildServer } from "./server.ts"

/**
 * The MCP server, over stdio.
 *
 * @remarks
 * The client starts this process and talks to it over stdin and stdout. The
 * server reads and writes the repository it was started in, and nothing
 * else: no network, no credentials, no commands.
 *
 * `BRAIN_ROOT` points it at a bundle in another repository. Without it, the
 * bundle is looked up from the working directory upwards.
 */
const server = buildServer()

await server.connect(new StdioServerTransport())
