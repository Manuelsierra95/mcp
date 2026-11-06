/**
 * The onboarding of a new project.
 *
 * @remarks
 * Three layers:
 *
 * 1. **Layer A**, for everybody: what it is for, who uses it, what has to
 *    happen in the first minute, and how often it changes. No jargon.
 * 2. **Layer B**, the proposal: the four answers become one to three
 *    concrete paths, each with what it costs and where it stops working.
 *    The person picks a letter, not a technology.
 * 3. **Layer C**, optional and technical: language, hosting, authentication,
 *    data, deployment. Questions with options, never blank forms.
 *
 * At the end, the chosen path becomes the conventions of the project:
 * architecture, styles, testing and framework.
 */

/** What the project is for. */
export const PURPOSES = [
  "web o blog",
  "herramienta interna",
  "app de móvil",
  "API para otros",
  "librería",
  "informe",
  "otro",
] as const

export type Purpose = (typeof PURPOSES)[number]

/** Who uses it. */
export const AUDIENCES = [
  "cualquiera",
  "el equipo",
  "clientes",
  "solo técnicos",
] as const

export type Audience = (typeof AUDIENCES)[number]

/** How often it changes. */
export const CADENCES = [
  "cada semana",
  "cada mes",
  "casi nunca",
] as const

export type Cadence = (typeof CADENCES)[number]

/** The four plain-language answers. */
export interface OnboardingAnswers {
  /** What it is for. */
  readonly purpose: Purpose
  /** Who uses it. */
  readonly audience: Audience
  /** The main action, in the person's own words. */
  readonly firstMinute: string
  /** How often it changes. */
  readonly cadence: Cadence
  /** What the project is, when the purpose is "otro". */
  readonly otherPurpose?: string
}

/** The technical answers, when the person wants to go into detail. */
export interface TechnicalAnswers {
  readonly language?: string
  readonly hosting?: string
  readonly authentication?: string
  readonly data?: string
  readonly deployment?: string
}

/** What a path implies technically. */
export interface Stack {
  readonly framework: string
  readonly language: string
  readonly styling: string
  readonly testing: string
  readonly data: string
  readonly hosting: string
  readonly authentication: string
  readonly deployment: string
  /** The pieces the project is made of. */
  readonly structure: readonly string[]
}

/** One concrete path. */
export interface Path {
  readonly id: string
  /** The name, in plain language. */
  readonly name: string
  /** What it is, in plain language. */
  readonly what: string
  /** What it costs. */
  readonly cost: string
  /** Where it stops working. */
  readonly ceiling: string
  readonly purpose: Purpose
  /** The audiences it fits. */
  readonly audiences: readonly Audience[]
  /** How much the project is expected to change. */
  readonly fitsCadence: readonly Cadence[]
  /** Whether the person has to install something to use it. */
  readonly needsInstallation: boolean
  /** Whether it needs accounts. */
  readonly needsAccounts: boolean
  /** Whether it needs a database. */
  readonly needsDatabase: boolean
  readonly stack: Stack
}

/**
 * The paths.
 *
 * @remarks
 * Two or three per purpose. The first one is the simplest that works; the
 * next ones are what it grows into. That is the order the proposal shows
 * them in, because the question a person is answering is "what do I start
 * with", not "what are my options".
 */
export const PATHS: readonly Path[] = [
  {
    id: "web-estatica",
    name: "Web estática",
    what: "las páginas se generan por adelantado y se publican en un CDN. No hay servidor que mantener.",
    cost: "casi nada: un repositorio y un CDN. Cada cambio es un commit.",
    ceiling: "cuando el contenido lo editan varias personas sin saber Git, o hace falta un login.",
    purpose: "web o blog",
    audiences: ["cualquiera", "el equipo", "clientes"],
    fitsCadence: ["cada mes", "casi nunca"],
    needsInstallation: false,
    needsAccounts: false,
    needsDatabase: false,
    stack: {
      framework:
        "Astro, con las páginas en Markdown. Los componentes se escriben cuando hacen falta, no antes.",
      language: "TypeScript",
      styling: "Tailwind CSS, con el mismo sistema de diseño que el resto del proyecto",
      testing:
        "Playwright para el e2e: un test por criterio de aceptación, con el título empezando por `AC-n`. Vitest para lo que sea lógica pura",
      data: "Los contenidos en el repositorio, como ficheros",
      hosting: "Un CDN. El repositorio es la fuente de la verdad",
      authentication: "Ninguna. Si hace falta, se crece",
      deployment: "Un push al repositorio y el CDN se encarga",
      structure: [
        "src/content/: los artículos, en Markdown",
        "src/pages/: las páginas que se generan",
        "src/components/: lo reutilizable",
      ],
    },
  },
  {
    id: "web-con-datos",
    name: "Web con base de datos",
    what: "una web normal, con un panel donde varias personas publican sin tocar código.",
    cost: "un servidor pequeño y una base de datos, y alguien que los mantenga. Los despliegues dejan de ser gratis.",
    ceiling: "cuando hay mucho tráfico o hace falta escalar sin tocar el código.",
    purpose: "web o blog",
    audiences: ["el equipo", "clientes", "cualquiera"],
    fitsCadence: ["cada semana", "cada mes"],
    needsInstallation: false,
    needsAccounts: true,
    needsDatabase: true,
    stack: {
      framework:
        "Next.js con App Router. Las rutas viven en app/, y lo que se ve en el navegador es un componente.",
      language: "TypeScript",
      styling: "Tailwind CSS y componentes compartidos en un paquete propio",
      testing:
        "Playwright para el e2e: un test por criterio de aceptación, con el título empezando por `AC-n`. Vitest para las unidades",
      data: "PostgreSQL, con las migraciones versionadas en el repositorio",
      hosting: "Un servidor de aplicación y una base de datos gestionada",
      authentication: "Cuentas de usuario, con un panel para publicar",
      deployment: "Despliegue continuo desde el repositorio",
      structure: [
        "apps/web/: la aplicación, con app/ para las rutas",
        "apps/web/app/api/: lo que consume el panel",
        "packages/ui/: los componentes compartidos",
        "packages/db/: el acceso a los datos y las migraciones",
      ],
    },
  },
  {
    id: "herramienta-web",
    name: "Herramienta interna con datos",
    what: "una web privada, con login, donde el equipo trabaja con los datos de la empresa.",
    cost: "un servidor y una base de datos, y alguien que los vigile. También las copias de seguridad.",
    ceiling: "cuando hace falta integrarse con otros sistemas, o el volumen de datos crece mucho.",
    purpose: "herramienta interna",
    audiences: ["el equipo", "solo técnicos"],
    fitsCadence: ["cada semana", "cada mes"],
    needsInstallation: false,
    needsAccounts: true,
    needsDatabase: true,
    stack: {
      framework: "Next.js con App Router",
      language: "TypeScript",
      styling: "Tailwind CSS y componentes compartidos en un paquete propio",
      testing:
        "Playwright para el e2e: un test por criterio de aceptación, con el título empezando por `AC-n`. Vitest para las unidades",
      data: "PostgreSQL, con las migraciones versionadas en el repositorio",
      hosting: "Un servidor de aplicación y una base de datos gestionada",
      authentication: "Cuentas del equipo, con los permisos por rol",
      deployment: "Despliegue continuo desde el repositorio",
      structure: [
        "apps/web/: la herramienta, con app/ para las rutas",
        "apps/web/app/api/: lo que consume el frontend",
        "packages/ui/: los componentes compartidos",
        "packages/db/: el acceso a los datos y las migraciones",
      ],
    },
  },
  {
    id: "herramienta-cli",
    name: "Herramienta de línea de comandos",
    what: "un programa que corre en el ordenador de cada uno. No hay nada que desplegar.",
    cost: "nada de servidores. El coste es mantenerlo para varias versiones de Node.",
    ceiling: "cuando alguien sin Node tiene que usarlo, o hace falta compartir el estado entre personas.",
    purpose: "herramienta interna",
    audiences: ["solo técnicos", "el equipo"],
    fitsCadence: ["cada semana", "cada mes", "casi nunca"],
    needsInstallation: true,
    needsAccounts: false,
    needsDatabase: false,
    stack: {
      framework: "Una CLI con un comando y subcomandos",
      language: "TypeScript, compilado a JavaScript",
      styling: "No hay interfaz: la ayuda del comando es la documentación",
      testing: "Vitest para las unidades, y el comando corriendo de verdad contra un caso real",
      data: "Los ficheros del proyecto. Si hace falta estado compartido, se crece",
      hosting: "Ninguno. Cada uno lo instala desde el repositorio",
      authentication: "Las credenciales de cada uno, en su entorno",
      deployment: "Un tag en el repositorio y quien lo quiera lo actualiza",
      structure: [
        "src/commands/: un fichero por comando",
        "src/lib/: lo que se comparte entre comandos",
      ],
    },
  },
  {
    id: "app-movil",
    name: "App móvil",
    what: "una app que se instala desde la tienda, en el teléfono.",
    cost: "revisiones de la tienda, versiones de sistemas, y probar en muitos dispositivos.",
    ceiling: "no sirve para web. Y cada cambio es una versión nueva que installar.",
    purpose: "app de móvil",
    audiences: ["cualquiera", "clientes"],
    fitsCadence: ["cada semana", "cada mes"],
    needsInstallation: true,
    needsAccounts: false,
    needsDatabase: true,
    stack: {
      framework: "Expo con React Native",
      language: "TypeScript",
      styling: "Tailwind CSS con el mismo sistema de diseño que el resto",
      testing:
        "Playwright para el e2e de las partes web. Los flujos de la app se prueban a mano, en un emulador",
      data: "Una API propia en el backend, con PostgreSQL",
      hosting: "Un backend desplegado, y las tiendas de aplicaciones",
      authentication: "Cuentas de usuario, con entrada desde el teléfono",
      deployment: "Publicación en la tienda, con revisión manual",
      structure: [
        "app/: la app, con una carpeta por pantalla",
        "app/api/: lo que consume la app",
        "packages/ui/: los componentes compartidos",
      ],
    },
  },
  {
    id: "web-instalable",
    name: "Web móvil instalable",
    what: "una web que se puede instalar en la pantalla de inicio del teléfono, como una app.",
    cost: "casi nada: es una web. Lo que cuesta es que no llega a las tiendas.",
    ceiling: "no hay notificaciones push fiables y no se revisa en las tiendas.",
    purpose: "app de móvil",
    audiences: ["cualquiera", "clientes"],
    fitsCadence: ["cada semana", "cada mes", "casi nunca"],
    needsInstallation: true,
    needsAccounts: false,
    needsDatabase: true,
    stack: {
      framework: "Next.js con App Router, y un manifest para poder instalarla",
      language: "TypeScript",
      styling: "Tailwind CSS y componentes compartidos",
      testing:
        "Playwright para el e2e: un test por criterio de aceptación, con el título empezando por `AC-n`. Vitest para las unidades",
      data: "PostgreSQL, con las migraciones versionadas en el repositorio",
      hosting: "Un servidor de aplicación y una base de datos gestionada",
      authentication: "Cuentas de usuario",
      deployment: "Despliegue continuo desde el repositorio",
      structure: [
        "apps/web/: la web, con app/ para las rutas",
        "packages/ui/: los componentes compartidos",
        "packages/db/: el acceso a los datos y las migraciones",
      ],
    },
  },
  {
    id: "api-con-datos",
    name: "API con base de datos",
    what: "un servicio que habla HTTP y guarda los datos en su propia base de datos.",
    cost: "un servidor que alguien vigila, más la base de datos. Y una versión que mantener.",
    ceiling: "cuando el volumen es alto y constante, hace falta escalar, y el coste se dispara.",
    purpose: "API para otros",
    audiences: ["solo técnicos", "el equipo"],
    fitsCadence: ["cada semana", "cada mes"],
    needsInstallation: false,
    needsAccounts: true,
    needsDatabase: true,
    stack: {
      framework: "Una API HTTP con un contrato versionado",
      language: "TypeScript con Fastify, o Python con FastAPI",
      styling: "No hay interfaz",
      testing:
        "Tests del contrato: cada endpoint tiene sus casos. Vitest o pytest, según el lenguaje",
      data: "PostgreSQL, con las migraciones versionadas en el repositorio",
      hosting: "Un servidor de aplicación y una base de datos gestionada",
      authentication: "Claves de API, y a veces cuentas",
      deployment: "Despliegue continuo desde el repositorio",
      structure: [
        "src/routes/: un fichero por endpoint",
        "src/domain/: la lógica, sin nada de HTTP",
        "src/db/: el acceso a los datos y las migraciones",
      ],
    },
  },
  {
    id: "api-sin-estado",
    name: "API sin estado",
    what: "un servicio que solo responde peticiones. Se enciende, se apaga, y no guarda nada.",
    cost: "se paga por uso, y casi nada cuando no se usa. La base de datos se paga aparte.",
    ceiling: "cuando el trabajo es largo o constante, las funciones se quedan cortas y hay que migrar a un servidor.",
    purpose: "API para otros",
    audiences: ["solo técnicos", "el equipo"],
    fitsCadence: ["cada mes", "casi nunca"],
    needsInstallation: false,
    needsAccounts: true,
    needsDatabase: true,
    stack: {
      framework: "Funciones sin servidor, detrás de un API gateway",
      language: "TypeScript o Python",
      styling: "No hay interfaz",
      testing:
        "Tests del contrato: cada endpoint tiene sus casos. Vitest o pytest, según el lenguaje",
      data: "Una base de datos gestionada, accedida desde fuera",
      hosting: "Funciones sin servidor y una base de datos gestionada",
      authentication: "Claves de API",
      deployment: "Despliegue continuo desde el repositorio",
      structure: [
        "src/functions/: una función por endpoint",
        "src/domain/: la lógica, sin nada de HTTP",
      ],
    },
  },
  {
    id: "libreria-ts",
    name: "Paquete de TypeScript",
    what: "un piece de código que otros instalan con `npm install`.",
    cost: "casi nada de infraestructura. El coste es mantenerlo compatible con varias versiones.",
    ceiling: "solo lo usan los que programan en TypeScript o JavaScript.",
    purpose: "librería",
    audiences: ["solo técnicos", "el equipo"],
    fitsCadence: ["cada semana", "cada mes", "casi nunca"],
    needsInstallation: true,
    needsAccounts: false,
    needsDatabase: false,
    stack: {
      framework: "Una biblioteca con su API pública y su versión",
      language: "TypeScript, compilado a JavaScript",
      styling: "No hay interfaz",
      testing:
        "Vitest para las unidades. El caso más importante: la API pública tal y como la usa quien la instala",
      data: "Ninguno. Quien la usa aporta sus datos",
      hosting: "Ninguno. Se publica en un registro de paquetes",
      authentication: "Ninguna",
      deployment: "Publicar una versión en el registro de paquetes",
      structure: [
        "src/: el código de la biblioteca",
        "src/index.ts: lo que se exporta. Todo lo demás es interno",
      ],
    },
  },
  {
    id: "libreria-python",
    name: "Paquete de Python",
    what: "un piece de código que otros instalan con `pip install`.",
    cost: "casi nada de infraestructura. El coste es mantenerlo compatible con varias versiones de Python.",
    ceiling: "solo lo usan los que programan en Python.",
    purpose: "librería",
    audiences: ["solo técnicos", "el equipo"],
    fitsCadence: ["cada semana", "cada mes", "casi nunca"],
    needsInstallation: true,
    needsAccounts: false,
    needsDatabase: false,
    stack: {
      framework: "Una biblioteca con su API pública y su versión",
      language: "Python",
      styling: "No hay interfaz",
      testing: "pytest para las unidades, y el caso de uso tal y como lo usa quien la instala",
      data: "Ninguno. Quien la usa aporta sus datos",
      hosting: "Ninguno. Se publica en un registro de paquetes",
      authentication: "Ninguna",
      deployment: "Publicar una versión en el registro de paquetes",
      structure: [
        "src/: el código de la biblioteca",
        "src/__init__.py: lo que se exporta. Todo lo demás es interno",
      ],
    },
  },
  {
    id: "informe-automatico",
    name: "Informe que se genera solo",
    what: "un programa que corre por su cuenta y deja el informe hecho: un PDF o una página web.",
    cost: "un planificador y un poco de almacenamiento. Casi nada.",
    ceiling: "no se puede explorar a mano. Si hay que responding preguntas, hace falta otra cosa.",
    purpose: "informe",
    audiences: ["el equipo", "clientes"],
    fitsCadence: ["cada semana", "cada mes"],
    needsInstallation: false,
    needsAccounts: false,
    needsDatabase: false,
    stack: {
      framework: "Un programa que lee los datos y escribe el informe",
      language: "TypeScript o Python",
      styling: "La plantilla del informe: HTML con CSS, o un PDF",
      testing:
        "Tests del informe: el mismo caso produce el mismo resultado. Vitest o pytest, según el lenguaje",
      data: "Los datos de los que se parte: ficheros, una API o una base de datos",
      hosting: "Un planificador que lo lanza",
      authentication: "Las credenciales de los datos, en el entorno",
      deployment: "El planificador lo lanza desde el repositorio",
      structure: [
        "src/informe/: la generación",
        "src/plantillas/: las plantillas",
      ],
    },
  },
  {
    id: "panel-de-datos",
    name: "Panel para mirar los datos",
    what: "una web donde se exploran los datos con filtros y gráficos.",
    cost: "un servidor y una base de datos, y alguien que los mantenga.",
    ceiling: "si hay que investigar a fondo, un panel acaba siendo insuficiente: mejor un notebook.",
    purpose: "informe",
    audiences: ["el equipo", "clientes"],
    fitsCadence: ["cada semana", "cada mes"],
    needsInstallation: false,
    needsAccounts: true,
    needsDatabase: true,
    stack: {
      framework: "Next.js con App Router",
      language: "TypeScript",
      styling: "Tailwind CSS y componentes compartidos",
      testing:
        "Playwright para el e2e: un test por criterio de aceptación, con el título empezando por `AC-n`. Vitest para las unidades",
      data: "PostgreSQL, en lectura, o la fuente de datos original",
      hosting: "Un servidor de aplicación y una base de datos gestionada",
      authentication: "Cuentas del equipo",
      deployment: "Despliegue continuo desde el repositorio",
      structure: [
        "apps/web/: el panel, con app/ para las rutas",
        "packages/ui/: los componentes compartidos",
        "packages/db/: el acceso a los datos, en lectura",
      ],
    },
  },
]

/**
 * The four plain-language questions.
 *
 * @remarks
 * They are asked one at a time. The options come with examples, because a
 * blank question gets a blank answer.
 */
export const LAYER_A_QUESTIONS = [
  {
    id: "purpose",
    question: "¿Para qué va a servir?",
    hint: "Elige lo que más se parezca. Siempre puedes decir «otro» y contarlo con tus palabras.",
    options: [
      { value: "web o blog", example: "una web o un blog" },
      { value: "herramienta interna", example: "una herramienta para el equipo" },
      { value: "app de móvil", example: "una app para el teléfono" },
      { value: "API para otros", example: "una API que usan otros programas" },
      { value: "librería", example: "una librería que otros instalan" },
      { value: "informe", example: "un informe que se genera" },
      { value: "otro", example: "cuéntalo con tus palabras" },
    ],
  },
  {
    id: "audience",
    question: "¿Quién lo va a usar?",
    hint: "Esto decide si hace falta(login, cuentas, permisos).",
    options: [
      { value: "cualquiera", example: "cualquiera que lo encuentre" },
      { value: "el equipo", example: "la gente de la empresa" },
      { value: "clientes", example: "clientes de la empresa" },
      { value: "solo técnicos", example: "solo gente que programa" },
    ],
  },
  {
    id: "firstMinute",
    question: "¿Qué tiene que pasar en el primer minuto?",
    hint: "La acción principal, con tus palabras. Por ejemplo: «que alguien lea un artículo y lo comente».",
    options: [],
  },
  {
    id: "cadence",
    question: "¿Cada cuánto cambia?",
    hint: "Esto decide cuánto hace falta la arquitectura. Si cambia poco, se puede hacer simple.",
    options: [
      { value: "cada semana", example: "cambia cada semana" },
      { value: "cada mes", example: "cambia cada mes" },
      { value: "casi nunca", example: "casi nunca" },
    ],
  },
] as const

/**
 * The technical questions, for when the person wants to go into detail.
 *
 * @remarks
 * All of them have options. A blank form gets a blank answer, and a blank
 * answer means the decision was not made.
 */
export const LAYER_C_QUESTIONS = [
  {
    id: "language",
    question: "¿En qué lenguaje?",
    options: ["TypeScript", "Python", "otro"],
  },
  {
    id: "hosting",
    question: "¿Dónde se hospeda?",
    options: [
      "Un CDN (sitio estático)",
      "Un servidor propio",
      "Funciones sin servidor",
      "La nube del proveedor",
      "Sin hosting (una librería o una CLI)",
    ],
  },
  {
    id: "authentication",
    question: "¿Hace falta que la gente entre con una cuenta?",
    options: ["No hace falta", "Sí, con email", "Sí, con la cuenta de la empresa", "Decidir más tarde"],
  },
  {
    id: "data",
    question: "¿Dónde viven los datos?",
    options: [
      "En el repositorio (ficheros)",
      "En una base de datos",
      "En otro servicio que ya existe",
      "Todavía no se sabe",
    ],
  },
  {
    id: "deployment",
    question: "¿Cómo se publica?",
    options: [
      "Automático al hacer push",
      "A mano, cuando toca",
      "Todavía no se sabe",
    ],
  },
] as const
