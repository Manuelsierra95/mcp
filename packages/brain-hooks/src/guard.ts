import type { HookState } from "./state.ts"

/**
 * What the hooks decide.
 */
export interface Decision {
  /** Whether the action may go ahead. */
  readonly allow: boolean
  /** Why not, in the words the agent will read. */
  readonly reason?: string
}

/**
 * The rules the hooks apply.
 *
 * @remarks
 * Three doors, and they are the three ways of not using the BRAIN:
 *
 * 1. **Editar sin consultar.** El agente no sabe cómo se hace aquí.
 * 2. **Escribir en `docs/` a mano.** El índice y el log los genera la
 *    herramienta; escribirlos a mano los deja viejos.
 * 3. **Terminar sin documentar.** Un cambio del que nadie deja rastro es un
 *    cambio que se repite.
 *
 * The rules live here, not in the clients. Claude Code and OpenCode have
 * different plumbing; the decision is the same.
 */

/** The tools that write in the BRAIN. */
const BRAIN_WRITERS = ["brain_note", "brain_record", "brain_write"]

/**
 * Whether a path belongs to the BRAIN.
 */
export function isBrainPath(path: string): boolean {
  const normalized = path.replace(/^\.\//, "")
  return normalized === "docs" || normalized.startsWith("docs/")
}

/**
 * Whether a tool call consults the BRAIN.
 */
export function isContextTool(toolName: string): boolean {
  return toolName === "brain_context" || toolName.endsWith("brain_context")
}

/**
 * Whether a tool call writes in the BRAIN.
 */
export function isBrainWriter(toolName: string): boolean {
  return BRAIN_WRITERS.some(
    (writer) => toolName === writer || toolName.endsWith(writer),
  )
}

/**
 * Whether a write may go ahead.
 *
 * @remarks
 * The order matters: the BRAIN is checked first, because writing in it is
 * forbidden whatever the state of the session is.
 */
export function decideWrite(path: string, state: HookState): Decision {
  if (isBrainPath(path)) {
    return {
      allow: false,
      reason:
        "El BRAIN se escribe con `brain_record` o `brain_note`, no a mano: el índice y el log los genera la herramienta. Llama a `brain_record` con el contenido.",
    }
  }
  if (!state.contextLoaded) {
    return {
      allow: false,
      reason:
        "Antes de editar, llama a `brain_context` con las rutas que vas a tocar. Te da las convenciones, los patrones y las reglas de este repositorio, y no adivinas.",
    }
  }
  return { allow: true }
}

/**
 * Whether the session may finish.
 *
 * @remarks
 * Only when there is something to document. A session that read the BRAIN
 * and changed nothing has nothing to say about it.
 */
export function decideStop(state: HookState): Decision {
  if (state.touchedCode && !state.wroteBrain) {
    return {
      allow: false,
      reason:
        "Has cambiado código y no has documentado nada. Registra lo que pasó con `brain_note` (avance, error, decisión) antes de terminar.",
    }
  }
  return { allow: true }
}

/**
 * The state after a call to the BRAIN.
 */
export function afterBrainCall(
  state: HookState,
  toolName: string,
): HookState {
  if (isContextTool(toolName)) {
    return { ...state, contextLoaded: true }
  }
  if (isBrainWriter(toolName)) {
    return { ...state, wroteBrain: true }
  }
  return state
}
