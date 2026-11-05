---
type: Pattern
title: Una regla comprobable o un patrón, nunca las dos
description: Cómo se decide si una convención se escribe como Rule o como prosa, y por qué esa frontera evita discusiones en cada revisión.
tags: [brain, rules, patterns]
generated: { by: "humano", at: 2026-11-05T09:00:00Z }
status: stable
---

# Una regla comprobable o un patrón, nunca las dos

## La decisión

```
¿Se puede comprobar sin que alguien lo interprete?
├── sí → Rule (con un check)
└── no  → Pattern o Convention (en prosa)
```

## Lo que hace que algo sea comprobable

- Que el resultado sea el mismo para cualquiera que lo mire.
- Que no necesite contexto: "no imports profundos" se comprueba; "el código debe ser legible" no.

## Las seis comprobaciones

| `kind` | Comprueba | Ejemplo |
|---|---|---|
| `forbidden-path` | Una ruta que no se puede tocar | `**/*.env*` |
| `required-path` | Una ruta que tiene que existir | `docs/index.md` |
| `forbidden-import` | Un import que no puede aparecer | `@workspace/ui/src/` |
| `required-import` | Un import que tiene que aparecer | `zod` en los endpoints |
| `forbidden-text` | Un patrón que no puede aparecer | `console\.log` |
| `required-text` | Un patrón que tiene que aparecer | `^test\("AC-\d+ · ` en los e2e |

## Cómo se escribe una regla

```yaml
---
type: Rule
title: Los paquetes se importan por su API pública
description: Ningún fichero importa el interior de un paquete del workspace.
tags: [imports, workspace]
generated: { by: "humano", at: 2026-11-05T09:00:00Z }
status: stable
severity: major
applies_to: "**/*.{ts,tsx}"
check:
  kind: forbidden-import
  value: "@workspace/ui/src/"
  message: "Importa por la API pública: @workspace/ui/components/button."
---
```

Las cuatro partes que importan:

| Parte | Por qué |
|---|---|
| `description` | Es lo que se lee en el índice y en la búsqueda. Dice **cuándo** aplica |
| `severity` | `blocker` y `major` paran el cambio; `minor` avisa |
| `applies_to` | Las rutas que gobierna. Sin esto, la regla no se evalúa nunca |
| `check` | La comprobación, en datos |

## La `Rule` que no se dispara

Una regla cuyo `applies_to` no toca ningún fichero cambiado **no se reporta**. El informe es sobre este cambio, no sobre el repositorio. Por eso una regla que todavía no aplica (los e2e, cuando no existen) no genera ruido.

## Por qué la frontera importa

Una `Rule` que necesita criterio humano hace dos cosas malas: bloquea cambios legítimos y trains al equipo a desactivar la puerta. Cuando eso pasa, la puerta se desactiva para todo.

Cuando una regla no se puede comprobar, se escribe como `Pattern`, con el porqué. El texto de un `Pattern` **no** se evalúa: se lee, se discute cuando hay que discutirlo, y se decide con una persona.
