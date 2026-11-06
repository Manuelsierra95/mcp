import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  applyOnboarding,
  LAYER_A_QUESTIONS,
  LAYER_C_QUESTIONS,
  propose,
  renderProposal,
  resolveBrainRoot,
} from "@workspace/brain-core"

/**
 * The onboarding of a new project.
 *
 * @remarks
 * The tool is a flow, and the agent is the one who asks the questions:
 *
 * 1. `step: "questions"` → the four plain-language questions. The agent
 *    asks them, one at a time.
 * 2. `step: "propose"` → with the four answers, the concrete paths with
 *    their cost and their ceiling. The agent shows them and the person
 *    picks a letter.
 * 3. `step: "apply"` → with the letter, the conventions of the project are
 *    written: architecture, styles, testing and the framework.
 *
 * The technical layer is optional and comes with the proposal: the agent
 * asks it only if the person wants to go into detail.
 */
export function registerOnboardingTool(server: McpServer): void {
  server.registerTool(
    "brain_onboarding",
    {
      title: "Onboarding de un proyecto nuevo",
      description:
        "The onboarding of a new project, in three steps: " +
        "'questions' returns the four plain-language questions, " +
        "'propose' turns the answers into one to three concrete paths with " +
        "their cost and their ceiling, and " +
        "'apply' writes the conventions of the chosen path " +
        "(architecture, styles, testing and the framework) into the BRAIN.",
      inputSchema: {
        step: z
          .enum(["questions", "propose", "apply"])
          .describe("Where in the onboarding we are."),
        purpose: z
          .enum([
            "web o blog",
            "herramienta interna",
            "app de móvil",
            "API para otros",
            "librería",
            "informe",
            "otro",
          ])
          .optional()
          .describe("Layer A: what it is for."),
        otherPurpose: z
          .string()
          .optional()
          .describe("Layer A: what it is for, when the answer is 'otro'."),
        audience: z
          .enum(["cualquiera", "el equipo", "clientes", "solo técnicos"])
          .optional()
          .describe("Layer A: who uses it."),
        firstMinute: z
          .string()
          .optional()
          .describe("Layer A: what has to happen in the first minute, in their own words."),
        cadence: z
          .enum(["cada semana", "cada mes", "casi nunca"])
          .optional()
          .describe("Layer A: how often it changes."),
        choice: z
          .string()
          .optional()
          .describe("Layer B: the letter the person picked."),
        technical: z
          .object({
            language: z.string().optional(),
            hosting: z.string().optional(),
            authentication: z.string().optional(),
            data: z.string().optional(),
            deployment: z.string().optional(),
          })
          .optional()
          .describe("Layer C: the technical answers, if the person went into detail."),
      },
    },
    async (input) => {
      const root = await resolveBrainRoot()

      if (input.step === "questions") {
        return json({
          step: "questions",
          layerA: LAYER_A_QUESTIONS,
          layerC: LAYER_C_QUESTIONS,
          next:
            "Ask these four questions, one at a time, in the person's words. Then call brain_onboarding with step 'propose' and their answers.",
        })
      }

      const answers = readAnswers(input)
      if (answers === null) {
        return json(
          {
            error:
              "The onboarding needs the four Layer A answers: purpose, audience, firstMinute and cadence.",
            layerA: LAYER_A_QUESTIONS,
          },
          true,
        )
      }

      if (input.step === "propose") {
        const proposal = propose(answers)
        return json({
          step: "propose",
          summary: proposal.summary,
          options: proposal.options.map((option) => ({
            letter: option.letter,
            name: option.path.name,
            what: option.path.what,
            cost: option.path.cost,
            ceiling: option.path.ceiling,
          })),
          recommendation: proposal.recommendation,
          layerC: LAYER_C_QUESTIONS,
          text: renderProposal(proposal),
          next:
            "Show the person the three paths, in these words. Ask for a letter. Then, only if they want to go into technical detail, ask the Layer C questions. Finally call brain_onboarding with step 'apply', the letter and the technical answers.",
        })
      }

      // apply
      if (input.choice === undefined) {
        const proposal = propose(answers)
        return json(
          {
            error: "The onboarding needs the letter the person picked.",
            options: proposal.options.map((option) => option.letter),
          },
          true,
        )
      }

      try {
        const result = await applyOnboarding(
          root,
          answers,
          input.choice,
          input.technical ?? {},
        )
        return json({
          step: "apply",
          written: result.written,
          next:
            "The conventions are in the BRAIN. The next thing an agent does is call brain_context with the paths it is about to touch.",
        })
      } catch (error) {
        return json({ error: (error as Error).message }, true)
      }
    },
  )
}

/**
 * Reads the four answers, or null when one is missing.
 */
function readAnswers(input: {
  purpose?: string
  otherPurpose?: string
  audience?: string
  firstMinute?: string
  cadence?: string
}): {
  purpose:
    | "web o blog"
    | "herramienta interna"
    | "app de móvil"
    | "API para otros"
    | "librería"
    | "informe"
    | "otro"
  audience: "cualquiera" | "el equipo" | "clientes" | "solo técnicos"
  firstMinute: string
  cadence: "cada semana" | "cada mes" | "casi nunca"
  otherPurpose?: string
} | null {
  if (
    input.purpose === undefined ||
    input.audience === undefined ||
    input.firstMinute === undefined ||
    input.cadence === undefined
  ) {
    return null
  }
  return {
    purpose: input.purpose as never,
    audience: input.audience as never,
    firstMinute: input.firstMinute,
    cadence: input.cadence as never,
    ...(input.otherPurpose === undefined
      ? {}
      : { otherPurpose: input.otherPurpose }),
  }
}

/**
 * The tool's answer.
 */
function json(payload: unknown, isError = false) {
  return {
    isError,
    content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
  }
}
