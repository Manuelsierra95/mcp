---
type: Progress
title: El BRAIN, el MCP y los hooks
description: Dónde estamos después de montar el motor, el servidor MCP, los hooks y la suite e2e. Y qué queda.
tags: [brain, mcp, hooks, e2e, fase-2, fase-3]
generated: { by: "humano", at: 2026-11-05T09:00:00Z }
status: draft
---

# El BRAIN, el MCP y los hooks

## Qué hay

**El BRAIN** (`docs/`): cuatro convenciones, dos patrones, cuatro reglas
comprobables, seis decisiones y este avance.

**El motor** (`packages/brain-core`): lee el bundle, valida cada concepto
contra OKF v0.2, genera los índices, busca y evalúa las reglas.

**El servidor MCP** (`packages/brain-mcp`): seis tools (`brain_context`,
`brain_search`, `brain_read`, `brain_record`, `brain_note`, `brain_check`),
los conceptos como resources y `brain-start` como prompt. Habla por stdio:
sin servicio, sin puertos, sin claves.

**Los hooks** (`packages/brain-hooks`): las mismas tres puertas en Claude Code
y en OpenCode. Bloquean editar sin consultar, escribir en `docs/` a mano, y
terminar sin documentar.

**La suite e2e** (`packages/tests`): Playwright con un solo navegador, y el
contrato de títulos `AC-n · …`.

## Las tres puertas

| Puerta | Qué bloquea | Claude Code | OpenCode |
|---|---|---|---|
| Entrada | Editar sin consultar el BRAIN | `PreToolUse` + exit 2 | `tool.execute.before` + throw |
| Escritura | Escribir en `docs/` a mano | `PreToolUse` + exit 2 | `tool.execute.before` + throw |
| Salida | Terminar sin documentar | `Stop` + exit 2 | `session.idle` + aviso |

La de OpenCode avisa, no bloquea: no tiene un `Stop` que devuelva al agente.

## Qué falta

| Pieza | Para qué |
|---|---|
| **Probar los hooks de verdad** | Ahora están probados a mano, con la entrada simulada. Falta una sesión real de Claude Code y otra de OpenCode |
| **`pnpm brain:setup`** | Escribir la configuración MCP en los clientes que la tengan en otro sitio |
| **Más reglas** | Ahora hay cuatro. Cada convención que se pueda comprobar, una regla más |
| **Un `Lesson` real** | El primer error de verdad, escrito por quien lo cometa |

## Lo que se está aplicando ahora

El BRAIN se consulta antes de escribir y se documenta después. Los hooks lo
hacen obligatorio en los dos clientes que los soportan, y la CI lo hace
obligatorio en el merge.
