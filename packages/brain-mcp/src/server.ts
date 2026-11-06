import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { registerOnboardingTool } from "./onboarding.ts"
import { z } from "zod"
import {
  buildContext,
  loadConcepts,
  pathForType,
  readConcept,
  resolveBrainRoot,
  search,
  slugify,
  writeConcept,
  checkBundle,
  type Concept,
  type Frontmatter,
} from "@workspace/brain-core"

/**
 * The BRAIN, as an MCP server.
 *
 * @remarks
 * Six tools, and the first one is the important one: `brain_context` gives
 * everything a task needs in one call, so consulting the BRAIN is cheaper
 * than not consulting it.
 *
 * The server reads and writes the repository, and nothing else. It does not
 * run commands, it does not touch the network, and it has no credentials.
 */
export function buildServer(): McpServer {
  const server = new McpServer({
    name: "brain",
    version: "1.0.0",
  })

  registerTools(server)
  registerOnboardingTool(server)
  registerResources(server)
  registerPrompts(server)

  return server
}

/**
 * The six tools.
 */
function registerTools(server: McpServer): void {
  server.registerTool(
    "brain_context",
    {
      title: "El contexto de la tarea",
      description:
        "The starting point of any task: the conventions, patterns, rules and " +
        "decisions that apply to the paths you are about to touch, plus the " +
        "recent progress and lessons. Call this BEFORE writing code.",
      inputSchema: {
        paths: z
          .array(z.string())
          .optional()
          .describe("The paths you are about to touch, relative to the repository."),
        task: z
          .string()
          .optional()
          .describe("What the task is about, in a sentence."),
      },
    },
    async ({ paths, task }) => {
      const root = await resolveBrainRoot()
      const context = await buildContext(root, paths ?? [])
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                task: task ?? null,
                ...context,
              },
              null,
              2,
            ),
          },
        ],
      }
    },
  )

  server.registerTool(
    "brain_search",
    {
      title: "Buscar en el BRAIN",
      description:
        "Searches the BRAIN by text, title, description or tags. Returns " +
        "frontmatter only; read a concept with brain_read for the detail.",
      inputSchema: {
        query: z.string().describe("What to look for."),
        types: z
          .array(z.string())
          .optional()
          .describe("Only concepts of these types: Convention, Pattern, Rule, Decision, Lesson, Progress."),
        tags: z.array(z.string()).optional().describe("Only concepts with all these tags."),
        limit: z.number().int().positive().optional().describe("How many results. Defaults to 20."),
      },
    },
    async ({ query, types, tags, limit }) => {
      const root = await resolveBrainRoot()
      const concepts = await loadConcepts(root)
      const hits = search(concepts, query, {
        ...(types === undefined ? {} : { types }),
        ...(tags === undefined ? {} : { tags }),
        ...(limit === undefined ? {} : { limit }),
      })
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              hits.map((hit) => ({
                path: hit.path,
                type: hit.type,
                title: hit.title,
                description: hit.description,
                tags: hit.tags,
                matchedIn: hit.matchedIn,
              })),
              null,
              2,
            ),
          },
        ],
      }
    },
  )

  server.registerTool(
    "brain_read",
    {
      title: "Leer un concepto",
      description: "Reads one concept from the BRAIN, in full.",
      inputSchema: {
        path: z
          .string()
          .describe("The path of the concept, relative to the bundle: conventions/estilo.md."),
      },
    },
    async ({ path }) => {
      const root = await resolveBrainRoot()
      const concept = await readConcept(root, path)
      if (concept === null) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `There is no concept at "${path}". Use brain_search to find it.`,
            },
          ],
        }
      }
      return {
        content: [{ type: "text" as const, text: render(concept) }],
      }
    },
  )

  server.registerTool(
    "brain_record",
    {
      title: "Escribir un concepto",
      description:
        "The sanctioned way to write in the BRAIN. Use it for what has to " +
        "last: a decision, a lesson, a pattern, a convention. The concept is " +
        "validated, the index is regenerated and the log gets a line.",
      inputSchema: {
        type: z
          .enum([
            "Convention",
            "Pattern",
            "Rule",
            "Decision",
            "Lesson",
            "Progress",
            "Problem",
            "Spec",
            "Solution",
          ])
          .describe("The kind of concept."),
        title: z.string().min(1).describe("One line: what this concept is about."),
        description: z
          .string()
          .min(1)
          .describe(
            "One sentence: WHEN this concept applies. It is what the index and the search show.",
          ),
        body: z.string().describe("The content of the concept, in markdown."),
        tags: z.array(z.string()).optional().describe("Words to find it by."),
        severity: z
          .enum(["blocker", "major", "minor"])
          .optional()
          .describe("Only for a Rule: how serious it is."),
        applies_to: z
          .string()
          .optional()
          .describe("Only for a Rule: the paths it governs, as a glob."),
        check: z
          .object({
            kind: z.enum([
              "forbidden-path",
              "required-path",
              "forbidden-import",
              "required-import",
              "forbidden-text",
              "required-text",
            ]),
            value: z.string().min(1),
            message: z.string().optional(),
          })
          .optional()
          .describe("Only for a Rule: what it checks."),
      },
    },
    async (input) => {
      const root = await resolveBrainRoot()
      const now = new Date().toISOString()
      const frontmatter: Frontmatter = {
        type: input.type,
        title: input.title,
        description: input.description,
        generated: { by: "ia-factory/brain-mcp", at: now },
        status: "draft",
        ...(input.tags === undefined ? {} : { tags: input.tags }),
        ...(input.severity === undefined ? {} : { severity: input.severity }),
        ...(input.applies_to === undefined ? {} : { applies_to: input.applies_to }),
        ...(input.check === undefined ? {} : { check: input.check }),
      }

      const path = pathForType(input.type, slugify(input.title), frontmatter)
      try {
        const result = await writeConcept(root, {
          path,
          frontmatter,
          body: input.body,
        })
        return {
          content: [
            {
              type: "text" as const,
              text: `Written ${result.created ? "" : "updated "}${path}. The index and the log are up to date.`,
            },
          ],
        }
      } catch (error) {
        return {
          isError: true,
          content: [
            { type: "text" as const, text: (error as Error).message },
          ],
        }
      }
    },
  )

  server.registerTool(
    "brain_note",
    {
      title: "Anotar lo que ha pasado",
      description:
        "A quick note while you work: progress, an error, a decision, a " +
        "question. Use it in the moment, not at the end. Promote what has " +
        "to last with brain_record.",
      inputSchema: {
        kind: z
          .enum(["progress", "error", "decision", "question"])
          .describe("What kind of note this is."),
        title: z.string().min(1).describe("One line: what happened."),
        body: z.string().describe("The detail."),
        tags: z.array(z.string()).optional().describe("Words to find it by."),
      },
    },
    async ({ kind, title, body, tags }) => {
      const root = await resolveBrainRoot()
      const now = new Date().toISOString()
      const frontmatter: Frontmatter = {
        type: "Progress",
        title,
        description: `${kind}: ${title}`,
        generated: { by: "ia-factory/brain-mcp", at: now },
        status: "draft",
        tags: [kind, ...(tags ?? [])],
      }
      const path = pathForType("Progress", slugify(title), frontmatter)
      try {
        const result = await writeConcept(root, {
          path,
          frontmatter,
          body: `**${kind}**\n\n${body}`,
        })
        return {
          content: [
            {
              type: "text" as const,
              text: `Noted in ${result.path}.`,
            },
          ],
        }
      } catch (error) {
        return {
          isError: true,
          content: [
            { type: "text" as const, text: (error as Error).message },
          ],
        }
      }
    },
  )

  server.registerTool(
    "brain_check",
    {
      title: "La puerta",
      description:
        "Checks the change: the BRAIN is valid, the rules hold, and the " +
        "change documented something. Run it before calling a task done.",
      inputSchema: {
        paths: z
          .array(z.string())
          .optional()
          .describe("The paths to check. Defaults to what git says changed."),
      },
    },
    async ({ paths }) => {
      const root = await resolveBrainRoot()
      const result = await checkBundle({
        root,
        ...(paths === undefined ? {} : { paths }),
      })
      return {
        isError: !result.passes,
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                passes: result.passes,
                changed: result.changed.map((file) => file.path),
                findings: result.findings,
              },
              null,
              2,
            ),
          },
        ],
      }
    },
  )
}

/**
 * The concepts, as resources the client can list and read.
 */
function registerResources(server: McpServer): void {
  server.registerResource(
    "index",
    "brain://index",
    {
      title: "El índice del BRAIN",
      description: "The generated listing of the bundle.",
      mimeType: "text/markdown",
    },
    async (uri) => {
      const root = await resolveBrainRoot()
      const concepts = await loadConcepts(root)
      const index = concepts
        .map(
          (concept) =>
            `- [${concept.frontmatter.title ?? concept.path}](${concept.path}) — ${concept.frontmatter.description ?? ""}`,
        )
        .join("\n")
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "text/markdown",
            text: `# BRAIN\n\n${index}\n`,
          },
        ],
      }
    },
  )

  for (const folder of [
    "conventions",
    "patterns",
    "rules",
    "decisions",
    "lessons",
    "progress",
  ]) {
    server.registerResource(
      folder,
      `brain://${folder}/{path}`,
      {
        title: folder,
        description: `The ${folder} of the BRAIN.`,
        mimeType: "text/markdown",
      },
      async (uri) => {
        const root = await resolveBrainRoot()
        const path = decodeURIComponent(uri.pathname).replace(/^\//, "")
        const concept = await readConcept(root, path)
        if (concept === null) {
          throw new Error(`There is no concept at "${path}".`)
        }
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "text/markdown",
              text: render(concept),
            },
          ],
        }
      },
    )
  }
}

/**
 * The prompt that starts a task.
 */
function registerPrompts(server: McpServer): void {
  server.registerPrompt(
    "brain-start",
    {
      title: "Empezar una tarea",
      description:
        "The context of a task, ready to work with: conventions, patterns, " +
        "rules, decisions and what is left to do.",
      argsSchema: {
        paths: z
          .string()
          .optional()
          .describe("The paths you are about to touch, separated by commas."),
      },
    },
    async ({ paths }) => {
      const root = await resolveBrainRoot()
      const context = await buildContext(
        root,
        (paths ?? "")
          .split(",")
          .map((path) => path.trim())
          .filter((path) => path !== ""),
      )
      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: [
                "This is the context of this repository. Follow it.",
                "",
                JSON.stringify(context, null, 2),
                "",
                "Before writing code, read the conventions and the rules above.",
                "After the change, record what happened with brain_note.",
              ].join("\n"),
            },
          },
        ],
      }
    },
  )
}

/**
 * Renders a concept as markdown.
 */
function render(concept: Concept): string {
  const frontmatter = Object.entries(concept.frontmatter)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join("\n")
  return `---\n${frontmatter}\n---\n\n${concept.body}`
}
