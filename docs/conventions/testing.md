---
type: Convention
title: Cómo se prueba aquí
description: Qué se prueba con e2e y qué con unit tests, y el contrato de títulos AC-n que hace el TDD verificable. Se aplica al añadir tests y al añadir functionality.
tags: [testing, e2e, playwright, ac]
generated: { by: "humano", at: 2026-11-05T09:00:00Z }
status: stable
---

# Cómo se prueba aquí

## Dos niveles, con criterios distintos

| Nivel | Qué prueba | Dónde | Cuándo |
|---|---|---|---|
| **e2e** | Lo que el usuario hace y ve | `packages/tests/` (Playwright) | Toda funcionalidad con cara de usuario |
| **unit** | Una función, un borde, una regla | Junto al código, con `node:test` | Lógica pura: parseo, reglas, cálculos |

## El contrato AC-n

El título de un test e2e **empieza por el id del criterio de aceptación**:

```ts
test("AC-1 · la home muestra el título del proyecto", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("heading", { name: "Project ready!" })).toBeVisible()
})
```

No es un estilo: es un contrato. La fábrica usa ese prefijo para ejecutar **un solo** test (`--grep "AC-1"`) y comprobar que falla antes de la implementación y pasa después. Un test que no empieza por `AC-` no es trazable a nada y la fábrica no lo puede usar.

## Reglas

- Un criterio de aceptación, un test. Si el test hace tres cosas, son tres AC.
- El test dice qué espera, no cómo lo hace. `getByRole("button", { name: "Exportar" })`, no `querySelector("button.export")`.
- Nada de `waitForTimeout`. Se espera por estado, no por reloj.
- Un test que depende de otro es un test que falla solo en CI.

## Unit tests

- `node:test` y `node:assert`. Sin dependencias extra: el runner viene con Node.
- Una función pura se prueba sin mocks. Si hace falta un mock, la función quizá tiene demasiadas responsabilidades.
- El nombre del test dice el comportamiento: `it("returns null when the file does not exist")`.

## Qué se ejecuta y cuándo

| Momento | Qué |
|---|---|
| Al commit | El linter y el typecheck |
| En CI | Linter, typecheck, unit tests y e2e |
| Antes de dar algo por terminado | `pnpm brain check` |

## Lo que no se hace

- Un test que pasa sin probar nada. Si no falla cuando el comportamiento se rompe, no es un test.
- Snapshots de HTML. Fallan por cualquier cambio de markup y no dicen qué se rompió.
- Tests que dependen de la red.
