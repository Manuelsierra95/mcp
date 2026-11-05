---
type: Lesson
title: Una regla que no dispara es peor que no tenerla
description: La regla de imports profundos no se ejecutaba nunca, porque comparaba el import con igualdad exacta. Una puerta que no se cierra da una falsa sensación de seguridad.
tags: [brain, rules, motor, error]
generated: { by: "humano", at: 2026-11-05T09:00:00Z }
status: stable
---

# Una regla que no dispara es peor que no tenerla

## Qué pasó

La primera regla del BRAIN prohíbe importar el interior de un paquete:

```yaml
check:
  kind: forbidden-import
  value: "@workspace/ui/src/"
```

El motor comparaba el import **con igualdad exacta**: `imports.includes(valor)`.
Y el import real es `@workspace/ui/src/components/button`, que no es igual a
`@workspace/ui/src/`. La regla no disparaba **nunca**, y el test que la
cubría también fallaba, pero el fallo parecía del test y no de la regla.

## Por qué importa

Una puerta que no se cierra es peor que no tenerla: quien se fía de ella
deja de mirar. Y el síntoma (todo pasa, todo verde) es exactamente el que
hace que nadie lo mire.

## Qué se hace

- **El valor de un import se compara como prefijo** cuando termina en `/`, y
  como paquete cuando no: `zod` casa con `zod/v4`, y `@workspace/ui/src/`
  casa con cualquier import que llegue dentro.
- **Cada regla tiene un test que la hace fallar.** Una regla sin un caso que
  la dispare no está probada: el test verde no dice nada.
- **Un fallo de test se lee como un fallo del motor**, no del test. Aquí
  parecía un problema de sintaxis del matcher.

## La regla general

Un mecanismo que no se ha visto fallar **no está probado**. La prueba de un
mecanismo es que falle cuando tiene que fallar.
