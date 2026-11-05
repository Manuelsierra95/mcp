/**
 * The last door: a session that changed code has to say what happened.
 *
 * @remarks
 * Wired to the `Stop` event. Exit code 2 does not stop the session: it
 * makes Claude keep working, with the reason as the instruction. That is
 * the one hook that can close the loop by itself.
 */
import { decideStop } from "../src/guard.ts"
import { readState } from "../src/state.ts"
import { readInput, resolveRoot } from "./shared.ts"

const input = await readInput()
const root = await resolveRoot(input)
const sessionId = input.session_id ?? "default"

const state = await readState(root, sessionId)
const decision = decideStop(state)

if (!decision.allow) {
  process.stderr.write(`${decision.reason ?? "Document what happened."}\n`)
  process.exit(2)
}

process.exit(0)
