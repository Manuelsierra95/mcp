/**
 * The door: no se edita sin consultar el BRAIN, y el BRAIN no se edita a
 * mano.
 *
 * @remarks
 * Wired to the file tools (`Edit`, `Write`, `MultiEdit`, `NotebookEdit`).
 * Exit code 2 blocks the call, and the reason reaches the agent on stderr.
 */
import { decideWrite } from "../src/guard.ts"
import { readState, withPath, writeState } from "../src/state.ts"
import { readInput, resolveRoot, writtenPath } from "./shared.ts"

const input = await readInput()
const root = await resolveRoot(input)
const sessionId = input.session_id ?? "default"
const path = writtenPath(input)

const state = await readState(root, sessionId)
const decision = decideWrite(path, state)

if (!decision.allow) {
  process.stderr.write(`${decision.reason ?? "Blocked by the BRAIN guard."}\n`)
  process.exit(2)
}

// The session is allowed to write: remember that it touched code.
await writeState(
  root,
  sessionId,
  withPath({ ...state, touchedCode: true }, path),
)

process.exit(0)
