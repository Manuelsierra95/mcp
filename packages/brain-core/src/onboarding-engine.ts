import { writeConcept, slugify, pathForType } from "./record.ts"
import {
  PATHS,
  type OnboardingAnswers,
  type Path,
  type Stack,
  type TechnicalAnswers,
} from "./onboarding.ts"

/**
 * The proposal: what the four answers turn into.
 *
 * @remarks
 * The person picks a letter, not a technology. That is the whole point: a
 * choice made about something concrete, instead of a list of acronyms.
 */
export interface ProposalOption {
  /** The letter: "A", "B", "C". */
  readonly letter: string
  readonly path: Path
}

export interface Proposal {
  /** What was understood, in the person's words. */
  readonly summary: string
  readonly options: readonly ProposalOption[]
  /** Which one the answers point at, and why. */
  readonly recommendation: { readonly letter: string; readonly reason: string }
}

/**
 * The framework document each path brings with it.
 */
const FRAMEWORK_DOC: Readonly<Record<string, { slug: string; title: string }>> = {
  "web-estatica": { slug: "astro", title: "Astro" },
  "web-con-datos": { slug: "nextjs", title: "Next.js" },
  "herramienta-web": { slug: "nextjs", title: "Next.js" },
  "herramienta-cli": { slug: "node-cli", title: "Node" },
  "app-movil": { slug: "expo", title: "Expo" },
  "web-instalable": { slug: "nextjs", title: "Next.js" },
  "api-con-datos": { slug: "api-http", title: "API HTTP" },
  "api-sin-estado": { slug: "api-http", title: "API HTTP" },
  "libreria-ts": { slug: "typescript", title: "TypeScript" },
  "libreria-python": { slug: "python", title: "Python" },
  "informe-automatico": { slug: "informes", title: "Informes" },
  "panel-de-datos": { slug: "nextjs", title: "Next.js" },
}

/**
 * How the purpose is said out loud.
 *
 * @remarks
 * The summary is read by a person, so it says "una web o un blog" and not
 * "web o blog". A category name in the middle of a sentence sounds like a
 * form.
 */
const PURPOSE_PHRASES: Readonly<Record<string, string>> = {
  "web o blog": "una web o un blog",
  "herramienta interna": "una herramienta interna",
  "app de móvil": "una app de móvil",
  "API para otros": "una API para otros",
  librería: "una librería",
  informe: "un informe",
}

/**
 * How the change rate is said out loud.
 */
const CADENCE_PHRASES: Readonly<Record<string, string>> = {
  "cada semana": "cambia cada semana",
  "cada mes": "cambia cada mes",
  "casi nunca": "cambia poco",
}

/**
 * How well a path fits the answers.
 *
 * @remarks
 * The score is a sum of small reasons, not a mystery. Each one can be
 * argued with, which is what matters when someone asks "why this one".
 */
export function scorePath(path: Path, answers: OnboardingAnswers): number {
  let score = 0

  if (path.audiences.includes(answers.audience)) {
    score += 3
  }
  if (path.fitsCadence.includes(answers.cadence)) {
    score += 2
  }
  // A project that changes every week needs a place to put things that is
  // not the deploy.
  if (answers.cadence === "cada semana" && path.needsDatabase) {
    score += 1
  }
  // A database nobody needs is a database somebody maintains.
  if (answers.cadence === "casi nunca" && path.needsDatabase) {
    score -= 1
  }
  // The audience has to be able to use it.
  if (
    path.needsInstallation &&
    (answers.audience === "cualquiera" || answers.audience === "clientes")
  ) {
    score -= 3
  }
  // Nobody outside the team installs a CLI.
  if (path.needsInstallation && answers.audience === "cualquiera") {
    score -= 1
  }

  return score
}

/**
 * Turns the four answers into one to three paths.
 */
export function propose(answers: OnboardingAnswers): Proposal {
  const candidates = PATHS.filter((path) => path.purpose === answers.purpose)

  const ranked = candidates
    .map((path) => ({ path, score: scorePath(path, answers) }))
    .sort((a, b) => b.score - a.score)

  const options: ProposalOption[] = ranked
    .slice(0, 3)
    .map((entry, index) => ({
      letter: String.fromCharCode(65 + index),
      path: entry.path,
    }))

  const best = options[0]
  const purpose =
    answers.purpose === "otro"
      ? (answers.otherPurpose ?? "otra cosa")
      : (PURPOSE_PHRASES[answers.purpose] ?? answers.purpose)

  const cadence = CADENCE_PHRASES[answers.cadence] ?? answers.cadence

  const summary = `Has dicho: ${purpose}, para ${answers.audience}, donde lo importante es ${answers.firstMinute}, y ${cadence}.`

  const reason = best === undefined
    ? "No hay caminos para esa respuesta."
    : `Con lo que me has contado, ${best.letter}.`

  return {
    summary,
    options,
    recommendation: { letter: best?.letter ?? "A", reason },
  }
}

/**
 * The proposal, as the person reads it.
 *
 * @remarks
 * No acronyms, no versions, no "stack". Only what it is, what it costs and
 * where it stops.
 */
export function renderProposal(proposal: Proposal): string {
  const lines: string[] = [proposal.summary, ""]

  for (const option of proposal.options) {
    lines.push(
      `${option.letter} · ${option.path.name} — ${option.path.what}`,
      `    Coste: ${option.path.cost}`,
      `    Techo: ${option.path.ceiling}`,
      "",
    )
  }

  lines.push("C · Escribe tu respuesta.")
  lines.push(proposal.recommendation.reason)
  return lines.join("\n")
}

/**
 * What the onboarding writes into the BRAIN.
 */
export interface OnboardingResult {
  readonly written: readonly string[]
}

/**
 * Writes the conventions of the chosen path.
 *
 * @remarks
 * Four conventions, and a decision that says why this path and not another:
 * architecture, styles, testing and the framework.
 *
 * The technical answers, when there are any, override the stack of the path.
 * A path says what it implies; a person can say otherwise.
 */
export async function applyOnboarding(
  root: string,
  answers: OnboardingAnswers,
  choice: string,
  technical: TechnicalAnswers = {},
): Promise<OnboardingResult> {
  const proposal = propose(answers)
  const option = proposal.options.find((entry) => entry.letter === choice)
  if (option === undefined) {
    throw new Error(
      `There is no path "${choice}". The options are ${proposal.options
        .map((entry) => entry.letter)
        .join(", ")}.`,
    )
  }

  const stack = applyTechnical(option.path.stack, technical)
  const written: string[] = []

  const concepts = [
    architectureConcept(answers, option.path, stack),
    styleConcept(stack),
    testingConcept(stack),
    frameworkConcept(option.path, stack),
    decisionConcept(answers, option.path, stack),
  ]

  for (const concept of concepts) {
    const frontmatter = {
      type: concept.type,
      title: concept.title,
      description: concept.description,
      generated: { by: "ia-factory/brain-onboarding", at: new Date().toISOString() },
      status: "draft" as const,
      tags: [...concept.tags],
    }
    const path = pathForType(concept.type, slugify(concept.title), frontmatter)
    await writeConcept(root, { path, frontmatter, body: concept.body })
    written.push(path)
  }

  return { written }
}

/**
 * The technical answers override what the path implies.
 */
function applyTechnical(stack: Stack, technical: TechnicalAnswers): Stack {
  return {
    ...stack,
    ...(technical.language === undefined ? {} : { language: technical.language }),
    ...(technical.hosting === undefined ? {} : { hosting: technical.hosting }),
    ...(technical.authentication === undefined
      ? {}
      : { authentication: technical.authentication }),
    ...(technical.data === undefined ? {} : { data: technical.data }),
    ...(technical.deployment === undefined
      ? {}
      : { deployment: technical.deployment }),
  }
}

interface ConceptDraft {
  readonly type: string
  readonly title: string
  readonly description: string
  readonly tags: readonly string[]
  readonly body: string
}

/**
 * The architecture convention.
 */
function architectureConcept(
  answers: OnboardingAnswers,
  path: Path,
  stack: Stack,
): ConceptDraft {
  const purpose =
    answers.purpose === "otro"
      ? (answers.otherPurpose ?? "otra cosa")
      : answers.purpose

  const body = `# Arquitectura

## Qué es este proyecto

${capitalize(purpose)}. Lo usa ${answers.audience}. Lo que tiene que pasar en el
primer minuto: ${answers.firstMinute}. Cambia ${answers.cadence}.

## El camino elegido

**${path.name}** — ${path.what}

- **Coste:** ${path.cost}
- **Techo:** ${path.ceiling}

## Dónde vive cada cosa

${stack.structure.map((piece) => `- \`${piece}\``).join("\n")}

## Las decisiones de fondo

- **Marco:** ${stack.framework}
- **Lenguaje:** ${stack.language}
- **Datos:** ${stack.data}
- **Alojamiento:** ${stack.hosting}
- **Cuentas:** ${stack.authentication}
- **Publicación:** ${stack.deployment}

## Lo que no se cruza

- Un paquete no importa el interior de otro paquete: se cruza por su API pública.
- La interfaz no se mezcla con el acceso a los datos: los datos se Asking a través de su propia capa.
- Un camino hacia arriba (un módulo, una función) no depende de uno hacia abajo (una ruta, un handler).
`

  return {
    type: "Convention",
    title: "La arquitectura de este proyecto",
    description: `Dónde vive cada cosa y qué no se cruza, según el camino elegido: ${path.name}. Se aplica a cualquier cambio que añada código, una dependencia o una carpeta.`,
    tags: ["arquitectura", "estructura"],
    body,
  }
}

/**
 * The styles convention.
 */
function styleConcept(stack: Stack): ConceptDraft {
  const body = `# Estilo

## El código

- **Lenguaje:** ${stack.language}. TypeScript estricto, sin \`any\`Implicit.
- **Formato:** Prettier. Sin punto y coma, comillas dobles, 2 espacios, 80 columnas.
- **Lint:** ESLint, con la configuración compartida del monorepo.
- **Imports:** los externos primero, después los del workspace, después los relativos. Cada bloque separado por una línea en blanco.

## La interfaz

${stack.styling}

## Los nombres

| Qué | Cómo |
|---|---|
| Fichero | \`kebab-case\`: \`theme-provider.ts\` |
| Componente de React | \`PascalCase\` en el nombre, \`kebab-case\` en el fichero |
| Función y variable | \`camelCase\` |
| Tipo e interfaz | \`PascalCase\` |
| Constante | \`SCREAMING_SNAKE_CASE\` |

## Los comentarios

Un comentario explica **por qué**, no **qué**. El qué ya lo dice el código.

## Lo que no se hace

- \`console.log\` para depurar.
- \`any\` para que el compilador se calle.
- Comentarios de bloque comentado: el historial de git ya cuenta esa historia.
`

  return {
    type: "Convention",
    title: "El estilo de este proyecto",
    description: `Cómo se escribe el código aquí: ${stack.language}, el formato, los nombres y los imports. Se aplica a todo fichero de código del repositorio.`,
    tags: ["estilo", "codigo"],
    body,
  }
}

/**
 * The testing convention.
 */
function testingConcept(stack: Stack): ConceptDraft {
  const body = `# Testing

## Qué se prueba y cómo

${stack.testing}

## El contrato AC-n

El título de un test empieza por el id del criterio de aceptación:

\`\`\`ts
test("AC-1 · la home muestra el título", async ({ page }) => {
  await page.goto("/")
})
\`\`\`

No es un estilo: es un contrato. La herramienta ejecuta **un solo** test
(\`--grep "AC-1"\`) para comprobar que falla antes de la implementación y
pasa después. Un test que no empieza por \`AC-\` no es trazable a nada.

## Reglas

- Un criterio de aceptación, un test.
- El test dice qué espera, no cómo lo hace: \`getByRole("button", { name: "Exportar" })\`, no un selector de CSS.
- Nada de \`waitForTimeout\`: se espera por estado, no por reloj.
- Un test que depende de otro es un test que falla solo en CI.

## Qué se ejecuta y cuándo

| Momento | Qué |
|---|---|
| Al commit | El linter y el typecheck |
| En CI | Linter, typecheck, unit tests y e2e |
| Antes de dar algo por terminado | La puerta: \`pnpm brain check\` |
`

  return {
    type: "Convention",
    title: "Cómo se prueba aquí",
    description:
      "Qué se prueba con e2e y qué con unit tests, y el contrato de títulos AC-n que hace el TDD verificable. Se aplica al añadir tests y al añadir funcionalidad.",
    tags: ["testing", "ac"],
    body,
  }
}

/**
 * The framework convention.
 */
function frameworkConcept(path: Path, stack: Stack): ConceptDraft {
  const doc = FRAMEWORK_DOC[path.id] ?? {
    slug: slugify(stack.framework),
    title: stack.framework,
  }

  const body = `# ${doc.title}

## Qué es

${stack.framework}

## Lo que decide

- **Lenguaje:** ${stack.language}
- **Datos:** ${stack.data}
- **Alojamiento:** ${stack.hosting}
- **Cuentas:** ${stack.authentication}
- **Publicación:** ${stack.deployment}

## Antes de escribir código de ${doc.title}

**Se lee la guía de la versión instalada**, en \`node_modules/\`. No la de
internet, no la de memoria. Esta versión rompe cosas respecto a lo que se
sabe, y la guía del repositorio es lo que manda.

## Lo que este proyecto usa de ${doc.title}

${stack.structure.map((piece) => `- \`${piece}\``).join("\n")}

## La puerta

- El typecheck y el lint antes de commitear.
- La suite de tests antes de dar algo por terminado.
`

  return {
    type: "Convention",
    title: `${doc.title}, y cómo lo usa este proyecto`,
    description: `Qué es ${doc.title} en este proyecto, qué se decide con él y qué se lee antes de escribir código. Se aplica a cualquier cambio que use ${doc.title}.`,
    tags: [slugify(doc.title), "framework"],
    body,
  }
}

/**
 * The decision that records why this path.
 */
function decisionConcept(
  answers: OnboardingAnswers,
  path: Path,
  stack: Stack,
): ConceptDraft {
  const purpose =
    answers.purpose === "otro"
      ? (answers.otherPurpose ?? "otra cosa")
      : answers.purpose

  const body = `# Por qué ${path.name}

## Contexto

El proyecto ${purpose} lo va a usar ${answers.audience}. Lo que tiene que
pasar en el primer minuto: ${answers.firstMinute}. Cambia ${answers.cadence}.

## Opciones

${PATHS.filter((candidate) => candidate.purpose === answers.purpose)
  .map(
    (candidate) =>
      `- **${candidate.name}** — ${candidate.what}. Coste: ${candidate.cost}. Techo: ${candidate.ceiling}.`,
  )
  .join("\n")}

## Decisión

**${path.name}**, porque es lo que encaja con esas cuatro respuestas: ${path.what}

## Consecuencias

- **Marco:** ${stack.framework}
- **Lenguaje:** ${stack.language}
- **Datos:** ${stack.data}
- **Alojamiento:** ${stack.hosting}
- **Publicación:** ${stack.deployment}
- **Techo asumido:** ${path.ceiling}. Cuando se llegue, el camino de crecimiento es el otro de la lista.
`

  return {
    type: "Decision",
    title: `El camino elegido: ${path.name}`,
    description: `Por qué este proyecto va con ${path.name} y no con el otro, a partir de para qué sirve, quién lo usa y cada cuánto cambia.`,
    tags: ["onboarding", "arquitectura"],
    body,
  }
}

/**
 * Capitalizes the first letter.
 */
function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}
