---
type: Pattern
title: Feature Driven Development
description: "Cómo se trabaja en este proyecto cuando algo se pide por functionality: primero la feature, luego sus escenarios, luego el código. Se aplica a las features y a las rutas bajo features/."
tags: [fdd, fdd, feature, escenarios]
generated: { by: "humano", at: 2026-11-06T10:00:00Z }
status: stable
---

# Feature Driven Development

## La idea

El TDD normal empieza por un test: rojo, verde, refactor. FDD empieza un
punto antes: por **qué** se pide la funcionalidad y **qué tiene que pasar**
para que esté hecha. El test sale del escenario, no al revés.

La diferencia no es de método, es de orden. En FDD el escenario se escribe
antes de existir el código, y el test es su traducción ejecutable. Cuando el
código y el test no coinciden, el que se equivoca es el código.

## Los artefactos

| Artefacto | Dónde vive | Quién lo escribe |
|---|---|---|
| **Feature** | `docs/features/<slug>.md` (tipo `Feature`) | `brain_record` |
| **Feature slice** | Secciones `## Slices` dentro del mismo documento | `brain_record` |
| **Scenario** (given/when/then) | Dentro de la feature, con id `AC-n` | `brain_record` |
| **Feature file** (Gherkin) | `features/<slug>.feature`, en la raíz del repositorio | El agente |
| **Glossary** (lenguaje ubicuo) | `docs/glossary/<termino>.md` | `brain_record` |
| **Tests** | `packages/tests/e2e/`, con el título `AC-n · …` | El agente |
| **El método** | Este documento | Una persona |

## Los slices

Una feature se entrega en **slices**: grupos de escenarios que se pueden
entregar por separado y que valen algo por sí solos. No son fases ni
milestones: son trozos que funcionan.

El criterio para partir una feature es el **valor**: un slice que no se
puede usar por separado no es un slice, es una parte.

## Los escenarios

Un escenario es un caso concreto, escrito en Given/When/Then, con su
identificador `AC-n`:

```
### AC-3 · Exporta el pedido a CSV

**Given** un pedido confirmado con tres líneas
**When** alguien pide la exportación
**Then** se descarga un CSV con esas tres líneas
```

El `AC-n` es **global en el proyecto**. Es lo que une el escenario con su
test: el título del test empieza por el mismo id.

## El glosario

El lenguaje ubicuo: los términos del dominio, con **un** significado cada
uno. Un término nuevo se añade al glosario **antes** de usarse en el
código, no después.

El glosario es lo que evita la conversación endlessly: cuando dos personas
dicen "pedido", quieren decir lo mismo. Un término sin definición es una
fuente de discussion que no se arregla sola.

## El ciclo

```
1. La feature        →  docs/features/<slug>.md, con sus slices
2. Los escenarios     →  cada uno con su AC-n
3. El test            →  packages/tests/e2e/, con el título AC-n · …
4. El código          →  lo mínimo para que el test pase
5. El glosario        →  los términos que aparecieron por el camino
```

El paso 3 y el 4 son el TDD de siempre. Lo que añade FDD son los pasos 1,
2 y 5: **el porqué y el qué, antes del cómo**.

## Qué se gana

- **El test y el escenario no pueden separarse.** Los dos tienen el mismo
  id, y hay una regla que lo comprueba en las dos direcciones.
- **Un cambio sin criterio de aceptación no entra.** Si no hay un `AC-n`,
  no hay un test, y si no hay test no hay feature.
- **El BRAIN crece con el proyecto**, no con el código: cada feature deja
  escrito qué se pidió y por qué.

## Cómo lo hace exigible

FDD se vuelve una intención cuando sus reglas son comprobables. En este
proyecto lo son:

| Regla | Qué comprueba |
|---|---|
| Cada escenario tiene su test e2e | Que no haya un `AC-n` sin test |
| Ningún test sin escenario | Que no haya un test sin `AC-n` en una feature |
| Toda feature tiene al menos un slice | Que la feature está troceada |
| Ningún término del glosario queda sin usar | Que el glosario no se llena de vocabulario muerto |

Las reglas viven en `docs/rules/` y se comprueban en la puerta (`pnpm brain
check`). Cambiar el BRAIN cambia el proceso: **cero código**.
