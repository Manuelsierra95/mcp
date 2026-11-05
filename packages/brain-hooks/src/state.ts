import { mkdir, readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"

/**
 * What a session has done with the BRAIN so far.
 *
 * @remarks
 * The hooks are separate processes (Claude Code spawns one per event), so
 * the state lives in a file. OpenCode keeps it in memory, because its
 * plugin is one long-lived process. The shape is the same either way, so
 * the rules live in one place.
 */
export interface HookState {
  /** The session called `brain_context`. */
  readonly contextLoaded: boolean
  /** The session wrote in the BRAIN with `brain_note` or `brain_record`. */
  readonly wroteBrain: boolean
  /** The session touched code. */
  readonly touchedCode: boolean
  /** The paths the session touched. */
  readonly updatedPaths: readonly string[]
}

export function emptyState(): HookState {
  return {
    contextLoaded: false,
    wroteBrain: false,
    touchedCode: false,
    updatedPaths: [],
  }
}

/**
 * Where the state of a session lives.
 *
 * @remarks
 * Under `.factory/`, which is gitignored: it is state of one session on one
 * machine, not knowledge of the project.
 */
export function statePath(root: string, sessionId: string): string {
  return join(root, ".factory", "hooks", `${sessionId}.json`)
}

/**
 * Reads the state of a session.
 */
export async function readState(
  root: string,
  sessionId: string,
): Promise<HookState> {
  try {
    const raw = await readFile(statePath(root, sessionId), "utf8")
    const parsed = JSON.parse(raw) as Partial<HookState>
    return { ...emptyState(), ...parsed }
  } catch {
    return emptyState()
  }
}

/**
 * Writes the state of a session.
 */
export async function writeState(
  root: string,
  sessionId: string,
  state: HookState,
): Promise<void> {
  const path = statePath(root, sessionId)
  await mkdir(join(root, ".factory", "hooks"), { recursive: true })
  await writeFile(path, `${JSON.stringify(state, null, 2)}\n`, "utf8")
}

/**
 * Adds a path to the state's list, without repeating it.
 */
export function withPath(state: HookState, path: string): HookState {
  if (state.updatedPaths.includes(path)) {
    return state
  }
  return { ...state, updatedPaths: [...state.updatedPaths, path] }
}
