# PLAN · BRAIN + MCP

> **Estado:** v3 · **Fecha:** 2026-11-06
> **Dónde:** `ai-factory-v2/` (monorepo nuevo). El proyecto anterior queda en `ai-factory_v1/`, archivado.
> **Sustituye a:** el plan de la IA Factory, archivado en [`FASE_V2-AI-FACTORY.md`](./FASE_V2-AI-FACTORY.md)

---

## 1. Qué quiero

Un **servidor MCP** en el repo que haga que cualquier IDE o TUI con el que trabaje el equipo:

1. **Siga los patrones y la arquitectura del proyecto**, no sus improvisaciones.
2. **Use el BRAIN** antes de decidir, y no después.
3. **Vaya documentando el BRAIN** con lo que pasa: avances, errores, decisiones.

El BRAIN vive en **`docs/`, en la raíz del repo**, en formato **OKF**.

Y para que no dependa de la buena voluntad del agente, **hooks en Claude Code y OpenCode** que bloquean de verdad: no se toca código sin haber consultado el BRAIN, no se escribe en `docs/` a mano, y no se termina una tarea sin documentarla.

Nada más. Ni agentes, ni pipeline, ni sandboxes, ni modelos.

---

## 2. La idea central: el BRAIN es ejecutable

Un BRAIN que solo contiene prosa no fuerza nada: nadie lo lee y nadie lo puede comprobar. Este tiene **dos clases de conceptos**:

| Clase | Tipos | Para qué | Quién lo escribe |
|---|---|---|---|
| **Documental** | `Convention`, `Pattern`, `Decision`, `Lesson`, `Progress`, `Problem`, `Spec`, `Solution` | Que el agente (y la persona) entienda cómo trabaja el proyecto | Personas y agentes, con `brain_record` |
| **Ejecutable** | `Rule` | Que el cambio se pueda **comprobar** | Personas, con `brain_record` |

Una `Rule` lleva la regla en datos, no en prosa:

```markdown
---
type: Rule
title: Cada endpoint valida su entrada con zod
description: La validación va en el borde de la API, no dentro del handler.
tags: [api, validacion, zod]
generated: { by: "humano", at: 2026-11-05T09:00:00Z }
status: stable
severity: blocker
applies_to: "apps/web/app/api/**"
check:
  kind: forbidden-import
  value: "zod"
  message: "El endpoint debe validar con zod en app/api/**/_schema.ts, no dentro del handler."
---
```

Cinco tipos de comprobación, todos declarativos, y uno que compara dos sitios:

| `check.kind` | Qué comprueba |
|---|---|
| `forbidden-path` / `required-path` | Rutas que no se pueden tocar, o que tienen que existir |
| `forbidden-import` / `required-import` | Imports que no pueden aparecer, o que tienen que aparecer |
| `forbidden-text` / `required-text` | Patrones que no pueden aparecer, o que tienen que aparecer |
| **`linkage`** | **Que dos sitios estén de acuerdo.** Los `AC-n` de las features contra los títulos de los tests; los términos del glosario contra el código. Es lo que hace que FDD sea exigible y no una intención |

| `check.kind` | Qué comprueba |
|---|---|
| `forbidden-import` | Un import que no puede aparecer en `applies_to` |
| `required-import` | Un import que tiene que aparecer |
| `required-path` | Un fichero o carpeta que tiene que existir |
| `forbidden-path` | Una ruta que no se puede tocar |
| `required-text` | Un patrón que tiene que aparecer en un fichero (el prefijo `AC-n` de los tests, por ejemplo) |

`severity`: `blocker` y `major` fallan; `minor` avisa.

Una regla que no se pueda comprobar **no es una `Rule`**: es un `Pattern` o una `Convention`, en prosa. La frontera es deliberada: lo comprobable se comprueba, lo demás se documenta.

---

## 3. Las cinco palancas

Un servidor MCP **no puede técnicamente impedir** que un agente de un IDE third-party haga lo que quiera: no puede quitarle las herramientas nativas al cliente. Por eso el plan tiene dos capas: **el MCP hace que cumplir salga barato** (palancas 1–4) y **los hooks hacen que no cumplir cueste** (palanca 5, en los clientes que los soportan).

| # | Palanca | Dónde | Qué hace si el agente la ignora |
|---|---|---|---|
| 1 | **Contrato** | `AGENTS.md` (y `CLAUDE.md`) | El agente va a ciegas: inventa convenciones y el código no encaja |
| 2 | **Contexto** | `brain_context()` | Una llamada da todo; sin ella, el agente adivina |
| 3 | **Verificación** | `brain_check()` + CI | La PR falla con el motivo exacto |
| 4 | **Memoria** | `brain_note()` / `brain_record()` | El BRAIN se queda viejo y deja de servir |
| 5 | **Bloqueo** | Hooks de Claude Code y OpenCode | La herramienta no se ejecuta: el hook la deniega |

Las cuatro primeras las implementa el MCP y valen en **cualquier** cliente MCP. La quinta depende del cliente y es la que hace que el cumplimiento no dependa de la buena voluntad.

El orden importa: la 1 dice qué hacer, la 2 lo hace fácil, la 3 y la 5 lo hacen obligatorio, y la 4 deja rastro.

---

## 4. El BRAIN

### 4.1 Dónde y qué formato

`docs/` en la raíz del repo. Bundle **OKF v0.2** (la spec canónica es
[`GoogleCloudPlatform/open-knowledge-format`](https://github.com/GoogleCloudPlatform/open-knowledge-format);
la copia bajo `knowledge-catalog/okf` está congelada y no se usa como referencia).

### 4.2 Estructura

```
docs/
├── index.md              # generado: navegación progresiva
├── log.md                # append-only: un evento por línea
├── conventions/          # cómo trabaja este proyecto
├── patterns/             # patrones de diseño y arquitectura que seguimos
├── rules/                # reglas comprobables (check.kind)
├── decisions/            # ADR: decisiones duraderas
├── lessons/              # errores que nos llevamos, y por qué
├── progress/             # avances: qué se ha hecho y qué queda
├── problems/             # problemas que aún no tienen sitio
└── specs/                # especificaciones
```

### 4.3 Frontmatter (OKF v0.2)

`type` obligatorio. El resto, lo que cada tipo necesite:

```yaml
---
type: Rule
title: ...
description: ...      # una frase: es lo que se lee en el índice y en el search
tags: [...]
generated: { by: "...", at: "2026-11-05T09:00:00Z" }
status: draft         # draft | stable | deprecated
---
```

`status` es el lifecycle de OKF, no el nuestro. `Rule` añade `severity`, `applies_to` y `check`.

### 4.4 Reglas de escritura

- **Un concepto = un fichero.** Nada de secciones gigantes.
- **`description` es la puerta**: es lo que se lee en el índice y en los resultados de búsqueda. Va en una frase y dice *cuándo* aplica.
- **El frontmatter no se toca** después de crear el concepto. Lo que evoluciona se añade al final del cuerpo. Así dos ramas que tocan el mismo concepto no chocan.
- **`index.md` y `log.md` los genera la herramienta.** Nadie los edita a mano.
- **Nada de secretos ni de datos personales.** El linter lo bloquea.

### 4.5 La semilla (Fase 1)

Se escriben a mano, con la persona:

- `conventions/arquitectura.md` — dónde vive cada cosa, qué capa habla con cuál, qué no se cruza.
- `conventions/estilo.md` — TypeScript, imports, nombres, formato.
- `conventions/testing.md` — e2e con Playwright, el contrato `AC-n · descripción`, cuándo hace falta unit test.
- `patterns/*` — los patrones que seguimos.
- `rules/*` — la versión ejecutable de lo anterior.
- `decisions/0001-*` — las decisiones ya tomadas (este plan, OKF v0.2, MCP por stdio, hooks).

---

## 5. El servidor MCP

### 5.1 Forma

- **stdio**, no HTTP. El cliente lo arranca; no hay servicio, ni puertos, ni claves, ni despliegue. Es lo que soportan Claude Code, Cursor, OpenCode, Codex y Gemini CLI sin configuración.
- **Lee y escribe el repo directamente.** `BRAIN_ROOT` apunta a la raíz (por defecto, el directorio de trabajo).
- **Sin dependencias de red.** El BRAIN es local.

### 5.2 Tools

| Tool | Qué hace | Cuando se llama |
|---|---|---|
| `brain_context({ task?, paths? })` | **La puerta de entrada.** Devuelve en una sola llamada: las convenciones y patrones que aplican a las rutas tocadas, las reglas comprobables de esas rutas, las decisiones vigentes, el checklist de la tarea, el próximo paso, y los últimos avances y errores | Al empezar cualquier tarea |
| `brain_search({ query, types?, tags?, limit? })` | Busca por texto y por frontmatter. Devuelve solo frontmatter + descripción (divulgación progresiva) | Cuando el contexto no basta |
| `brain_read({ path })` | Lee un concepto entero | Cuando hace falta el detalle |
| `brain_record({ type, title, description, body, ... })` | **La única vía sancionada para escribir en `docs/`.** Valida el frontmatter, deduplica, regenera el índice, añade una línea al log | Al cerrar una tarea, una decisión o una lección |
| `brain_note({ kind, title, body, tags? })` | Registro rápido: avance, error, decisión o duda | Durante el trabajo, en el momento |
| `brain_check({ paths? })` | **El verificador.** Comprueba: BRAIN válido OKF, reglas comprobables de las rutas tocadas, rutas protegidas, y si el cambio actualizó el BRAIN | Antes de dar por terminada una tarea |
| `brain_onboarding({ step })` | **El onboarding de un proyecto que empieza de cero.** Cuatro preguntas en lenguaje llano, una elección entre caminos concretos, y al final las cuatro convenciones | Al empezar un proyecto |

`brain_context()` es deliberadamente **una llamada, no seis**: el coste de complying tiene que ser menor que el de no hacerlo.

### 5.3 Resources

Expuestos para que los IDEs puedan listarlos y leerlos:

`brain://index`, `brain://conventions/*`, `brain://patterns/*`, `brain://rules/*`, `brain://decisions/*`, `brain://lessons/*`, `brain://progress/*`

### 5.4 Prompt

`brain-start` — "empieza la tarea X": devuelve el contexto, el checklist y el próximo paso. Un cliente MCP puede invocarlo con un clic.

### 5.5 Configuración en los clientes

La configuración **va en el repo**, versionada, para que un clone nuevo la traiga:

```jsonc
// .mcp.json (Claude Code)
{
  "mcpServers": {
    "brain": {
      "command": "pnpm",
      "args": ["--filter", "@workspace/brain-mcp", "start"],
      "cwd": "${workspaceFolder}"
    }
  }
}
```

Equivalentes para Cursor (`.cursor/mcp.json`), OpenCode (`opencode.json`) y Codex (`config.toml`). Un comando `pnpm brain:setup` escribe los cuatro.

### 5.6 Qué **no** hace

- No ejecuta código, ni tests, ni comandos de shell. Es un servidor de conocimiento.
- No tiene permisos de escritura fuera de `docs/`.
- No se autentica ni habla con la red.

---

## 6. Los hooks (el bloqueo de verdad)

Los hooks son **por cliente**, y por eso van aparte del MCP. Implementan las tres puertas que el MCP no puede:

| Puerta | Qué bloquea | Claude Code | OpenCode |
|---|---|---|---|
| **Entrada** | Editar código sin haber consultado el BRAIN | `PreToolUse` con matcher `Edit\|Write\|MultiEdit`; **exit code 2** bloquea | Plugin `tool.execute.before` sobre `edit`/`write`/`patch`; **throw** bloquea |
| **Escritura del BRAIN** | Escribir en `docs/` a mano (solo se escribe por MCP) | `PreToolUse` sobre rutas `docs/**`; exit 2 | Plugin `tool.execute.before`: si la ruta empieza por `docs/`, se bloquea |
| **Salida** | Terminar la tarea sin haber documentado | Hook `Stop`: exit 2 hace que Claude **siga trabajando** | Plugin: evento de sesión inactiva, avisa o bloquea |

### 6.1 Cómo se sabe si se consultó el BRAIN

El hook ve las llamadas: cuando el agente llama a `brain_context`, la tool es `mcp__brain__brain_context` (Claude Code) o `brain_context` (OpenCode). El hook **anota** esa llamada en su estado y a partir de ahí permite editar.

- **Claude Code**: el hook es un proceso aparte por invocación → el estado vive en disco: `.factory/hooks/<session_id>.json`. El input del hook trae `session_id` ✓.
- **OpenCode**: el plugin es un proceso vivo → el estado vive en memoria ✓.

### 6.2 Configuración de Claude Code

`.claude/settings.json`, versionado en el repo:

```jsonc
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "mcp__brain__brain_context",
        "hooks": [
          {
            "type": "command",
            "command": "node",
            "args": ["${CLAUDE_PROJECT_DIR}/packages/brain-hooks/claude/context-loaded.mjs"]
          }
        ]
      },
      {
        "matcher": "Edit|Write|MultiEdit|NotebookEdit",
        "hooks": [
          {
            "type": "command",
            "command": "node",
            "args": ["${CLAUDE_PROJECT_DIR}/packages/brain-hooks/claude/guard-write.mjs"]
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node",
            "args": ["${CLAUDE_PROJECT_DIR}/packages/brain-hooks/claude/guard-stop.mjs"]
          }
        ]
      }
    ]
  }
}
```

Los scripts reciben el JSON del evento por **stdin** y contestan con exit code 0 (dejar pasar) o **2** (bloquear, con el motivo en stderr).

### 6.3 Configuración de OpenCode

`.opencode/plugin/brain-guard.ts`, en el repo:

```ts
export const BrainGuard = async ({ project, client, $ }) => ({
  "tool.execute.before": async (input, output) => {
    // 1. Si la llamada es brain_context, se anota y se deja pasar.
    // 2. Si va a docs/**, se bloquea: el BRAIN se escribe por MCP.
    // 3. Si va a código y no se ha consultado el BRAIN, se bloquea.
  },
})
```

OpenCode bloquea la llamada lanzando una excepción en `tool.execute.before`.

### 6.4 Lo que los hooks NO pueden

- **Se pueden desactivar.** Claude Code tiene `--bare` (omite hooks) y los plugins se pueden deshabilitar. OpenCode permite ignorar plugins. Un hook es una puerta, no un muro: quien quiera saltársela puede.
- **Solo existen en los clientes que los soportan.** Cursor, Codex y Gemini siguen teniendo MCP + CI, que es el suelo común.
- **Un hook que se equivoca bloquea trabajo legítimo.** Por eso el hook de salida solo bloquea si hubo cambios de código **y** no hubo ninguna llamada al MCP de escritura; nunca bloquea por estilo.

---

## 7. El contrato (AGENTS.md)

El fichero que todos los IDEs leen. Corto, y sin repetir lo que el MCP ya da:

```markdown
## BRAIN (obligatorio)

Este proyecto se trabaja con el BRAIN (`docs/`, OKF). El servidor MCP `brain` es la vía:

1. **Antes de tocar código**, llama a `brain_context()` con las rutas que vas a tocar. Te da las convenciones, los patrones, las reglas comprobables y el próximo paso. No los deduzcas. Los hooks bloquean la edición si no lo has hecho.
2. **No inventes reglas.** Si no sabes cómo se hace aquí, `brain_search()`; si no está, se escribe con `brain_record()` y se decide con una persona.
3. **Al terminar**, llama a `brain_check()`. Si falla, corrige antes de dar nada por bueno.
4. **Documenta lo que pasó.** `brain_note()` durante el trabajo (avances, errores), `brain_record()` al cerrar (una decisión, una lección, un patrón).

Escribir en `docs/` a mano está prohibido: el índice y el log los genera la herramienta, y el linter de CI rechaza el resto.
```

---

## 8. El gate

### 8.1 Qué comprueba `brain_check`

1. **BRAIN válido**: frontmatter con `type`, `description` presente, rutas dentro del allowlist, sin secretos, `index.md` y `log.md` regenerados, enlaces resolubles.
2. **Reglas comprobables**: cada `Rule` cuyo `applies_to` toca las rutas modificadas se evalúa.
3. **Rutas protegidas**: `**/auth/**`, `**/migrations/**`, `infra/**`, `.github/**`, `**/*.env*`.
4. **Documentación al día**: si el diff toca código y no toca `docs/`, aviso. Si toca una `Rule` y no un `Pattern`/`Convention`, aviso.

### 8.2 Dónde corre

- **Pre-commit** (lefthook): el subconjunto rápido (BRAIN válido + reglas de las rutas staged).
- **CI**: todo, con `brain check --ci` (falla la PR).
- **A mano**: `pnpm brain check`.

El gate es lo que convierte el "forzar" en algo real: **un cambio que no cumple no llega a `main`**.

---

## 9. Fases

| Fase | Qué | Días | DoD |
|---|---|---|---|
| **1 · Núcleo** | `packages/brain-core`: parsear OKF, validar, buscar, generar `index.md` y `log.md`, linter, motor de `Rule`. `docs/` semilla escrita a mano | 3 | `pnpm brain lint` en verde sobre `docs/`; la semilla cubre arquitectura, estilo, testing, patrones, reglas y las primeras decisiones |
| **2 · MCP** | `packages/brain-mcp`: los 6 tools, los resources, el prompt. Configuración en Claude Code, Cursor y OpenCode | 3 | Desde Claude Code, `brain_context()` devuelve el contexto del repo y `brain_search()` encuentra un patrón por su descripción |
| **3 · Gate + hooks** | `brain check` en pre-commit y CI. Hooks de Claude Code (`.claude/settings.json`) y OpenCode (`.opencode/plugin/`). `AGENTS.md` con el contrato. `pnpm brain:setup` | 3 | Una PR que cambia código sin tocar `docs/` falla con el motivo; una PR que rompe una `Rule` falla nombrando la regla; **en Claude Code, editar código sin llamar a `brain_context()` queda bloqueado** |
| **4 · Perro con perro** | Se usa el MCP y los hooks en el repo real, en este mismo trabajo. El BRAIN documenta su propio desarrollo | 2–3 | El BRAIN tiene al menos una `Lesson` real (un error cometido), una `Decision` real y un `Progress` real |

**Total: 11–12 jornadas.** Sin modelos, sin agentes, sin sandboxes, sin gates de aprobación de terceros.

---

## 10. Un día de trabajo, de punta a punta

```
1. El programador pide: "añade un endpoint para exportar métricas"
2. Su IDE lee AGENTS.md. Llama a brain_context({ paths: ["apps/web/app/api/**"] })
3. Recibe, en una llamada:
   - "Los endpoints validan con zod en _schema.ts" (Pattern + Rule)
   - "Los endpoints de solo lectura no necesitan escritura en el BRAIN" (Decision)
   - "Cada endpoint nuevo necesita un test e2e con título AC-n" (Rule)
   - El checklist de la tarea y el próximo paso
4. Intenta editar sin haber llamado a brain_context: el hook lo bloquea
5. Escribe el código siguiendo el patrón, no improvisando
6. Al terminar: brain_check() → verde
7. Durante: brain_note({ kind: "progress", title: "Endpoint de métricas" })
8. Si se equivoca: brain_note({ kind: "error", ... }) y al día siguiente
   brain_record({ type: "Lesson", ... }) → el error ya no se repite
```

El punto 3 es el que lo cambia todo: **el agente no empieza desde cero, empieza desde lo que ya se descubrió**.

---

## 11. Decisiones

| ID | Decisión | Resolución |
|---|---|---|
| D1 | Transporte del MCP | **stdio**. Sin servicio, sin puertos, sin claves |
| D2 | Dónde vive el BRAIN | **`docs/` en la raíz del repo**, bundle OKF v0.2 |
| D3 | ¿Cómo se "fuerza"? | **Cinco palancas**: contrato, contexto, verificación, memoria y **bloqueo por hooks**. El MCP no bloquea al agente: lo hace barato, verificable y, con hooks, no evitable en los clientes que los soportan |
| D4 | ¿BRAIN solo de prosa? | **No**: los tipos `Rule` llevan el `check` y se evalúan |
| D5 | ¿Quién escribe en `docs/`? | **Solo `brain_record` / `brain_note`**. Escritura manual: la bloquean el hook y el linter de CI |
| D6 | ¿El índice y el log? | **Generados**. `index.md` nunca se edita a mano; `log.md` es append-only |
| D7 | ¿Dónde vive el motor? | **`packages/brain-core`**, reutilizable por el MCP, la CI y los hooks |
| D8 | ¿Un tool de contexto o seis? | **Uno** (`brain_context`). El coste de complying tiene que ser menor que el de no hacerlo |
| D9 | ¿La configuración MCP en el repo? | **Sí**, versionada. Un clone nuevo la trae |
| D10 | ¿Qué pasa con `apps/ia-factory`? | **Se archiva** en `ai-factory_v1/`. Es referencia del provider Docker y de la migración a eve rc.5 |
| D11 | ¿Red, permisos, autenticación? | **Ninguno**. El servidor solo lee y escribe `docs/` |
| D12 | ¿Evals del MCP? | Los del propio MCP: cada tool tiene un test de su contrato y del esquema. Los evals de comportamiento del agente, en suyas |
| **D13** | **Hooks: qué clientes** | **Claude Code y OpenCode**. Cursor, Codex y Gemini quedan con MCP + CI, que es el suelo común |
| **D14** | **Hooks: dónde vive el estado** | Claude Code: `.factory/hooks/<session_id>.json` (el hook es un proceso por invocación). OpenCode: memoria del plugin |
| **D15** | **Hooks: qué se bloquea** | **Entrar** (editar sin `brain_context`), **escribir** en `docs/` a mano, y **salir** sin documentar. Nada más: un hook que bloquea de más es un hook que se desactiva |
| **D16** | **Repo de destino** | **`ai-factory-v2/`**, monorepo nuevo. Publicarlo en GitHub y configurarlo como `origin` |

---

## 12. Riesgos

| Riesgo | Mitigación |
|---|---|
| **El agente ignora el MCP** | No se puede técnicamente impedir. Se compensa: el contexto es barato, el gate bloquea el merge, y los hooks bloquean la herramienta en Claude Code y OpenCode |
| **Los hooks se pueden desactivar** (`--bare`, plugins off) | Son una puerta, no un muro. La CI sigue siendo vinculante |
| **Un hook bloquea trabajo legítimo** | Reglas de disparo保守: solo si hubo cambios de código y no hubo escritura en el BRAIN; nunca por estilo |
| El BRAIN se llena de ruido | `brain_note` para lo menor, `brain_record` para lo que dura; deduplicación por `fingerprint`; el índice solo muestra título y descripción |
| El BRAIN queda viejo | La CI exige documentar cuando el código cambia; cada `Rule` lleva `status` y `generated.at` |
| Reglas que no se pueden comprobar | Frontera explícita: si no es un `check.kind` de los cinco, es prosa (`Pattern`/`Convention`) |
| Conflictos de merge en `docs/` | Frontmatter inmutable, `merge=union` en `log.md` y notas, índice regenerado tras el merge |
| El MCP se rompe al cambiar el SDK | El SDK está en el workspace y se versiona con el repo |
| Nadie lo usa | El contrato de `AGENTS.md`, `pnpm brain:setup`, y el propio gate en CI es el primer cliente |

---

## 13. Lo que NO entra en v1

- Agentes, pipelines, sandboxes, modelos, gates de aprobación de terceros. Eso es la [Fase V2](./FASE_V2-AI-FACTORY.md).
- Escritura fuera de `docs/`.
- Red, autenticación, multiusuario, sincronización entre repos.
- Reglas que necesiten análisis semántico del código: solo las cinco comprobaciones declarativas.
- Hooks para Cursor, Codex y Gemini: MCP + CI les vale.
