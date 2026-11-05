/**
 * Records that the session used the BRAIN.
 *
 * @remarks
 * Wired to the MCP tools of the brain server (`mcp__brain__.*`). A call to
 * `brain_context` marks the session as informed; a call to `brain_note` or
 * `brain_record` marks it as having written.
 *
 * The hook never blocks: it only remembers.
 */
import { afterBrainCall } from "../src/guard.ts"
import { readState, writeState } from "../src/state.ts"
import { readInput, resolveRoot } from "./shared.ts"

const input = await readInput()
const root = await resolveRoot(input)
const sessionId = input.session_id ?? "default"

if (input.tool_name !== undefined) {
  const state = await readState(root, sessionId)
  const updated = afterBrainCall(state, input.tool_name)
  await writeState(root, sessionId, updated)
}

process.exit(0)
