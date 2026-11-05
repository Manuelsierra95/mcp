---
type: Progress
title: El núcleo del BRAIN
description: "Dónde estamos y qué queda. Lo primero que se construyó: el motor que lee, valida, indexa y comprueba el BRAIN."
tags: [brain, fase-1, motor]
generated: { by: "humano", at: 2026-11-05T09:00:00Z }
status: draft
---

# El núcleo del BRAIN

## Qué hay

**El motor** (`packages/brain-core`): lee el bundle, valida cada concepto
contra OKF, genera los índices, busca por texto y metadatos, y evalúa las
reglas comprobables contra un cambio.

```
pnpm brain lint             # valida el bundle
pnpm brain index [--check]  # regenera (o comprueba) los listados
pnpm brain search <query>   # busca por texto, título, descripción o etiquetas
pnpm brain read <path>      # lee un concepto
pnpm brain context <paths>  # el contexto de trabajo para unas rutas
pnpm brain check            # la puerta: bundle válido, reglas, documentación
```

**La semilla** (`docs/`): cuatro convenciones (arquitectura, estilo, testing,
Next.js), dos patrones (el BRAIN como fuente de verdad, reglas comprobables),
cuatro reglas comprobables y seis decisiones.

## Qué falta

| Pieza | Para qué |
|---|---|
| El servidor MCP | Que los IDEs consulten el BRAIN: `brain_context`, `brain_search`, `brain_read`, `brain_record`, `brain_note`, `brain_check` |
| Los hooks | Claude Code y OpenCode: bloquear editar sin consultar, escribir en `docs/` a mano, y terminar sin documentar |
| La CI | `pnpm brain check` y `pnpm brain index --check` en cada PR |
| La suite e2e | Para que la regla de los títulos `AC-n` tenga algo que comprobar |

## La regla que se está aplicando ahora

Antes de escribir código, se lee el BRAIN. Antes de terminar, se documenta lo
que pasó. Esa es la idea entera, y hasta que el MCP y los hooks estén, se
hace a mano.
