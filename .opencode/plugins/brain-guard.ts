import { afterBrainCall, decideWrite } from "../../packages/brain-hooks/src/guard.ts"
import type { HookState } from "../../packages/brain-hooks/src/state.ts"
import { emptyState } from "../../packages/brain-hooks/src/state.ts"

/**
 * The BRAIN guard for OpenCode.
 *
 * @remarks
 * The same three doors as in Claude Code, with the plumbing OpenCode
 * offers:
 *
 * 1. `tool.execute.before` blocks a write to the BRAIN and a write to code
 *    when the session has not consulted the BRAIN. Blocking is a `throw`.
 * 2. The same hook records that the session used the BRAIN.
 * 3. `session.idle` warns when the session changed code without
 *    documenting it. OpenCode has no `Stop` hook that can send the agent
 *    back, so this one can only say it out loud.
 */
export const BrainGuard = async ({
  client,
  directory,
}: {
  client: { tui: { showToast: (input: { body: string[] }) => Promise<unknown> } }
  directory: string
}) => {
  let state: HookState = emptyState()

  return {
    "tool.execute.before": async (
      input: { tool: string },
      output: { args: Record<string, unknown> },
    ) => {
      const tool = input.tool

      if (tool.startsWith("brain_") || tool.includes("brain_")) {
        state = afterBrainCall(state, tool)
        return
      }

      if (!["edit", "write", "patch"].includes(tool)) {
        return
      }

      const path = String(
        output.args.filePath ?? output.args.path ?? output.args.file_path ?? "",
      )

      const decision = decideWrite(path, state)
      if (!decision.allow) {
        throw new Error(decision.reason ?? "Blocked by the BRAIN guard.")
      }

      state = { ...state, touchedCode: true }
    },

    event: async ({ event }: { event: { type: string } }) => {
      if (event.type !== "session.idle") {
        return
      }
      if (!state.touchedCode || state.wroteBrain) {
        return
      }
      try {
        await client.tui.showToast({
          body: [
            "Has cambiado código y no has documentado nada.",
            "Registra lo que pasó con `brain_note` antes de cerrar.",
          ],
        })
      } catch {
        // A toast that fails is not worth breaking the session for.
      }
    },
  }
}
