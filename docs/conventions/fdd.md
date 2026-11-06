---
type: Convention
title: "Feature Driven Development: cómo se trabaja en las features"
description: "El proceso de FDD y los artefactos que produce, en las rutas de features y de tests. Se aplica a docs/features/**, a features/** y a packages/tests/**."
tags: [fdd, feature, escenarios, testing]
generated: { by: "humano", at: 2026-11-06T10:00:00Z }
status: stable
applies_to:
  - "docs/features/**"
  - "features/**"
  - "packages/tests/**"
---

# Feature Driven Development: cómo se trabaja en las features

## El orden

1. **La feature** se escribe antes que el código: qué se pide, por qué, y
   en qué trozos se entrega.
2. **Los escenarios** van dentro de la feature, en Given/When/Then, con su id
   `AC-n`. El id es **global en el proyecto**.
3. **El test** va en `packages/tests/e2e/`, con el título empezando por el
   mismo `AC-n · …`.
4. **El código** es lo mínimo para que ese test pase.
5. **El glosario** recoge los términos que aparecieron por el camino.

## Los artefactos y dónde viven

| Qué | Dónde | Cómo se escribe |
|---|---|---|
| Feature | `docs/features/<slug>.md` | `brain_record` con `type: "Feature"` |
| Slice | Sección `## Slices` de la feature | `brain_record` |
| Scenario | Sección `### AC-n · <qué pasa>` de la feature | `brain_record` |
| Feature file | `features/<slug>.feature` | El agente |
| Término | `docs/glossary/<termino>.md` | `brain_record` con `type: "Glossary"` |
| Test | `packages/tests/e2e/*.spec.ts` | El agente |

## Cómo se escribe una feature

```markdown
---
type: Feature
title: Exportar un pedido
description: "Qué se pide, en una frase. Se aplica cuando alguien exporta un pedido."
tags: [exportacion, pedidos]
---

# Exportar un pedido

## El porqué

Alguien necesita los datos de un pedido para otra herramienta.

## Slices

### AC-3 · Exporta el pedido a CSV

**Given** un pedido confirmado con tres líneas
**When** alguien pide la exportación
**Then** se descarga un CSV con esas tres líneas
```

## Las reglas, en una línea

- Una feature, al menos un slice. Un slice que no vale por sí solo no es un
  slice.
- Un escenario, un test. Y al revés: un test, un escenario.
- El `AC-n` del escenario y el del test son el mismo.
- Un término del glosario, un significado. Si aparece otro, se añade.

## Qué se comprueba

Las reglas de FDD están en `docs/rules/` y se comprueban en la puerta. Se
aplican a estas rutas, así que `brain_context` con una ruta de features
devuelve este documento y las reglas que la gobiernan, sin tocar el
servidor.

## Lo que no se hace

- Un test sin escenario. Un test sin `AC-n` es una intención, no un criterio.
- Un escenario sin test. Un escenario que nadie comprueba no es un
  criterio, es una promesa.
- Una feature sin slices. Una feature que no se puede trocear se entrega
  entera, y eso no se puede revisar.
- Un término nuevo en el código sin pasar por el glosario.
