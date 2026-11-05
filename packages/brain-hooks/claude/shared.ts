/**
 * The hooks, shared by every client.
 *
 * @remarks
 * Claude Code spawns one process per event, so the state of a session lives
 * in a file under `.factory/hooks/`. The input arrives as JSON on stdin.
 */
import { readFile } from "node:fs/promises"
import { afterBrainCall } from "../src/guard.ts"
import { readState, writeState } from "../src/state.ts"

/**
 * What Claude Code sends to a hook.
 */
export interface HookInput {
  readonly session_id?: string
  readonly cwd?: string
  readonly hook_event_name?: string
  readonly tool_name?: string
  readonly tool_input?: { readonly file_path?: string; readonly path?: string }
}

/**
 * Reads the event from stdin.
 */
export async function readInput(): Promise<HookInput> {
  const chunks: Buffer[] = []
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.from(chunk))
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim()
  if (raw === "") {
    return {}
  }
  try {
    return JSON.parse(raw) as HookInput
  } catch {
    return {}
  }
}

/**
 * The root of the repository the session is working in.
 */
export async function resolveRoot(input: HookInput): Promise<string> {
  if (process.env.CLAUDE_PROJECT_DIR !== undefined) {
    return process.env.CLAUDE_PROJECT_DIR
  }
  if (input.cwd !== undefined) {
    return input.cwd
  }
  return process.cwd()
}

/**
 * The path a write is going to touch.
 */
export function writtenPath(input: HookInput): string {
  return (
    input.tool_input?.file_path ?? input.tool_input?.path ?? ""
  )
}
